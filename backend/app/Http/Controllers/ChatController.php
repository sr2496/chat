<?php

namespace App\Http\Controllers;

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\MessageReactionUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    // List conversations for auth user
    public function conversations(Request $request)
    {
        $userId = auth()->id();
        $limit = $request->get('limit', 20);
        $afterId = $request->get('after_id'); // Cursor for pagination

        $query = auth()->user()
            ->conversations()
            ->where(function ($q) {
                $q->where('type', 'group')
                    ->orWhereHas('messages');
            })
            ->with(['users', 'lastMessage'])
            ->withCount([
                'messages as unread_count' => function ($q) use ($userId) {
                    // Get the timestamp of the last message this user read in each conversation
                    // A message is unread if:
                    // 1. It's from someone else (sender_id != userId)
                    // 2. AND either:
                    //    a. User has never read any message in this conversation, OR
                    //    b. Message was created AFTER the user's last read message
                    
                    $q->where('sender_id', '!=', $userId)
                        ->where(function ($subQ) use ($userId) {
                            // Messages that don't have a read record for this user
                            $subQ->whereDoesntHave('readers', function ($r) use ($userId) {
                                $r->where('user_id', $userId);
                            });
                        });
                }
            ])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest()
                    ->limit(1)
            );

        // Apply cursor pagination
        if ($afterId) {
            $query->where('conversations.id', '<', $afterId);
        }

        // Fetch one extra to check if there are more
        $conversations = $query->limit($limit + 1)->get();

        // Check if there are more results
        $hasMore = $conversations->count() > $limit;
        if ($hasMore) {
            $conversations->pop(); // Remove the extra item
        }

        return response()->json([
            'data' => ConversationResource::collection($conversations),
            'meta' => [
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? $conversations->last()?->id : null,
            ],
        ]);
    }

    // Create group conversation
    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
            'avatar' => 'nullable|image|max:5120', // 5MB max
        ]);

        $data = [
            'name' => $request->name,
            'type' => 'group',
            'created_by' => auth()->id(),
        ];

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('chat/avatars', 'public');
            $data['avatar'] = $path;
        }

        $conversation = Conversation::create($data);

        // Attach creator as admin
        $conversation->users()->attach($request->user()->id, ['is_admin' => true]);
        
        // Attach other users as members
        if (!empty($request->user_ids)) {
            $conversation->users()->attach($request->user_ids, ['is_admin' => false]);
        }

        // --- System Messages (Group Created, Members Added) ---
        // 1. "Created group"
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'type' => 'system',
            'message' => auth()->user()->name . ' created group "' . $conversation->name . '"',
        ]);

        // 2. "Added users"
        if (!empty($request->user_ids)) {
            $addedUsers = User::whereIn('id', $request->user_ids)->pluck('name');
            $text = auth()->user()->name . ' added ' . $addedUsers->join(', ', ' and ');
            
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => auth()->id(),
                'type' => 'system',
                'message' => $text,
            ]);
        }

        // --- Broadcast to let others know they are in a new conversation ---
        $resource = new ConversationResource($conversation->load('users', 'lastMessage'));
        
        foreach ($request->user_ids as $uid) {
            broadcast(new \App\Events\UserAddedToConversation($resource, $uid));
        }

        return $resource;
    }

    public function createPrivateConversation(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $authUserId = $request->user()->id;
        $otherUserId = $request->user_id;

        // Check if a private conversation already exists
        $conversation = Conversation::where('type', 'private')
            ->whereHas('users', fn($q) => $q->whereIn('user_id', [$authUserId, $otherUserId]), '=', 2)
            ->first();

        if (!$conversation) {
            // Create new private conversation
            $conversation = Conversation::create([
                'type' => 'private',
                'created_by' => $authUserId,
            ]);
            $conversation->users()->attach([$authUserId, $otherUserId]);
        }

        return new ConversationResource(
            $conversation->load('users', 'lastMessage')
        );
    }

    // Send message
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'file' => 'nullable|mimes:jpg,jpeg,png,gif,mp4,webm,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar,7z,tar,weba,wav,m4a,mp3,oga,ogg,opus|max:51200', // 50MB
        ]);

        $data = [
            'conversation_id' => $conversationId,
            'sender_id' => auth()->id(),
            'type' => 'text',
        ];

        /* ---------------- TEXT MESSAGE ---------------- */
        if ($request->filled('message')) {
            $data['message'] = $request->message;
        }

        if ($request->filled('reply_to_message_id')) {
            $data['reply_to_message_id'] = $request->reply_to_message_id;
        }

        /* ---------------- FILE / IMAGE ---------------- */
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $serverMime = $file->getMimeType();
            $clientMime = $file->getClientMimeType();

            $isImage = str_starts_with($serverMime, 'image/');
            $isVideo = str_starts_with($serverMime, 'video/');

            // Check both server and client mime for audio.
            // WebM is often detected as video by server (container), but client knows it's audio.
            $isAudio = str_starts_with($serverMime, 'audio/') || str_starts_with($clientMime, 'audio/');

            $folder = match (true) {
                $isImage => 'chat/images',
                $isVideo && !$isAudio => 'chat/videos',
                $isAudio => 'chat/audio', // Prioritize audio if ambiguous (e.g. video/webm container but audio content)
                default  => 'chat/files',
            };

            $path = $file->store($folder, 'public');

            $data['type'] = match (true) {
                $isImage => 'image',
                $isVideo && !$isAudio => 'video',
                $isAudio => 'audio',
                default  => 'file',
            };

            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        // ❗ Ensure at least text or file exists
        if (empty($data['message']) && !$request->hasFile('file')) {
            return response()->json([
                'message' => 'Message or file is required'
            ], 422);
        }

        $message = Message::create($data);

        // broadcast event with Laravel Echo
        broadcast(new MessageSent($message))->toOthers();

        // Send push notifications to other users in conversation
        $conversation = Conversation::with('users')->find($conversationId);
        $recipients = $conversation->users->where('id', '!=', auth()->id());
        
        $webPushService = new \App\Services\WebPushService();
        $sender = auth()->user();
        
        foreach ($recipients as $recipient) {
            // Skip if user has Do Not Disturb enabled
            if ($recipient->isNotificationMuted()) {
                continue;
            }
            
            $title = $conversation->type === 'group' 
                ? $conversation->name 
                : $sender->name;
            
            // Respect message preview preference
            $body = $recipient->notification_preview 
                ? ($message->message ?? 'Sent a file')
                : 'New message';
            
            try {
                $webPushService->sendToUser(
                    $recipient->id,
                    $title,
                    $body,
                    [
                        'conversationId' => $conversation->id,
                        'messageId' => $message->id,
                    ]
                );
            } catch (\Exception $e) {
                // Log but don't fail message sending if push fails
                \Log::warning('Push notification failed', ['error' => $e->getMessage()]);
            }
        }

        return new MessageResource($message->load('sender'));
    }

    public function messages(Request $request, $conversationId)
    {
        $limit = $request->get('limit', 30);
        $beforeId = $request->get('before_id');

        $query = Message::with(['sender', 'readers', 'reactions.user', 'replyTo.sender'])
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at', 'desc');
        // Reverse items so frontend gets oldest → newest
        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'data' => MessageResource::collection($messages),
            'meta' => [
                'has_more' => $messages->count() >= $limit,
                'oldest_id' => $messages->first()?->id,
            ],
        ]);
    }


    public function markAsRead(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ]);

        $userId = auth()->id();

        foreach ($request->message_ids as $messageId) {
            DB::table('message_reads')->updateOrInsert(
                [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                ],
                [
                    'read_at' => now(),
                ]
            );
        }

        broadcast(new MessageRead(
            $request->conversation_id,
            $request->message_ids,
            auth()->id()
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }

    public function toggle(Request $request, Message $message)
    {
        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $userId = auth()->id();

        // Find existing reaction by this user (any emoji)
        $existing = MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => $userId,
        ])->first();

        if ($existing) {
            if ($existing->emoji === $request->emoji) {
                // Same emoji → remove (toggle off)
                $existing->delete();
            } else {
                // Different emoji → update
                $existing->update(['emoji' => $request->emoji]);
            }
        } else {
            // No reaction → create
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $userId,
                'emoji' => $request->emoji,
            ]);
        }

        broadcast(new MessageReactionUpdated(
            $message->id,
            $userId,
            $request->emoji
        ))->toOthers();

        return response()->json(['success' => true]);
    }



    // Fetch users for search with pagination
    public function users(Request $request)
    {
        $userId = auth()->id();
        $limit = $request->get('limit', 20);
        $afterId = $request->get('after_id');
        
        $query = User::where('id', '!=', $userId)
            ->orderBy('name', 'asc');
        
        // Apply cursor pagination
        if ($afterId) {
            $query->where('id', '>', $afterId);
        }
        
        // Fetch one extra to check if there are more
        $users = $query->limit($limit + 1)->get();
        
        // Check if there are more results
        $hasMore = $users->count() > $limit;
        if ($hasMore) {
            $users->pop(); // Remove the extra item
        }
        
        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? $users->last()?->id : null,
            ],
        ]);
    }

    public function leaveGroup(Request $request, Conversation $conversation)
    {
        // Ensure it's a group
        if ($conversation->type !== 'group') {
            return response()->json(['message' => 'Cannot leave a private conversation'], 400);
        }

        // 1. Create System Message (User left)
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(), // The one leaving
            'type' => 'system',
            'message' => auth()->user()->name . " left the group",
        ]);

        // 2. Broadcast event so others see it (before detaching)
        broadcast(new MessageSent($message))->toOthers();
        broadcast(new \App\Events\UserLeftGroup($conversation->id, auth()->id()))->toOthers();

        // 3. Detach user
        $conversation->users()->detach(auth()->id());

        return response()->json(['message' => 'Left group successfully']);
    }

    public function addMembers(Request $request, Conversation $conversation)
    {
        // 1. Validation and Authorization
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($conversation->type !== 'group') {
            return response()->json(['message' => 'Cannot add members to a private conversation'], 400);
        }

        // Check if auth user is admin (optional, based on frontend visibility)
        // $isAdmin = $conversation->users()->where('user_id', auth()->id())->wherePivot('is_admin', true)->exists();
        // if (!$isAdmin) { return response()->json(['message' => 'Unauthorized'], 403); }

        // 2. Filter out users already in the group
        $existingIds = $conversation->users()->pluck('users.id')->toArray();
        $newUserIds = array_diff($request->user_ids, $existingIds);

        if (empty($newUserIds)) {
            return response()->json(['message' => 'Selected users are already in the group'], 422);
        }

        // 3. Attach new users
        $conversation->users()->attach($newUserIds, ['is_admin' => false]);

        // 4. Get User Objects (for response and broadcast)
        $newUsers = User::whereIn('id', $newUserIds)->get()->map(function ($user) {
            // Mimic the pivot data structure or resource format expected by frontend
            $user->is_admin = false; // default for new members
            return $user;
        });

        // 5. System Message
        $adderName = auth()->user()->name;
        $addedNames = $newUsers->pluck('name')->join(', ', ' and ');
        $systemMessageText = "$adderName added $addedNames to the group";

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'type' => 'system',
            'message' => $systemMessageText,
        ]);

        // 6. Broadcast
        // Broadcast message
        broadcast(new MessageSent($message))->toOthers();
        
        // Broadcast user addition (so clients update member list)
        // We broadcast detailed user info so clients can just append it
        broadcast(new \App\Events\UserAddedToGroup($conversation->id, UserResource::collection($newUsers)))->toOthers();

        return response()->json([
            'message' => 'Members added successfully',
            'users' => UserResource::collection($newUsers)
        ]);
    }
}
