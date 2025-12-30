<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $authUserId = auth()->id();

        return [
            'id' => $this->id,
            'type' => $this->type,
            'created_at' => $this->created_at,
            'description' => $this->description, // Added in case it exists or is added later
            'name' => $this->type === 'group'
                ? $this->name
                : $this->users->where('id', '!=', $authUserId)->first()?->name,

            'display_avatar' => $this->type === 'group'
                ? ($this->avatar ? asset('storage/' . $this->avatar) : null)
                : $this->users->where('id', '!=', $authUserId)->first()?->avatar,

            'users' => $this->users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'is_online' => $user->isOnline(),
                    'is_admin' => $user->pivot->is_admin ?? false,
                ];
            }),

            'unread_count' => $this->unread_count ?? 0,

            'last_message' => $this->whenLoaded('lastMessage', function () {
                return [
                    'message' => $this->lastMessage->message,
                    'type' => $this->lastMessage->type,
                    'time' => $this->lastMessage->created_at,
                ];
            }),
        ];
    }
}
