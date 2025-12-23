<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('chat.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('presence-chat', function ($user) {
    return ['id' => $user->id];
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    // Authorization logic to determine if the user can join the private chat
    return $user->conversations()->where('conversations.id', $conversationId)->exists();
});
