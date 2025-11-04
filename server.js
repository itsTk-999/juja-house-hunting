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
// --- 1. NEW: CORS Configuration ---
// We will add our Vercel URL here later
const allowedOrigins = [
  'http://localhost:3000', // For development
  // 'https://your-vercel-site-name.vercel.app' // For production
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
// --- END NEW ---

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

// --- Middleware (unchanged) ---
app.use(cors());
// We removed global express.json(). It must be added to individual routes.
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
app.use('/api/partners', partnerRoutes); // --- THIS LINE IS NEW ---


  app.get('*', (req, res) => {
    res.send('Juja Hunt API is running!');
  });

// --- 7. Socket.IO Real-time Logic ---

// This maps a logged-in User's ID (e.g., "60f...") to their unique socket ID (e.g., "a3x...")
let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] New connection: ${socket.id}`);

  // 1. User joins the server
  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`[Socket.IO] User ${userId} connected with socket ${socket.id}`);
    // Send all currently online user IDs to all clients
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });

  // 2. User sends a message
  socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
    console.log(`[Socket.IO] Message from ${senderId} to ${receiverId}: ${message}`);
    try {
        // A. Save the message to the database
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
              hiddenFor: { $in: [senderId, receiverId] } // Also restore from archive
            }
        });
        
        // C. Populate sender info for the chat bubble
        const populatedMessage = await savedMessage.populate('sender', 'name profilePicture');

        // D. Send the message to the receiver (if they are online)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            // Send the full message object
            io.to(receiverSocketId).emit('getMessage', populatedMessage);
            // Send a simple notification event
            io.to(receiverSocketId).emit('getNotification', {
                senderName: populatedMessage.sender.name,
                message: populatedMessage.message,
            });
        }

        // E. Send the message back to the sender (so they see it)
        io.to(socket.id).emit('getMessage', populatedMessage);

    } catch (err) {
        console.error("[Socket.IO] Error saving or sending message:", err.message);
    }
  });

  // 3. User disconnects
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
    // Find which userId was associated with this socket.id
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`[Socket.IO] User ${userId} disconnected`);
        break;
      }
    }
    // Update the online list for all remaining clients
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });
});
// --- End Socket.IO Logic ---


// --- 8. Start the HTTP server (not the app) ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});