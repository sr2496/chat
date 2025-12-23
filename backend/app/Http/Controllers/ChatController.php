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
    public function conversations()
    {
        $userId = auth()->id();

        $conversations = auth()->user()
            ->conversations()
            ->whereHas('messages')
            ->with(['users', 'lastMessage'])
            ->withCount([
                'messages as unread_count' => function ($q) use ($userId) {
                    $q->where('sender_id', '!=', $userId)
                        ->whereDoesntHave('readers', function ($r) use ($userId) {
                            $r->where('user_id', $userId);
                        });
                }
            ])
            ->get();

        return ConversationResource::collection($conversations);
    }

    // Create group conversation
    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
        ]);

        $conversation = Conversation::create([
            'name' => $request->name,
            'type' => 'group',
            'created_by' => auth()->id(),
        ]);

        $users = array_merge([$request->user()->id], $request->user_ids);
        $conversation->users()->attach($users, ['is_admin' => $request->user()->id]);


        return new ConversationResource($conversation->load('users', 'lastMessage'));
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
            'file' => 'nullable|mimes:jpg,jpeg,png,mp4,webm,pdf,doc,docx|max:51200', // 50MB
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

        /* ---------------- FILE / IMAGE ---------------- */
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mime = $file->getMimeType();

            $isImage = str_starts_with($mime, 'image/');
            $isVideo = str_starts_with($mime, 'video/');

            $folder = match (true) {
                $isImage => 'chat/images',
                $isVideo => 'chat/videos',
                default  => 'chat/files',
            };

            $path = $file->store($folder, 'public');

            $data['type'] = match (true) {
                $isImage => 'image',
                $isVideo => 'video',
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

        return new MessageResource($message->load('sender'));
    }

    public function messages(Request $request, $conversationId)
    {
        $perPage = $request->get('per_page', 20);

        $messages = Message::with(['sender', 'readers', 'reactions.user'])
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Reverse items so frontend gets oldest → newest
        $messages->setCollection(
            $messages->getCollection()->reverse()->values()
        );

        return MessageResource::collection($messages);
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

        $reaction = MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => auth()->id(),
            'emoji' => $request->emoji,
        ])->first();

        if ($reaction) {
            $reaction->delete();
            $action = 'removed';
        } else {
            $reaction = MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => auth()->id(),
                'emoji' => $request->emoji,
            ]);
            $action = 'added';
        }

        broadcast(new MessageReactionUpdated($message, $reaction, $action))->toOthers();

        return response()->json([
            'action' => $action,
            'emoji' => $request->emoji,
            'user_id' => auth()->id(),
            'message_id' => $message->id,
        ]);
    }

    // Fetch users for search
    public function users()
    {
        $users = User::where('id', '!=', auth()->id())->select('id', 'name')->get();
        return UserResource::collection($users);
    }
}
