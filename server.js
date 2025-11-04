const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// --- GOOGLE CLOUD STORAGE CONFIGURATION ---
let storage;
try {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const absolutePath = path.resolve(credentialsPath);

  storage = new Storage({
    keyFilename: absolutePath,
  });

  const bucketName = process.env.GCS_BUCKET_NAME;
  const bucket = storage.bucket(bucketName);
  console.log(`[GCS Config] Successfully connected to bucket: ${bucketName}`);
} catch (err) {
  console.error('❌ Failed to load Google Cloud credentials:', err.message);
}

// --- 1. Import http and Socket.IO ---
const http = require('http');
const { Server } = require('socket.io');

// --- 2. Import Chat Models ---
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// --- Import routes ---
const authRoutes = require('./api/auth');
const apartmentRoutes = require('./api/apartments');
const contactRoutes = require('./api/contact');
const statsRoutes = require('./api/stats');
const preferencesRoutes = require('./api/preferences');
const searchesRoutes = require('./api/searches');
const profileRoutes = require('./api/profile');
const roommateRoutes = require('./api/roommate');
const messageRoutes = require('./api/messages');
const partnerRoutes = require('./api/partners');

const app = express();

// --- Create HTTP server ---
const server = http.createServer(app);

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000',
  // 'https://your-vercel-site-name.vercel.app' // add this in production
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5001;

// --- Database Connection ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Middleware ---
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/searches', searchesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/roommate', roommateRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/partners', partnerRoutes);

app.get('*', (req, res) => {
  res.send('Juja Hunt API is running!');
});

// --- SOCKET.IO REAL-TIME LOGIC ---
let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] New connection: ${socket.id}`);

  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`[Socket.IO] User ${userId} connected with socket ${socket.id}`);
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
    console.log(`[Socket.IO] Message from ${senderId} to ${receiverId}: ${message}`);
    try {
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        message: message,
        conversation: conversationId,
        isRead: false,
      });
      const savedMessage = await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { messages: savedMessage._id },
        $set: { updatedAt: new Date() },
        $pull: {
          permanentlyDeletedFor: { $in: [senderId, receiverId] },
          hiddenFor: { $in: [senderId, receiverId] },
        },
      });

      const populatedMessage = await savedMessage.populate('sender', 'name profilePicture');

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('getMessage', populatedMessage);
        io.to(receiverSocketId).emit('getNotification', {
          senderName: populatedMessage.sender.name,
          message: populatedMessage.message,
        });
      }

      io.to(socket.id).emit('getMessage', populatedMessage);
    } catch (err) {
      console.error('[Socket.IO] Error saving or sending message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`[Socket.IO] User ${userId} disconnected`);
        break;
      }
    }
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });
});

// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
