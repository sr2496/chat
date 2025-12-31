<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::get('/messages/{conversation}', [ChatController::class, 'messages']);
    Route::post('/messages/read', [ChatController::class, 'markAsRead']);
    Route::post('/messages/{message}/reactions', [ChatController::class, 'toggle']);
    Route::get('/users', [ChatController::class, 'users']);
    Route::post('/groups', [ChatController::class, 'createGroup']);
    Route::post('/private-conversations', [ChatController::class, 'createPrivateConversation']);
    Route::post('/messages/{conversation}', [ChatController::class, 'sendMessage']);
    Route::post('/conversations/{conversation}/leave', [ChatController::class, 'leaveGroup']);
    Route::post('/conversations/{conversation}/users', [ChatController::class, 'addMembers']);
});
