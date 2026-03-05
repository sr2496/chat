<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\NotificationPreferencesController;
use App\Http\Controllers\VideoCallController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth (rate limited)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Conversations
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/private-conversations', [ConversationController::class, 'createPrivate']);
    Route::get('/users', [ConversationController::class, 'users']);

    // Messages
    Route::get('/messages/{conversation}', [MessageController::class, 'index']);
    Route::post('/messages/{conversation}', [MessageController::class, 'store']);
    Route::post('/messages/read', [MessageController::class, 'markAsRead']);

    // Reactions
    Route::post('/messages/{message}/reactions', [ReactionController::class, 'toggle']);

    // Groups
    Route::post('/groups', [GroupController::class, 'store']);
    Route::post('/conversations/{conversation}/users', [GroupController::class, 'addMembers']);
    Route::post('/conversations/{conversation}/leave', [GroupController::class, 'leave']);

    // Push Notifications
    Route::get('/push/public-key', [PushNotificationController::class, 'publicKey']);
    Route::post('/push/subscribe', [PushNotificationController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushNotificationController::class, 'unsubscribe']);

    // Notification Preferences
    Route::get('/notification-preferences', [NotificationPreferencesController::class, 'index']);
    Route::put('/notification-preferences', [NotificationPreferencesController::class, 'update']);

    // Video Call
    Route::post('/video/offer', [VideoCallController::class, 'offer']);
    Route::post('/video/answer', [VideoCallController::class, 'answer']);
    Route::post('/video/candidate', [VideoCallController::class, 'candidate']);
    Route::post('/video/end', [VideoCallController::class, 'end']);
});
