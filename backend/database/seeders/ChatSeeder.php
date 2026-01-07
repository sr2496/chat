<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Chat Seeder...');

        // Clean up old data first
        $this->command->info('🧹 Cleaning up old data...');
        $this->cleanupOldData();

        // Create auth user with avatar
        $this->command->info('👤 Creating auth user...');
        $authUser = $this->createAuthUser();

        // Create 50 users with avatars
        $this->command->info('👥 Creating users with avatars...');
        $users = $this->createUsersWithAvatars(50, $authUser);
        
        // Add auth user to the collection
        $allUsers = $users->prepend($authUser);
        
        $this->command->info('💬 Creating conversations and messages...');
        
        // Create 30 private conversations
        $this->createPrivateConversations($authUser, $users, 30);
        
        // Create 10 group conversations
        $this->createGroupConversations($authUser, $users, 10);
        
        $this->command->info('✅ Chat seeder completed successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info('   - Users created: ' . $users->count());
        $this->command->info('   - Total conversations: ' . Conversation::count());
        $this->command->info('   - Total messages: ' . Message::count());
    }

    /**
     * Clean up old data and avatar files
     */
    private function cleanupOldData(): void
    {
        // Disable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Delete all messages first (foreign key constraint)
        \DB::table('message_reads')->truncate();
        \DB::table('message_reactions')->truncate();
        Message::truncate();
        $this->command->info('   ✓ Deleted all messages');

        // Delete conversation user pivot
        \DB::table('conversation_user')->truncate();
        
        // Delete all conversations
        Conversation::truncate();
        $this->command->info('   ✓ Deleted all conversations');

        // Delete push subscriptions
        \DB::table('push_subscriptions')->truncate();

        // Delete all users
        User::truncate();
        $this->command->info('   ✓ Deleted all users');

        // Re-enable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Delete old avatar files
        $deletedCount = 0;
        
        // Delete all avatars from chat/avatars folder
        if (Storage::disk('public')->exists('chat/avatars')) {
            $files = Storage::disk('public')->files('chat/avatars');
            foreach ($files as $file) {
                Storage::disk('public')->delete($file);
                $deletedCount++;
            }
        }
        
        // Delete all images from chat/images folder
        if (Storage::disk('public')->exists('chat/images')) {
            $files = Storage::disk('public')->files('chat/images');
            foreach ($files as $file) {
                Storage::disk('public')->delete($file);
                $deletedCount++;
            }
        }
        
        // Delete all videos from chat/videos folder (if any exist)
        if (Storage::disk('public')->exists('chat/videos')) {
            $files = Storage::disk('public')->files('chat/videos');
            foreach ($files as $file) {
                Storage::disk('public')->delete($file);
                $deletedCount++;
            }
        }
        
        if ($deletedCount > 0) {
            $this->command->info("   ✓ Deleted {$deletedCount} old files");
        }
    }

    /**
     * Create auth user with avatar
     */
    private function createAuthUser(): User
    {
        // Ensure avatars directory exists
        Storage::disk('public')->makeDirectory('chat/avatars');
        
        $fullName = 'Test User';
        $email = 'test@example.com';
        
        // Get real avatar from randomuser.me API
        $avatarPath = null;
        try {
            $response = Http::timeout(10)->get('https://randomuser.me/api/?inc=picture');
            if ($response->successful()) {
                $data = $response->json();
                $avatarUrl = $data['results'][0]['picture']['large'] ?? null;
                
                if ($avatarUrl) {
                    $avatarResponse = Http::timeout(10)->get($avatarUrl);
                    if ($avatarResponse->successful()) {
                        $filename = 'chat/avatars/' . uniqid('user_') . '.jpg';
                        Storage::disk('public')->put($filename, $avatarResponse->body());
                        $avatarPath = $filename;
                    }
                }
            }
        } catch (\Exception $e) {
            // Continue without avatar
        }
        
        return User::create([
            'name' => $fullName,
            'email' => $email,
            'password' => bcrypt('password'),
            'avatar' => $avatarPath,
        ]);
    }

    /**
     * Create users with downloaded HD avatars
     */
    private function createUsersWithAvatars(int $count, User $excludeUser = null)
    {
        $users = collect();
        
        // Ensure avatars directory exists
        Storage::disk('public')->makeDirectory('chat/avatars');
        
        // Sample names for realistic data
        $firstNames = [
            'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
            'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
            'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
            'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
            'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
            'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
            'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon'
        ];
        
        $lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
        ];
        
        for ($i = 0; $i < $count; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $fullName = $firstName . ' ' . $lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@example.com');
            
            // Get real avatar from randomuser.me API
            try {
                // Determine gender randomly for realistic names
                $gender = (strpos(strtolower($firstName), 'james') !== false || 
                          strpos(strtolower($firstName), 'john') !== false ||
                          strpos(strtolower($firstName), 'robert') !== false) ? 'male' : 
                         ((strpos(strtolower($firstName), 'mary') !== false ||
                          strpos(strtolower($firstName), 'patricia') !== false ||
                          strpos(strtolower($firstName), 'jennifer') !== false) ? 'female' : 
                         ['male', 'female'][array_rand(['male', 'female'])]);
                
                $response = Http::timeout(10)->get("https://randomuser.me/api/?gender={$gender}&inc=picture");
                
                if ($response->successful()) {
                    $data = $response->json();
                    $avatarUrl = $data['results'][0]['picture']['large'] ?? null;
                    
                    if ($avatarUrl) {
                        $avatarResponse = Http::timeout(10)->get($avatarUrl);
                        if ($avatarResponse->successful()) {
                            $filename = 'chat/avatars/' . uniqid('user_') . '.jpg';
                            Storage::disk('public')->put($filename, $avatarResponse->body());
                            
                            $user = User::create([
                                'name' => $fullName,
                                'email' => $email,
                                'password' => bcrypt('password'),
                                'avatar' => $filename,
                            ]);
                            
                            $users->push($user);
                            $this->command->info("   ✓ Created user: {$fullName} with real avatar");
                        } else {
                            throw new \Exception('Avatar download failed');
                        }
                    } else {
                        throw new \Exception('No avatar URL in response');
                    }
                } else {
                    throw new \Exception('API request failed');
                }
            } catch (\Exception $e) {
                // Create without avatar if download fails
                $user = User::create([
                    'name' => $fullName,
                    'email' => $email,
                    'password' => bcrypt('password'),
                ]);
                $users->push($user);
                $this->command->warn("   ⚠ Created user: {$fullName} (no avatar: {$e->getMessage()})");
            }
            
            // Small delay to be respectful to the API (randomuser.me has rate limits)
            if ($i % 5 == 0 && $i > 0) {
                $this->command->info("   ... created {$i}/{$count} users");
                usleep(500000); // 500ms delay every 5 users for randomuser.me
            }
        }
        
        return $users;
    }

    /**
     * Create private conversations with messages
     */
    private function createPrivateConversations(User $authUser, $users, int $count)
    {
        $messageSamples = $this->getMessageSamples();
        
        // Filter out auth user from available partners to prevent conversations with self
        $availablePartners = $users->reject(function ($user) use ($authUser) {
            return $user->id === $authUser->id;
        });
        
        if ($availablePartners->isEmpty()) {
            $this->command->warn('⚠ No available users for private conversations');
            return;
        }
        
        // Take random users for private chats (ensure we don't request more than available)
        $requestCount = min($count, $availablePartners->count());
        $chatPartners = $availablePartners->random($requestCount);
        
        foreach ($chatPartners as $index => $partner) {
            // Create private conversation
            $conversation = Conversation::create([
                'type' => 'private',
                'created_by' => $authUser->id,
            ]);
            
            // Attach both users (no duplicates possible now)
            $conversation->users()->attach([$authUser->id, $partner->id]);
            
            // Generate 10-50 random messages
            $messageCount = rand(10, 50);
            $this->createMessages($conversation, [$authUser, $partner], $messageCount, $messageSamples);
            
            $this->command->info("   ✓ Created private chat with {$partner->name} ({$messageCount} messages)");
        }
    }

    /**
     * Create group conversations with messages
     */
    private function createGroupConversations(User $authUser, $users, int $count)
    {
        $messageSamples = $this->getMessageSamples();
        
        // Download group avatars
        $groupNames = [
            '🚀 Project Team', '💼 Work Squad', '🎮 Gaming Crew', '📚 Study Group',
            '🏃 Fitness Buddies', '🎨 Creative Minds', '☕ Coffee Lovers', '🌍 Travel Gang',
            '📱 Tech Enthusiasts', '🎵 Music Fans', '🍕 Foodies', '⚽ Sports Team',
            '🎬 Movie Club', '📖 Book Club', '🏠 Family Chat', '🎓 Alumni Group'
        ];
        
        for ($i = 0; $i < $count; $i++) {
            $groupName = $groupNames[$i % count($groupNames)] . ' ' . ($i > 15 ? ($i - 15) : '');
            
            // Download group avatar
            $avatarStyle = 'identicon';
            $seed = urlencode($groupName);
            $avatarUrl = "https://api.dicebear.com/7.x/{$avatarStyle}/png?seed={$seed}&size=400&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede";
            
            $avatarPath = null;
            try {
                $response = Http::timeout(10)->get($avatarUrl);
                if ($response->successful()) {
                    $filename = 'chat/avatars/' . uniqid('group_') . '.png';
                    Storage::disk('public')->put($filename, $response->body());
                    $avatarPath = $filename;
                }
            } catch (\Exception $e) {
                // Continue without avatar
            }
            
            // Create group conversation
            $conversation = Conversation::create([
                'name' => $groupName,
                'type' => 'group',
                'created_by' => $authUser->id,
                'avatar' => $avatarPath,
            ]);
            
            // Add 3-8 random members + auth user
            $memberCount = rand(3, 8);
            $members = $users->random(min($memberCount, $users->count()));
            
            // Attach auth user as admin
            $conversation->users()->attach($authUser->id, ['is_admin' => true]);
            
            // Attach other members
            foreach ($members as $member) {
                if ($member->id !== $authUser->id) {
                    $conversation->users()->attach($member->id, ['is_admin' => false]);
                }
            }
            
            $allMembers = $members->push($authUser)->unique('id');
            
            // Generate 20-100 messages
            $messageCount = rand(20, 100);
            $this->createMessages($conversation, $allMembers->all(), $messageCount, $messageSamples);
            
            $this->command->info("   ✓ Created group '{$groupName}' with {$allMembers->count()} members ({$messageCount} messages)");
            
            if ($i % 3 == 0 && $i > 0) {
                usleep(100000); // Small delay
            }
        }
    }

    /**
     * Create messages for a conversation
     */
    private function createMessages(Conversation $conversation, array $users, int $count, array $messageSamples)
    {
        $now = now();
        
        for ($i = 0; $i < $count; $i++) {
            $sender = $users[array_rand($users)];
            
            // Calculate timestamp (spread over last 30 days)
            $daysAgo = rand(0, 30);
            $hoursAgo = rand(0, 23);
            $minutesAgo = rand(0, 59);
            $createdAt = $now->copy()->subDays($daysAgo)->subHours($hoursAgo)->subMinutes($minutesAgo);
            
            // Randomly decide message type: 75% text, 12% image, 8% video, 5% audio
            $messageType = rand(1, 100);
            
            if ($messageType <= 75) {
                // Text message (75%)
                $messageText = $messageSamples[array_rand($messageSamples)];
                
                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender->id,
                    'message' => $messageText,
                    'type' => 'text',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            } elseif ($messageType <= 87) {
                // Image message (12%)
                $imageMessages = [
                    'Check out this photo! 📸',
                    'Look at this!',
                    'Beautiful view 🌅',
                    'What do you think?',
                    'Amazing! ✨',
                ];
                
                // Download a random image from picsum.photos
                try {
                    $imageId = rand(1, 1000);
                    $imageUrl = "https://picsum.photos/800/600?random={$imageId}";
                    $response = Http::timeout(10)->get($imageUrl);
                    
                    if ($response->successful()) {
                        $filename = 'chat/images/' . uniqid('img_') . '.jpg';
                        Storage::disk('public')->makeDirectory('chat/images');
                        Storage::disk('public')->put($filename, $response->body());
                        
                        Message::create([
                            'conversation_id' => $conversation->id,
                            'sender_id' => $sender->id,
                            'message' => $imageMessages[array_rand($imageMessages)],
                            'type' => 'image',
                            'file_path' => $filename,
                            'file_name' => 'photo.jpg',
                            'mime_type' => 'image/jpeg',
                            'file_size' => strlen($response->body()),
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ]);
                    } else {
                        // Fallback to text message
                        Message::create([
                            'conversation_id' => $conversation->id,
                            'sender_id' => $sender->id,
                            'message' => $imageMessages[array_rand($imageMessages)],
                            'type' => 'text',
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ]);
                    }
                } catch (\Exception $e) {
                    // Fallback to text if image download fails
                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $sender->id,
                        'message' => 'Check out this photo!',
                        'type' => 'text',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }
            } elseif ($messageType <= 95) {
                // Video message (8%)
                $videoMessages = [
                    'Watch this video! 🎥',
                    'This is hilarious 😂',
                    'Check this out!',
                    'Amazing video 🎬',
                ];
                
                // Download actual sample video
                try {
                    // Use sample video from Google Storage (reliable)
                    $videoUrls = [
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                    ];
                    
                    $videoUrl = $videoUrls[array_rand($videoUrls)];
                    $response = Http::timeout(30)->get($videoUrl);
                    
                    if ($response->successful()) {
                        $filename = 'chat/videos/' . uniqid('vid_') . '.mp4';
                        Storage::disk('public')->makeDirectory('chat/videos');
                        Storage::disk('public')->put($filename, $response->body());
                        
                        Message::create([
                            'conversation_id' => $conversation->id,
                            'sender_id' => $sender->id,
                            'message' => $videoMessages[array_rand($videoMessages)],
                            'type' => 'video',
                            'file_path' => $filename,
                            'file_name' => 'video.mp4',
                            'mime_type' => 'video/mp4',
                            'file_size' => strlen($response->body()),
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ]);
                    } else {
                        throw new \Exception('Video download failed');
                    }
                } catch (\Exception $e) {
                    // Fallback to text if video download fails
                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $sender->id,
                        'message' => $videoMessages[array_rand($videoMessages)],
                        'type' => 'text',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }
            } else {
                // Audio message (5%)
                $audioMessages = [
                    '🎤 Voice message',
                    '🔊 Listen to this',
                    '🎙️ Quick voice note',
                ];
                
                // Download actual sample audio from Google Actions (reliable OGG files)
                try {
                    $audioUrls = [
                        'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
                        'https://actions.google.com/sounds/v1/water/rain_heaviest.ogg',
                        'https://actions.google.com/sounds/v1/transportation/car_horn.ogg',
                        'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
                    ];
                    
                    $audioUrl = $audioUrls[array_rand($audioUrls)];
                    $response = Http::timeout(20)->get($audioUrl);
                    
                    if ($response->successful()) {
                        // These are OGG files
                        $filename = 'chat/audio/' . uniqid('aud_') . '.ogg';
                        Storage::disk('public')->makeDirectory('chat/audio');
                        Storage::disk('public')->put($filename, $response->body());
                        
                        Message::create([
                            'conversation_id' => $conversation->id,
                            'sender_id' => $sender->id,
                            'message' => $audioMessages[array_rand($audioMessages)],
                            'type' => 'audio',
                            'file_path' => $filename,
                            'file_name' => 'voice.ogg',
                            'mime_type' => 'audio/ogg',
                            'file_size' => strlen($response->body()),
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ]);
                    } else {
                        throw new \Exception('Audio download failed');
                    }
                } catch (\Exception $e) {
                    // Fallback to text if audio download fails
                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $sender->id,
                        'message' => $audioMessages[array_rand($audioMessages)],
                        'type' => 'text',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }
            }
        }
    }

    /**
     * Get sample messages for realistic chat
     */
    private function getMessageSamples(): array
    {
        return [
            // Greetings
            'Hey there! 👋',
            'Good morning!',
            'How are you doing?',
            'What\'s up?',
            'Hi! How have you been?',
            
            // Questions
            'What do you think about this?',
            'Can you help me with something?',
            'Did you see the latest update?',
            'When are we meeting?',
            'Are you free tomorrow?',
            'What time works for you?',
            
            // Responses
            'Sure, sounds good!',
            'Perfect! ✅',
            'I agree',
            'That makes sense',
            'Got it, thanks!',
            'Will do!',
            'Absolutely!',
            'Yes please',
            'I think so too',
            
            // Work/Project related
            'Let me check and get back to you',
            'I\'ll send you the files',
            'The meeting is at 3 PM',
            'Great work on the presentation!',
            'Can we reschedule?',
            'I\'ve updated the document',
            'Please review when you get a chance',
            
            // Casual
            'lol 😂',
            'That\'s hilarious!',
            'Amazing! 🎉',
            'Congrats! 🎊',
            'Can\'t wait!',
            'That sounds fun',
            'I love it!',
            'Interesting...',
            'Tell me more',
            
            // Food
            'Want to grab lunch?',
            'Coffee? ☕',
            'Dinner at 7?',
            'I\'m starving 🍕',
            
            // Plans
            'See you soon!',
            'Talk later',
            'Catch you tomorrow',
            'Have a great day!',
            'Good night 🌙',
            'Thanks again!',
            'Bye! 👋',
            
            // Tech/Work
            'Pushed the code',
            'Bug fixed ✅',
            'Testing now',
            'Released to production',
            'Looks good to me',
            'Approved',
            
            // Emoji reactions
            '👍',
            '❤️',
            '😊',
            '🔥',
            '💯',
            '👏',
            
            // Longer messages
            'I was thinking we could probably schedule a meeting for next week to discuss the project details and timeline. What do you think?',
            'Just wanted to follow up on our conversation from yesterday. Did you have a chance to review the proposal?',
            'Thanks for your help with this! I really appreciate you taking the time to explain everything.',
            'I\'m working on it right now, should have it done by end of day. Will keep you posted on the progress.',
            'That\'s a great idea! We should definitely consider that approach for the next phase.',
        ];
    }
}
