const User = require('../models/User');

const socketHandler = (io) => {
    // Middleware to attach io to req (handled in index.js usually, but here we just handle events)
    // Actually, in index.js we passed io to this handler. 
    // We also need to attach io to req in index.js for controllers to use it.

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // User joins their own room for notifications
        socket.on('setup', async (userData) => {
            socket.join(userData._id);
            socket.userData = userData; // Store user data in socket session

            // Mark user as online
            await User.findByIdAndUpdate(userData._id, { online: true });

            // Broadcast online status to all connected clients
            io.emit('user_online', userData._id);

            socket.emit('connected');
        });

        // Join a conversation room
        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log(`User joined room: ${room}`);
        });

        // Typing indicators
        socket.on('typing', (room) => {
            socket.in(room).emit('typing');
        });

        socket.on('stop_typing', (room) => {
            socket.in(room).emit('stop_typing');
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected');
            if (socket.userData) {
                const userId = socket.userData._id;

                // Mark user as offline and update last seen
                await User.findByIdAndUpdate(userId, {
                    online: false,
                    last_seen: new Date()
                });

                // Broadcast offline status
                io.emit('user_offline', userId);
            }
        });
    });
};

module.exports = socketHandler;
