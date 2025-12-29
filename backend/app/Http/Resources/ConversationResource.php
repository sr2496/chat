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

        $initials = null;

        if ($this->type === 'group') {
            if ($this->name) {
                $words = explode(' ', $this->name);
                $initials = '';
                foreach ($words as $w) {
                    $initials .= strtoupper(substr($w, 0, 1));
                }
                $initials = substr($initials, 0, 2); // max 2 letters
            }
        } else {
            $otherUser = $this->users->where('id', '!=', $authUserId)->first();
            if ($otherUser) {
                $words = explode(' ', $otherUser->name);
                $initials = '';
                foreach ($words as $w) {
                    $initials .= strtoupper(substr($w, 0, 1));
                }
                $initials = substr($initials, 0, 2);
            } else {
                $initials = '?';
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->type === 'group'
                ? $this->name
                : $this->users->where('id', '!=', $authUserId)->first()?->name,

            'display_avatar' => $this->type === 'group'
                ? ($this->avatar ? asset('storage/' . $this->avatar) : null)
                : $this->users->where('id', '!=', $authUserId)->first()?->avatar_url,

            'initials' => $initials,

            'users' => UserResource::collection($this->users),

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
