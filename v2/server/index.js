require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Chat API is running...');
});

// Make io accessible to our router
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));

// 404 Handler

// Make io accessible to our router
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket Logic
require('./src/socket/socketHandler')(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
