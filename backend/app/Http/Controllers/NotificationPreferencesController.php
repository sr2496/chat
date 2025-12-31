<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationPreferencesController extends Controller
{
    /**
     * Get current user's notification preferences
     */
    public function index()
    {
        $user = auth()->user();
        
        return response()->json([
            'data' => [
                'notification_sound' => $user->notification_sound,
                'notification_preview' => $user->notification_preview,
                'notification_muted_until' => $user->notification_muted_until,
                'is_muted' => $user->isNotificationMuted(),
            ],
        ]);
    }

    /**
     * Update notification preferences
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'notification_sound' => 'sometimes|boolean',
            'notification_preview' => 'sometimes|boolean',
            'mute_duration' => 'sometimes|nullable|integer|min:0|max:1440', // minutes (max 24 hours)
        ]);

        $user = auth()->user();

        // Update sound and preview preferences
        if (isset($validated['notification_sound'])) {
            $user->notification_sound = $validated['notification_sound'];
        }

        if (isset($validated['notification_preview'])) {
            $user->notification_preview = $validated['notification_preview'];
        }

        // Handle DND (Do Not Disturb)
        if ($request->has('mute_duration')) {
            $minutes = $validated['mute_duration'];
            
            if ($minutes > 0) {
                $user->notification_muted_until = now()->addMinutes($minutes);
            } else {
                $user->notification_muted_until = null; // Unmute
            }
        }

        $user->save();

        return response()->json([
            'message' => 'Preferences updated successfully',
            'data' => [
                'notification_sound' => $user->notification_sound,
                'notification_preview' => $user->notification_preview,
                'notification_muted_until' => $user->notification_muted_until,
                'is_muted' => $user->isNotificationMuted(),
            ],
        ]);
    }
}
