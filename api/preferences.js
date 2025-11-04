const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import auth middleware

// --- POST /api/preferences/like/:propertyId ---
// @desc    Like or Unlike a property
// @access  Private
router.post('/like/:propertyId', authMiddleware, async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const userId = req.user.id;

    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if the property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // 3. Check if the property is already liked
    const isLiked = user.likedProperties.includes(propertyId);
    let updatedUser;

    if (isLiked) {
      // --- Unlike: Pull/remove from the array ---
      updatedUser = await User.findByIdAndUpdate(userId, 
        { $pull: { likedProperties: propertyId } },
        { new: true } // Return the updated document
      );
    } else {
      // --- Like: Push/add to the array ---
      updatedUser = await User.findByIdAndUpdate(userId,
        { $push: { likedProperties: propertyId } },
        { new: true }
      );
    }

    // 4. Send back the new list of liked IDs
    res.json(updatedUser.likedProperties);

  } catch (err) {
    console.error("!!! Error in /like route !!!");
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- GET /api/preferences/my-preferences ---
// @desc    Get all properties liked by the user
// @access  Private
router.get('/my-preferences', authMiddleware, async (req, res) => {
  try {
    // Find the user and populate the 'likedProperties' field.
    // This replaces the IDs with the full property documents.
    const user = await User.findById(req.user.id)
      .populate({
          path: 'likedProperties',
          model: 'Property'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.likedProperties); // Send the array of full properties

  } catch (err) {
    console.error("!!! Error in /my-preferences route !!!");
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;