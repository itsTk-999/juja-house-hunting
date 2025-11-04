const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/authMiddleware');

// --- GET /api/messages/conversations (unchanged) ---
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ 
            participants: userId,
            hiddenFor: { $nin: [userId] },
            permanentlyDeletedFor: { $nin: [userId] } // Filter out permanently deleted
        })
            .populate('participants', 'name profilePicture') 
            .populate({ 
                path: 'messages',
                options: { sort: { 'createdAt': -1 }, limit: 1 } 
            })
            .sort({ updatedAt: -1 }); 
            
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (convo) => {
                const unreadCount = await Message.countDocuments({
                    conversation: convo._id,
                    receiver: userId,
                    isRead: false
                });
                const convoObject = convo.toObject();
                convoObject.unreadCount = unreadCount;
                return convoObject;
            })
        );
        res.json(conversationsWithUnread);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET /api/messages/hidden (Archived) (unchanged) ---
router.get('/hidden', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ 
            participants: userId,
            hiddenFor: { $in: [userId] },
            permanentlyDeletedFor: { $nin: [userId] } // Filter out permanently deleted
        })
            .populate('participants', 'name profilePicture') 
            .populate({ 
                path: 'messages',
                options: { sort: { 'createdAt': -1 }, limit: 1 } 
            })
            .sort({ updatedAt: -1 }); 
        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- GET /api/messages/unread-count (unchanged) ---
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // We must also filter out permanently deleted convos from the count
    const conversations = await Conversation.find({ 
        participants: userId,
        permanentlyDeletedFor: { $nin: [userId] }
    });
    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err.message);
    res.status(500).send('Server error');
  }
});


// --- GET /api/messages/:otherUserId (unchanged) ---
router.get('/:otherUserId', authMiddleware, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherUserId = req.params.otherUserId;

        let conversation = await Conversation.findOne({
            participants: { $all: [myId, otherUserId] }
        })
        .populate('participants', 'name profilePicture'); 

        if (!conversation) {
            let newConvo = new Conversation({
                participants: [myId, otherUserId]
            });
            await newConvo.save();
           conversation = newConvo;
        }
        if (conversation.permanentlyDeletedFor.includes(myId)) {
            conversation = await Conversation.findByIdAndUpdate(
                conversation._id,
                { $pull: { permanentlyDeletedFor: myId } },
                { new: true } // Return the updated document
            );
        }

        // Now populate the (potentially new or restored) conversation
        conversation = await conversation.populate('participants', 'name profilePicture');

        const messages = await Message.find({ conversation: conversation._id })
            .populate('sender', 'name profilePicture')
            .sort({ createdAt: 'asc' }); 

        res.json({ conversation, messages });

    } catch (err) {
        console.error("Error in GET /:otherUserId:", err.message);
        res.status(500).send('Server error');
    }
});

// --- PATCH /api/messages/read/:conversationId (unchanged) ---
router.patch('/read/:conversationId', [authMiddleware, express.json()], async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "User not authorized" });
    }

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ message: "Messages marked as read" });

  } catch (err) {
    console.error("Error marking messages as read:", err.message);
    res.status(500).send('Server error');
  }
});

// --- PATCH /api/messages/conversation/:convoId/hide ---
// Renamed this to /archive to match your request
router.patch('/conversation/:convoId/archive', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.convoId;
        await Conversation.findByIdAndUpdate(
          conversationId,
          { $addToSet: { hiddenFor: userId } } 
        );
        res.json({ message: "Conversation archived" });
    } catch (err) {
        console.error("Error archiving conversation:", err.message);
        res.status(500).send('Server error');
    }
});

// --- PATCH /api/messages/conversation/:convoId/restore ---
// --- THIS IS THE FIX: Renamed /unhide to /restore ---
router.patch('/conversation/:convoId/restore', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.convoId;
        await Conversation.findByIdAndUpdate(
          conversationId,
          { $pull: { hiddenFor: userId } } 
        );
        res.json({ message: "Conversation restored" });
    } catch (err) {
        console.error("Error restoring conversation:", err.message);
        res.status(500).send('Server error');
    }
});

// --- DELETE /api/messages/conversation/:convoId/permanent (unchanged) ---
router.delete('/conversation/:convoId/permanent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.convoId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    if (!conversation.participants.includes(userId)) {
        return res.status(403).json({ message: "User not authorized" });
    }

    await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { permanentlyDeletedFor: userId } }
    );
    
    res.json({ message: "Conversation permanently deleted" });

  } catch (err) {
    console.error("Error permanently deleting conversation:", err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;