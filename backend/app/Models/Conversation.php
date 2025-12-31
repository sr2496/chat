<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Conversation extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('is_admin', 'joined_at');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    protected function displayAvatar(): Attribute
    {
        return Attribute::get(function () {
            $authUserId = auth()->id();

            // Group conversation
            if ($this->type === 'group') {
                return $this->avatar
                    ? asset('storage/' . $this->avatar)
                    : null;
            }

            // One-to-one conversation
            $otherUser = $this->users
                ->firstWhere('id', '!=', $authUserId);

            return $otherUser?->avatar
                ? asset('storage/' . $otherUser->avatar)
                : null;
        });
    }
}
