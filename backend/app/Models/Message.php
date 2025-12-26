<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function readers()
    {
        return $this->belongsToMany(User::class, 'message_reads')->withPivot('read_at');
    }

    public function isReadBy(User $user): bool
    {
        return $this->readers->contains($user->id);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }
}
