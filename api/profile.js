const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage'); 

// --- 1. Initialize GCS *locally* for this route ---
let storage;
let bucket;
const bucketName = process.env.GCS_BUCKET_NAME;
try {
    storage = new Storage(); 
    bucket = storage.bucket(bucketName);
} catch (error) {
    console.error("!!! Profile Route: Failed to initialize GCS !!!", error.message);
}

// --- 2. Create a local Multer instance ---
const uploadProfile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).any(); // <-- This handles ANY form data


// --- PUT /api/profile ---
router.put('/', authMiddleware, (req, res) => { // Use authMiddleware
    
    // --- 3. Run Multer middleware manually ---
    uploadProfile(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err.message);
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        } else if (err) {
            console.error("Unknown Upload Error:", err.message);
            return res.status(500).json({ message: 'An unknown error occurred during upload.' });
        }
        
        const { name, phone, bio, gender, occupation, whatsapp } = req.body;
        let imageURL = null; 

        try {
            // --- 4. Handle GCS Upload ---
            if (req.files && req.files.length > 0) {
                const file = req.files.find(f => f.fieldname === 'profileImage');
                
                if (file) {
                    if (!bucket) {
                        throw new Error("GCS Bucket is not configured or failed to initialize.");
                    }
                    const timestamp = Date.now();
                    const filename = `profiles/${timestamp}-${file.originalname.replace(/ /g, "_")}`;
                    const blob = bucket.file(filename);
                    const blobStream = blob.createWriteStream({
                        resumable: false,
                        contentType: file.mimetype,
                    });

                    await new Promise((resolve, reject) => {
                        blobStream.on('error', err => {
                            console.error("!!! GCS Blob Stream Error (Single) !!!", err.message);
                            reject(new Error('GCS upload failed: ' + err.message));
                        });
                        blobStream.on('finish', () => {
                            imageURL = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
                            console.log(`Profile pic uploaded: ${imageURL}`);
                            resolve();
                        });
                        blobStream.end(file.buffer);
                    });
                }
            }
            // --- End GCS Upload ---

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // --- 5. THIS IS THE FIX ---
            // Build updatedFields object and check for empty strings
            const updatedFields = {};
            if (name !== undefined) updatedFields.name = name;
            if (phone !== undefined) updatedFields.phone = phone; 
            if (bio !== undefined) updatedFields.bio = bio; 
            if (whatsapp !== undefined) updatedFields.whatsapp = whatsapp;
            if (imageURL) { 
                updatedFields.profilePicture = imageURL;
            }
            
            // Only add gender if it's a non-empty string
            if (gender !== undefined && gender !== "") {
                updatedFields.gender = gender;
            }
            // Only add occupation if it's a non-empty string
            if (occupation !== undefined && occupation !== "") {
                updatedFields.occupation = occupation;
            }
            // --- END FIX ---

            if (Object.keys(updatedFields).length === 0) {
                console.log("No profile fields to update.");
                return res.json({
                    message: "No changes detected",
                    user: user 
                });
            }

            // --- 6. Save updates to database ---
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updatedFields },
                { new: true, runValidators: true } 
            ).select('-password'); 

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found after update' });
            }
            
            console.log("Profile updated successfully for:", updatedUser.email);
            
            res.json({
                message: "Profile updated successfully",
                user: updatedUser 
            });

        } catch (err) {
            console.error("!!! Error Updating Profile !!!");
            console.error("Error:", err.message);
            // Check if it's the validation error
            if (err.name === 'ValidationError') {
                 console.error("Validation Errors:", err.errors);
                 return res.status(400).json({ message: "Validation Error", errors: err.errors });
            }
            res.status(500).send('Server error');
        }
    });
});

module.exports = router;