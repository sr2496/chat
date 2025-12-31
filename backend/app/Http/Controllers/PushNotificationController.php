<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushNotificationController extends Controller
{
    /**
     * Get VAPID public key for frontend
     */
    public function publicKey()
    {
        return response()->json([
            'publicKey' => env('VAPID_PUBLIC_KEY'),
        ]);
    }

    /**
     * Subscribe user to push notifications
     */
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|max:500',
            'keys' => 'required|array',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        // Create or update subscription
        PushSubscription::updateOrCreate(
            ['endpoint' => $validated['endpoint']],
            [
                'user_id' => auth()->id(),
                'keys' => json_encode($validated['keys']),
            ]
        );

        return response()->json(['message' => 'Subscribed successfully']);
    }

    /**
     * Unsubscribe from push notifications
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('endpoint', $request->endpoint)
            ->where('user_id', auth()->id())
            ->delete();

        return response()->json(['message' => 'Unsubscribed successfully']);
    }
}
