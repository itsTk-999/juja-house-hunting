const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RoommateProfile = require('../models/RoommateProfile');
const { authMiddleware } = require('../middleware/authMiddleware');

// --- GET /api/roommate/all ---
// @desc    Get all roommate profiles for the finder
router.get('/all', async (req, res) => {
  try {
    const profiles = await RoommateProfile.find()
      .populate('user', ['name', 'profilePicture', 'gender', 'occupation', 'bio']); 
    
    const validProfiles = profiles.filter(profile => profile.user);
      
    res.json(validProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- GET /api/roommate/me ---
// @desc    Get the logged-in user's roommate profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Roommate profile not found for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- GET /api/roommate/:id ---
// @desc    Get a specific roommate profile by its *Profile ID*
router.get('/:id', async (req, res) => {
  try {
    const profile = await RoommateProfile.findById(req.params.id)
      .populate('user', ['name', 'profilePicture', 'gender', 'occupation', 'bio']); 
      
    if (!profile || !profile.user) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});

// --- POST /api/roommate/me ---
// @desc    Create or update the user's roommate profile
//
// --- THIS IS THE FIX: Added express.json() to the middleware array ---
router.post('/me', [authMiddleware, express.json()], async (req, res) => {
  const { budget, preferredLocation, cleanliness, smoking, pets, guests, bio } = req.body;
  
  // Check if body was parsed
  if (!req.body) {
      return res.status(400).json({ message: "Request body is missing or not in JSON format." });
  }

  const profileFields = {
    user: req.user.id,
    budget,
    preferredLocation,
    cleanliness,
    smoking,
    pets,
    guests,
    bio
  };

  try {
    let profile = await RoommateProfile.findOne({ user: req.user.id });

    if (profile) {
      // --- Update existing profile ---
      profile = await RoommateProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
    } else {
      // --- Create new profile ---
      profile = new RoommateProfile(profileFields);
      await profile.save();
      
      // --- Link this new profile back to the User model ---
      await User.findByIdAndUpdate(req.user.id, { roommateProfile: profile._id });
    }
    
    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// --- END FIX ---

// --- DELETE /api/roommate/me ---
// @desc    Delete the logged-in user's roommate profile
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    // 1. Find and delete the profile
    const profile = await RoommateProfile.findOneAndDelete({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Roommate profile not found' });
    }
    
    // 2. Unlink from the User model
    await User.findByIdAndUpdate(req.user.id, { $unset: { roommateProfile: "" } });
    
    res.json({ message: 'Roommate profile deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;