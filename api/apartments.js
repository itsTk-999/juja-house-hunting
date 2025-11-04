const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { authMiddleware, isLandlord, isLandlordOrAdmin } = require('../middleware/authMiddleware');
// Import the (array) upload middleware and the (array) GCS handler
const { upload, uploadImagesToGCS } = require('../config/storage');

// --- Helper function to parse JSON fields sent via FormData ---
const parseJsonFields = (req, res, next) => {
    if (!req.body) {
        // This shouldn't happen if Multer runs, but as a safeguard:
        console.warn("Warning: req.body is undefined/null in parseJsonFields.");
        return next();
    }
    try {
        // Check if 'features' was sent and is a string, then parse it
        if (req.body.features && typeof req.body.features === 'string') {
            req.body.features = JSON.parse(req.body.features);
        }
        next(); // Move to the next middleware or route handler
    } catch (e) {
        // Catch errors if the JSON string is malformed
        console.error("!!! JSON PARSE ERROR on features field !!!");
        console.error("Error:", e.message);
        return res.status(400).json({ message: `Invalid JSON format for features field. Received: ${req.body.features}` });
    }
};


// --- GET /api/apartments ---
// Get all available properties (for tenants)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ isAvailable: true })
      .populate('owner', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error("!!! ERROR in GET /api/apartments route !!!");
    console.error(err.message);
    console.error(err.stack);
    res.status(500).send('Server error');
  }
});

// --- GET /api/apartments/my-listings ---
// Get all properties owned by the logged-in landlord
router.get('/my-listings', [authMiddleware, isLandlordOrAdmin], async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id })
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error("!!! ERROR in GET /api/apartments/my-listings route !!!");
    console.error(err.message);
    console.error(err.stack);
    res.status(500).send('Server error');
  }
});

// --- GET /api/apartments/new-listings ---
// Get the 5 newest listings for the map
router.get('/new-listings', async (req, res) => {
  try {
    const newProperties = await Property.find({
      isAvailable: true, latitude: { $ne: null }, longitude: { $ne: null }
    })
    .sort({ createdAt: -1 }).limit(5).populate('owner', 'name');
    res.json(newProperties);
  } catch (err) {
    console.error("!!! ERROR in GET /api/apartments/new-listings route !!!");
    console.error(err.message);
    console.error(err.stack);
    res.status(500).send('Server error');
  }
});


// --- GET /api/apartments/:id ---
// Get a single property by its ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name profilePicture phone');
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    console.error(`!!! ERROR in GET /api/apartments/${req.params.id} route !!!`);
    console.error(err.message);
    console.error(err.stack);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: "Property not found (Invalid ID format)" });
    }
    res.status(500).send('Server error');
  }
});

// --- POST /api/apartments (CREATE) ---
router.post('/',
    authMiddleware, 
    isLandlordOrAdmin,
    upload, // Multer handles 'listingImages' array and populates req.body
    uploadImagesToGCS, // Uploads files from req.files to GCS, adds imageURLs to req.body
    parseJsonFields, // Parses req.body.features from string to JSON
    async (req, res) => { // Final route handler
        
    if (req.fileError) {
        console.error("GCS Upload Error:", req.fileError);
        return res.status(500).json({ message: req.fileError });
    }
    if (!req.body) {
        console.error("!!! FATAL: req.body is undefined in POST route !!!");
        return res.status(500).json({ message: "Internal server error: Request body missing." });
    }

    const {
        title, description, price, location, type, features,
        longitude, latitude, landlordName, landlordContact, landlordWhatsapp,
        vacancies,
        imageURLs // Plural from multi-upload
    } = req.body;

    if (!title || !description || !price || !location || !type || !landlordName || !landlordContact) {
        console.log("POST Validation Failed: Missing required text fields.");
        return res.status(400).json({ message: 'Please provide all required listing and landlord contact details.' });
    }
    if (!features || typeof features !== 'object' || Array.isArray(features)) {
        console.log("POST Validation Failed: Features invalid. Received:", features, "Type:", typeof features);
        return res.status(400).json({ message: 'Features data is missing or invalid.'});
    }

    try {
        const newProperty = new Property({
            title, description, price: Number(price) || 0, location, type,
            features,
            images: imageURLs || [], // Use imageURLs array
            longitude: Number(longitude) || null, latitude: Number(latitude) || null,
            landlordName, landlordContact, landlordWhatsapp,
            vacancies: Number(vacancies) || 1,
            owner: req.user.id
        });
        const property = await newProperty.save();
        console.log("Property saved successfully:", property._id);
        res.status(201).json(property);
    } catch (err) {
        console.error("!!! Error Saving Property !!!");
        console.error("Error:", err.message);
        console.error(err.stack);
        if (err.name === 'ValidationError') {
            console.error("Validation Errors:", err.errors);
            return res.status(400).json({ message: "Validation Error", errors: err.errors });
        }
        res.status(500).send('Server error');
     }
});

