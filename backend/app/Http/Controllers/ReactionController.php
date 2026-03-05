<?php

namespace App\Http\Controllers;

use App\Events\MessageReactionUpdated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\Request;

class ReactionController extends Controller
{
    public function toggle(Request $request, Message $message)
    {
        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        // Verify user is a member of the message's conversation
        $conversation = $message->conversation;
        if (!$conversation->users()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $userId = auth()->id();

        $existing = MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => $userId,
        ])->first();

        if ($existing) {
            if ($existing->emoji === $request->emoji) {
                $existing->delete();
            } else {
                $existing->update(['emoji' => $request->emoji]);
            }
        } else {
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
}
