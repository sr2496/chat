<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userId = auth()->id();
        $readBy = $this->readers->pluck('id');

        $reactions = $this->reactions
            ->groupBy('emoji')
            ->map(fn ($items) => $items->pluck('user_id'))
            ->toArray();

        return [
            'id' => $this->id,
            'message' => $this->message,
            'type' => $this->type,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'file_path' => $this->file_path ? asset('storage/' . $this->file_path) : null,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'created_at' => $this->created_at,

            // 🔥 READ RECEIPTS
            'read_by_me' => $readBy->contains($userId),
            'read_by_count' => $readBy->count(),
            'read_by' => $readBy, // optional but useful

            'reactions' => $reactions,
        ];
    }
}