// --- PUT /api/apartments/:id (UPDATE) ---
router.put('/:id',
    authMiddleware,
    isLandlordOrAdmin,
    upload, // 1. Multer handles 'listingImages' array
    uploadImagesToGCS, // 2. Uploads new files (if any) to GCS
    parseJsonFields, // 3. Parses req.body.features
    async (req, res) => { // 4. Final route handler
        
    if (req.fileError) {
        console.error("GCS Upload Error during update:", req.fileError);
        return res.status(500).json({ message: req.fileError });
    }
    if (!req.body) {
        console.error("!!! FATAL: req.body is undefined in PUT route handler !!!");
        return res.status(500).json({ message: "Internal server error: Request body missing." });
    }
    const {
        title, description, price, location, type, features,
        longitude, latitude, landlordName, landlordContact, landlordWhatsapp, 
        vacancies, 
        isAvailable,
        imageURLs // Plural from multi-upload (will be undefined if no new files)
    } = req.body;

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (description !== undefined) updatedFields.description = description;
    if (price !== undefined) updatedFields.price = Number(price);
    if (location !== undefined) updatedFields.location = location;
    if (type !== undefined) updatedFields.type = type;
    if (features !== undefined) updatedFields.features = features;
    if (longitude !== undefined) updatedFields.longitude = Number(longitude);
    if (latitude !== undefined) updatedFields.latitude = Number(latitude);
    if (landlordName !== undefined) updatedFields.landlordName = landlordName;
    if (landlordContact !== undefined) updatedFields.landlordContact = landlordContact;
    if (landlordWhatsapp !== undefined) updatedFields.landlordWhatsapp = landlordWhatsapp;
    if (vacancies !== undefined) updatedFields.vacancies = Number(vacancies);
    if (isAvailable !== undefined) updatedFields.isAvailable = isAvailable;

    // If new images were uploaded (imageURLs exists), replace the old array
    if (imageURLs && imageURLs.length > 0) {
        updatedFields.images = imageURLs;
    }

    if (Object.keys(updatedFields).length === 0) {
         console.log("Update request received, but no fields provided to update.");
         try {
             const currentProperty = await Property.findById(req.params.id);
             return res.json(currentProperty || { message: "Property not found."});
         } catch(findErr) {
             return res.status(500).send('Server error checking for updates.');
         }
    }

    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to edit this listing' });
        }
        property = await Property.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true, runValidators: true }
        );
        if (!property) {
             console.error(`!!! Update Error: findByIdAndUpdate returned null for ID: ${req.params.id}`);
             return res.status(404).json({ message: 'Property not found after update attempt.' });
        }
        console.log("Property updated successfully:", property._id);
        res.json(property);
    } catch (err) {
        console.error("!!! Error Updating Property !!!");
        console.error("Error:", err.message);
        console.error(err.stack);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: "Property not found (Invalid ID format)" });
        }
        if (err.name === 'ValidationError') {
             console.error("Validation Errors:", err.errors);
            return res.status(400).json({ message: "Validation Error", errors: err.errors });
        }
        res.status(500).send('Server error');
    }
});

// --- DELETE /api/apartments/:id ---
router.delete('/:id', authMiddleware, isLandlordOrAdmin, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to delete this listing' });
        }
        // TODO: Delete images from GCS
        await property.deleteOne();
        res.json({ message: 'Property deleted successfully' });
    } catch (err) {
        console.error("!!! Error Deleting Property !!!");
        console.error("Error:", err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: "Property not found (Invalid ID format)" });
        }
        res.status(500).send('Server error');
    }
});


// --- PATCH /api/apartments/:id/status ---
// This route is separate because it uses express.json()
router.patch('/:id/status', 
    authMiddleware, 
    isLandlordOrAdmin, 
    express.json(), // Apply JSON parser *only* to this route
    async (req, res) => {
    
    const { isAvailable } = req.body;
    
    if (isAvailable === undefined) {
        // --- THIS IS THE FIX ---
        return res.status(400).json({ message: "Missing required 'isAvailable' field." });
    }

    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to update this listing' });
        }
        property.isAvailable = Boolean(isAvailable);
        await property.save(); 
        
        console.log(`Property status updated successfully: ${property._id} to ${property.isAvailable}`);
        res.json(property); 

    } catch (err) {
        console.error("!!! Error Updating Property Status !!!");
        console.error("Error:", err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;