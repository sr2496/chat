const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // User joins their own room for notifications
        socket.on('setup', (userData) => {
            socket.join(userData._id);
            socket.emit('connected');
        });

        // Join a conversation room
        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log(`User joined room: ${room}`);
        });

        // Typing indicators
        socket.on('typing', (room) => {
            console.log(`Typing in room: ${room}`);
            socket.in(room).emit('typing');
        });

        socket.on('stop_typing', (room) => {
            console.log(`Stop typing in room: ${room}`);
            socket.in(room).emit('stop_typing');
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

module.exports = socketHandler;
