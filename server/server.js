require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Store active users
const activeUsers = new Map();

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chat Server is running!' });
});

// Get message history
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.json([]); // Return empty array if DB not connected
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 New user connected:', socket.id);

  // Handle user joining
  socket.on('user_join', (username) => {
    activeUsers.set(socket.id, username);
    console.log(`👤 ${username} joined the chat`);
    
    // Broadcast to all clients
    io.emit('user_connected', {
      username,
      message: `${username} joined the chat`,
      userCount: activeUsers.size
    });
    
    // Send active users count
    io.emit('active_users', activeUsers.size);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    const { username, message, timestamp } = data;
    
    const messageData = {
      username,
      message,
      timestamp: timestamp || new Date(),
      socketId: socket.id
    };

    // Save to database (if connected)
    try {
      const newMessage = new Message({
        username,
        message,
        timestamp: messageData.timestamp
      });
      await newMessage.save();
    } catch (error) {
      console.log('⚠️  Message not saved to database:', error.message);
    }

    // Broadcast message to all connected clients
    io.emit('receive_message', messageData);
    console.log(`💬 ${username}: ${message}`);
  });

  // Handle typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('user_typing', username);
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = activeUsers.get(socket.id);
    if (username) {
      activeUsers.delete(socket.id);
      console.log(`👋 ${username} left the chat`);
      
      io.emit('user_disconnected', {
        username,
        message: `${username} left the chat`,
        userCount: activeUsers.size
      });
      
      io.emit('active_users', activeUsers.size);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n`);
});
