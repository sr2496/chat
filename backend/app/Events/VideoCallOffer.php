<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VideoCallOffer implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $offer;
    public $toUserId;
    public $fromUserId;

    /**
     * Create a new event instance.
     */
    public $user;
    
    /**
     * Create a new event instance.
     */
    public function __construct($offer, $toUserId, $fromUserId, $user = null)
    {
        $this->offer = $offer;
        $this->toUserId = $toUserId;
        $this->fromUserId = $fromUserId;
        $this->user = $user;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->toUserId),
        ];
    }

    public function broadcastAs()
    {
        return 'video-call.offer';
    }
}
