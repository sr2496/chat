<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Can the user view messages in this conversation?
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Can the user send messages to this conversation?
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $conversation->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Can the user add members to this conversation?
     */
    public function addMembers(User $user, Conversation $conversation): bool
    {
        if ($conversation->type !== 'group') {
            return false;
        }

        return $conversation->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_admin', true)
            ->exists();
    }

    /**
     * Can the user leave this conversation?
     */
    public function leave(User $user, Conversation $conversation): bool
    {
        if ($conversation->type !== 'group') {
            return false;
        }

        return $conversation->users()->where('user_id', $user->id)->exists();
    }
}
