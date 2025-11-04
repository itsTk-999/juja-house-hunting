const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');

// --- GET /api/stats ---
// Get all available properties (for tenants)
router.get('/', async (req, res) => {
  try {
    // Run all database queries in parallel for speed
    const [propertyCount, userCount, landlordCount] = await Promise.all([
      Property.countDocuments({ isAvailable: true }), // Counts only available properties
      User.countDocuments(),                         // Counts all users
      User.countDocuments({ role: 'landlord' })      // Counts only landlords
    ]);

    // Send the counts back as a JSON object
    res.json({
      propertyCount,
      userCount,
      landlordCount
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;