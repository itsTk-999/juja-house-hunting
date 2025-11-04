const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 
// --- 1. Import http and Socket.IO ---
const http = require('http');
const { Server } = require("socket.io");
// --- End Import ---

// --- 2. Import Chat Models ---
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
// --- End Import ---

// Import routes
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
// --- 4. Create HTTP server and wrap Express app ---
const server = http.createServer(app);

// --- THIS IS THE FIX: Correct CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000', // For development
  'http://192.168.56.1:3000', // For testing on your network
  // 'https://your-vercel-site-name.vercel.app' // For production
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
app.use(cors(corsOptions)); // Use the new options
// --- END FIX ---

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the same list
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// --- Database Connection (unchanged) ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware ---
// --- REMOVED: app.use(cors()); // This was the duplicate line ---
app.use(express.urlencoded({ extended: true })); 

// --- API Routes (unchanged) ---
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

// --- Production Build (unchanged) ---
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static('frontend/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// --- 7. Socket.IO Real-time Logic (unchanged) ---
let onlineUsers = new Map();
io.on('connection', (socket) => {
  console.log(`[Socket.IO] New connection: ${socket.id}`);

  // 1. User joins the server
  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`[Socket.IO] User ${userId} connected with socket ${socket.id}`);
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });

  // 2. User sends a message
  socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
    console.log(`[Socket.IO] Message from ${senderId} to ${receiverId}: ${message}`);
    try {
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message,
            conversation: conversationId,
            isRead: false 
        });
        const savedMessage = await newMessage.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            $push: { messages: savedMessage._id },
            $set: { updatedAt: new Date() },
            $pull: { 
              permanentlyDeletedFor: { $in: [senderId, receiverId] },
              hiddenFor: { $in: [senderId, receiverId] } 
            }
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
        console.error("[Socket.IO] Error saving or sending message:", err.message);
    }
  });

  // 3. User disconnects
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
// --- End Socket.IO Logic ---


// --- 8. Start the HTTP server (not the app) ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});