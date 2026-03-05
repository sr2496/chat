<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(
        protected int $recipientId,
        protected string $title,
        protected string $body,
        protected array $data = [],
    ) {}

    public function handle(WebPushService $webPushService): void
    {
        $recipient = User::find($this->recipientId);
        if (!$recipient) {
            return;
        }

        // Skip if user has Do Not Disturb enabled
        if ($recipient->isNotificationMuted()) {
            return;
        }

        try {
            $webPushService->sendToUser(
                $this->recipientId,
                $this->title,
                $this->body,
                $this->data
            );
        } catch (\Exception $e) {
            \Log::warning('Push notification failed for user ' . $this->recipientId);
        }
    }
}
