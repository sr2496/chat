<?php

namespace App\Http\Controllers;

use App\Http\Requests\CursorPaginationRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\UserResource;
use App\Models\Conversation;
use App\Models\Message;

class ConversationController extends Controller
{
    public function index(CursorPaginationRequest $request)
    {
        $userId = auth()->id();
        $limit = $request->getLimit(20);
        $afterId = $request->getAfterId();

        $query = auth()->user()
            ->conversations()
            ->where(function ($q) {
                $q->where('type', 'group')
                    ->orWhereHas('messages');
            })
            ->with(['users', 'lastMessage'])
            ->withCount([
                'messages as unread_count' => function ($q) use ($userId) {
                    $q->where('sender_id', '!=', $userId)
                        ->whereDoesntHave('readers', function ($r) use ($userId) {
                            $r->where('user_id', $userId);
                        });
                }
            ])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest()
                    ->limit(1)
            );

        if ($afterId) {
            $query->where('conversations.id', '<', $afterId);
        }

        $conversations = $query->limit($limit + 1)->get();
        $hasMore = $conversations->count() > $limit;
        if ($hasMore) {
            $conversations->pop();
        }

        return response()->json([
            'data' => ConversationResource::collection($conversations),
            'meta' => [
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? $conversations->last()?->id : null,
            ],
        ]);
    }

    public function createPrivate(CursorPaginationRequest $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $authUserId = $request->user()->id;
        $otherUserId = $request->user_id;

        if ($authUserId == $otherUserId) {
            return response()->json(['message' => 'Cannot create a conversation with yourself'], 422);
        }

        $conversation = Conversation::where('type', 'private')
            ->whereHas('users', fn($q) => $q->whereIn('user_id', [$authUserId, $otherUserId]), '=', 2)
            ->first();

        if (!$conversation) {
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

    public function users(CursorPaginationRequest $request)
    {
        $userId = auth()->id();
        $limit = $request->getLimit(20);
        $afterId = $request->getAfterId();

        $query = \App\Models\User::where('id', '!=', $userId)
            ->orderBy('name', 'asc');

        if ($afterId) {
            $query->where('id', '>', $afterId);
        }

        $users = $query->limit($limit + 1)->get();
        $hasMore = $users->count() > $limit;
        if ($hasMore) {
            $users->pop();
        }

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? $users->last()?->id : null,
            ],
        ]);
    }
}
