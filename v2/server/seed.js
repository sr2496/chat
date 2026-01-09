const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});
        console.log('Old data cleared');

        // --- 1. Create Main Users ---
        const john = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            avatar: 'https://i.pravatar.cc/150?u=john'
        });

        const jane = await User.create({
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
            avatar: 'https://i.pravatar.cc/150?u=jane'
        });

        const bob = await User.create({
            name: 'Bob Johnson',
            email: 'bob@example.com',
            password: 'password123',
            avatar: 'https://i.pravatar.cc/150?u=bob'
        });

        console.log('Main users created');

        // --- 2. Create Random Users (for conversation list scrolling) ---
        const randomUsers = [];
        for (let i = 1; i <= 30; i++) {
            const user = await User.create({
                name: `User ${i}`,
                email: `user${i}@example.com`,
                password: 'password123',
                avatar: `https://i.pravatar.cc/150?u=${i}`
            });
            randomUsers.push(user);
        }
        console.log('30 Random users created');

        // --- 3. Heavy Conversation (John & Jane - 100 Messages) ---
        const chatJohnJane = await Conversation.create({
            participants: [john._id, jane._id],
            type: 'private'
        });

        const messagesJohnJane = [];
        let lastMsgTime = new Date();
        lastMsgTime.setDate(lastMsgTime.getDate() - 1); // Start 24 hours ago

        for (let i = 1; i <= 100; i++) {
            // Alternate sender
            const sender = i % 2 === 0 ? john : jane;
            const content = `Message ${i} from ${sender.name} - This is a test message to verify scrolling behavior.`;

            // Advance time slightly
            lastMsgTime = new Date(lastMsgTime.getTime() + 1000 * 60); // +1 minute

            messagesJohnJane.push({
                conversation_id: chatJohnJane._id,
                sender_id: sender._id,
                content: content,
                type: 'text',
                read_by: [john._id, jane._id],
                createdAt: lastMsgTime,
                updatedAt: lastMsgTime
            });
        }

        const createdMessages = await Message.insertMany(messagesJohnJane);

        // Update last message
        chatJohnJane.last_message = createdMessages[createdMessages.length - 1]._id;
        chatJohnJane.updatedAt = lastMsgTime;
        await chatJohnJane.save();

        console.log('Heavy conversation (John <-> Jane) created with 100 messages');

        // --- 4. Many Conversations (John <-> Random Users) ---
        for (const rUser of randomUsers) {
            const conv = await Conversation.create({
                participants: [john._id, rUser._id],
                type: 'private'
            });

            // Add 1-3 random messages
            const numMsgs = Math.floor(Math.random() * 3) + 1;
            let lastRandomMsg = null;

            for (let j = 0; j < numMsgs; j++) {
                lastRandomMsg = await Message.create({
                    conversation_id: conv._id,
                    sender_id: rUser._id,
                    content: `Hello John! I am ${rUser.name}. This is random message ${j + 1}.`,
                    type: 'text',
                    read_by: [rUser._id] // Unread by John
                });
            }

            conv.last_message = lastRandomMsg._id;
            // Randomize update time to test sorting
            const randomTime = new Date();
            randomTime.setMinutes(randomTime.getMinutes() - Math.floor(Math.random() * 1000));
            conv.updatedAt = randomTime;
            await conv.save();
        }

        console.log('30 Random conversations created for John');

        console.log('Seeding Completed! Login as john@example.com to test.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
