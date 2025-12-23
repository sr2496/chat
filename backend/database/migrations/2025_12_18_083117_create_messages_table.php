<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // TEXT MESSAGE
            $table->text('message')->nullable();

            // MESSAGE TYPE
            $table->enum('type', ['text', 'image', 'video', 'file'])->default('text');

            // FILE / IMAGE DATA
            $table->string('file_path')->nullable();   // storage path
            $table->string('file_name')->nullable();   // original name
            $table->string('mime_type')->nullable();   // image/jpeg, application/pdf
            $table->unsignedBigInteger('file_size')->nullable(); // bytes

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
