const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// --- GET /api/searches ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.savedSearches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- POST /api/searches ---
// --- ADD: Apply JSON parsing locally for POST route ---
router.post('/', [authMiddleware, express.json()], async (req, res) => {
  const { name, filters } = req.body;
  if (!name || !filters) {
    return res.status(400).json({ message: 'Name and filters are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newSearch = {
      name,
      filters
    };
    
    user.savedSearches.push(newSearch);
    await user.save();
    
    res.status(201).json(user.savedSearches[user.savedSearches.length - 1]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- DELETE /api/searches/:id ---
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const searchIndex = user.savedSearches.findIndex(search => search._id.toString() === req.params.id);
    if (searchIndex === -1) {
      return res.status(404).json({ message: 'Search not found' });
    }

    user.savedSearches.splice(searchIndex, 1);
    await user.save();
    
    res.json({ message: 'Search deleted' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;