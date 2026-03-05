<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Requests\AddMembersRequest;
use App\Http\Requests\CreateGroupRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\UserResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

class GroupController extends Controller
{
    public function store(CreateGroupRequest $request)
    {
        $data = [
            'name' => $request->name,
            'type' => 'group',
            'created_by' => auth()->id(),
        ];

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('chat/avatars', 'public');
        }

        $conversation = Conversation::create($data);

        // Attach creator as admin
        $conversation->users()->attach(auth()->id(), ['is_admin' => true]);

        // Attach other users as members
        $conversation->users()->attach($request->user_ids, ['is_admin' => false]);

        // System messages
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'type' => 'system',
            'message' => auth()->user()->name . ' created group "' . $conversation->name . '"',
        ]);

        if (!empty($request->user_ids)) {
            $addedUsers = User::whereIn('id', $request->user_ids)->pluck('name');
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => auth()->id(),
                'type' => 'system',
                'message' => auth()->user()->name . ' added ' . $addedUsers->join(', ', ' and '),
            ]);
        }

        $resource = new ConversationResource($conversation->load('users', 'lastMessage'));

        foreach ($request->user_ids as $uid) {
            broadcast(new \App\Events\UserAddedToConversation($resource, $uid));
        }

        return $resource;
    }

    public function addMembers(AddMembersRequest $request, Conversation $conversation)
    {
        $this->authorize('addMembers', $conversation);

        $existingIds = $conversation->users()->pluck('users.id')->toArray();
        $newUserIds = array_diff($request->user_ids, $existingIds);

        if (empty($newUserIds)) {
            return response()->json(['message' => 'Selected users are already in the group'], 422);
        }

        $conversation->users()->attach($newUserIds, ['is_admin' => false]);

        $newUsers = User::whereIn('id', $newUserIds)->get()->map(function ($user) {
            $user->is_admin = false;
            return $user;
        });

        // System message
        $adderName = auth()->user()->name;
        $addedNames = $newUsers->pluck('name')->join(', ', ' and ');

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'type' => 'system',
            'message' => "$adderName added $addedNames to the group",
        ]);

        broadcast(new MessageSent($message))->toOthers();
        broadcast(new \App\Events\UserAddedToGroup(
            $conversation->id,
            UserResource::collection($newUsers)
        ))->toOthers();

        return response()->json([
            'message' => 'Members added successfully',
            'users' => UserResource::collection($newUsers),
        ]);
    }

    public function leave(Conversation $conversation)
    {
        $this->authorize('leave', $conversation);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'type' => 'system',
            'message' => auth()->user()->name . ' left the group',
        ]);

        broadcast(new MessageSent($message))->toOthers();
        broadcast(new \App\Events\UserLeftGroup($conversation->id, auth()->id()))->toOthers();

        $conversation->users()->detach(auth()->id());

        return response()->json(['message' => 'Left group successfully']);
    }
}
