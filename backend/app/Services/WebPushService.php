<?php

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class WebPushService
{
    protected $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject' => env('VAPID_SUBJECT'),
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        $this->webPush = new WebPush($auth);
    }

    /**
     * Send notification to all user's devices
     */
    public function sendToUser($userId, $title, $body, $data = [])
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        foreach ($subscriptions as $sub) {
            $this->sendToSubscription($sub, $title, $body, $data);
        }
    }

    /**
     * Send notification to a specific subscription
     */
    public function sendToSubscription($pushSubscription, $title, $body, $data = [])
    {
        $keys = is_string($pushSubscription->keys) 
            ? json_decode($pushSubscription->keys, true) 
            : $pushSubscription->keys;

        $subscription = Subscription::create([
            'endpoint' => $pushSubscription->endpoint,
            'keys' => $keys,
        ]);

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => '/logo.png',
            'badge' => '/logo.png',
            'data' => $data,
        ]);

        $report = $this->webPush->sendOneNotification($subscription, $payload);

        // Handle expired subscriptions
        if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
            $pushSubscription->delete();
        }
    }

    /**
     * Send notifications in batch
     */
    public function flush()
    {
        foreach ($this->webPush->flush() as $report) {
            // Handle reports if needed
        }
    }
}
