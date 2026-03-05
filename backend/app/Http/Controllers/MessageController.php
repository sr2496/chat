<?php

namespace App\Http\Controllers;

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Http\Requests\CursorPaginationRequest;
use App\Http\Requests\MarkAsReadRequest;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\MessageResource;
use App\Jobs\SendPushNotification;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index(CursorPaginationRequest $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $limit = $request->getLimit(30);
        $beforeId = $request->getBeforeId();

        $query = Message::with(['sender', 'readers', 'reactions.user', 'replyTo.sender'])
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'desc');

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

    public function store(SendMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        $conversationId = $conversation->id;

        // Validate reply_to belongs to same conversation
        if ($request->filled('reply_to_message_id')) {
            $exists = Message::where('id', $request->reply_to_message_id)
                ->where('conversation_id', $conversationId)
                ->exists();
            if (!$exists) {
                return response()->json(['message' => 'Reply message does not belong to this conversation'], 422);
            }
        }

        $data = [
            'conversation_id' => $conversationId,
            'sender_id' => auth()->id(),
            'type' => 'text',
        ];

        if ($request->filled('message')) {
            $data['message'] = $request->message;
        }

        if ($request->filled('reply_to_message_id')) {
            $data['reply_to_message_id'] = $request->reply_to_message_id;
        }

        if ($request->hasFile('file')) {
            $data = $this->processFileUpload($request->file('file'), $data);
        }

        if (empty($data['message']) && !$request->hasFile('file')) {
            return response()->json(['message' => 'Message or file is required'], 422);
        }

        $message = Message::create($data);

        broadcast(new MessageSent($message))->toOthers();

        $this->dispatchPushNotifications($conversation, $message);

        return new MessageResource($message->load('sender'));
    }

    public function markAsRead(MarkAsReadRequest $request)
    {
        $conversation = Conversation::findOrFail($request->conversation_id);
        $this->authorize('view', $conversation);

        $userId = auth()->id();

        DB::transaction(function () use ($request, $userId) {
            foreach ($request->message_ids as $messageId) {
                DB::table('message_reads')->updateOrInsert(
                    ['message_id' => $messageId, 'user_id' => $userId],
                    ['read_at' => now()]
                );
            }
        });

        broadcast(new MessageRead(
            $request->conversation_id,
            $request->message_ids,
            $userId
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }

    private function processFileUpload($file, array $data): array
    {
        $serverMime = $file->getMimeType();
        $clientMime = $file->getClientMimeType();

        $isImage = str_starts_with($serverMime, 'image/');
        $isVideo = str_starts_with($serverMime, 'video/');
        $isAudio = str_starts_with($serverMime, 'audio/') || str_starts_with($clientMime, 'audio/');

        $folder = match (true) {
            $isImage => 'chat/images',
            $isVideo && !$isAudio => 'chat/videos',
            $isAudio => 'chat/audio',
            default  => 'chat/files',
        };

        $data['file_path'] = $file->store($folder, 'public');
        $data['type'] = match (true) {
            $isImage => 'image',
            $isVideo && !$isAudio => 'video',
            $isAudio => 'audio',
            default  => 'file',
        };
        $data['file_name'] = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)
            . '.' . $file->getClientOriginalExtension();
        $data['mime_type'] = $serverMime;
        $data['file_size'] = $file->getSize();

        return $data;
    }

    private function dispatchPushNotifications(Conversation $conversation, Message $message): void
    {
        $conversation->load('users');
        $sender = auth()->user();

        foreach ($conversation->users->where('id', '!=', auth()->id()) as $recipient) {
            $title = $conversation->type === 'group'
                ? $conversation->name
                : $sender->name;

            $body = $recipient->notification_preview
                ? ($message->message ?? 'Sent a file')
                : 'New message';

            SendPushNotification::dispatch(
                $recipient->id,
                $title,
                $body,
                [
                    'conversationId' => $conversation->id,
                    'messageId' => $message->id,
                ]
            );
        }
    }
}
