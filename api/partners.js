const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
// --- 1. Import isAdmin ---
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

// --- (GCS & Multer setup unchanged) ---
let storage;
let bucket;
const bucketName = process.env.GCS_BUCKET_NAME;
try {
    storage = new Storage(); 
    bucket = storage.bucket(bucketName);
} catch (error) {
    console.error("!!! Partner API: Failed to initialize GCS !!!", error.message);
}
const uploadPartnerLogo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, 
}).any(); 


// --- GET /api/partners (Public - unchanged) ---
router.get('/', async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- GET /api/partners/:id (Public - unchanged) ---
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.json(partner);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Partner not found' });
    }
    res.status(500).send('Server error');
  }
});


// --- POST /api/partners (CREATE) ---
// --- 2. Replace 'isLandlord' with 'isAdmin' ---
router.post('/', authMiddleware, isAdmin, (req, res) => {
    
    uploadPartnerLogo(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        }

        const { name, description, websiteLink, whatsapp, email } = req.body;
        let imageURL = null;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required.' });
        }
        
        let file = null;
        if (req.files && req.files.length > 0) {
            file = req.files.find(f => f.fieldname === 'logoImage');
        }
        if (!file) {
            return res.status(400).json({ message: 'Logo image is required.' });
        }

        try {
            // --- GCS Upload ---
            if (!bucket) throw new Error("GCS Bucket not configured.");
            
            const timestamp = Date.now();
            const filename = `partners/${timestamp}-${file.originalname.replace(/ /g, "_")}`;
            const blob = bucket.file(filename);
            const blobStream = blob.createWriteStream({
                resumable: false,
                contentType: file.mimetype,
            });

            await new Promise((resolve, reject) => {
                blobStream.on('error', err => reject(new Error('GCS upload failed: ' + err.message)));
                blobStream.on('finish', () => {
                    imageURL = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
                    resolve();
                });
                blobStream.end(file.buffer);
            });
            // --- End GCS Upload ---

            const newPartner = new Partner({
                name,
                description,
                websiteLink: websiteLink || '#',
                logoUrl: imageURL,
                whatsapp: whatsapp || '',
                email: email || '',
                addedBy: req.user.id
            });

            const partner = await newPartner.save();
            res.status(201).json(partner);

        } catch (err) {
            console.error("!!! Error Creating Partner !!!");
            console.error("Error:", err.message);
            res.status(500).send('Server error');
        }
    });
});

// --- PUT /api/partners/:id (UPDATE) ---
// --- 3. Replace 'isLandlord' with 'isAdmin' ---
router.put('/:id', authMiddleware, isAdmin, (req, res) => {
    
    uploadPartnerLogo(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        }

        const { name, description, websiteLink, currentLogoUrl, whatsapp, email } = req.body;
        let imageURL = currentLogoUrl; 

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required.' });
        }
        
        try {
            // --- GCS Upload (if new file) ---
            let file = null;
            if (req.files && req.files.length > 0) {
                file = req.files.find(f => f.fieldname === 'logoImage');
            }
            if (file) {
                if (!bucket) throw new Error("GCS Bucket not configured.");
                
                const timestamp = Date.now();
                const filename = `partners/${timestamp}-${file.originalname.replace(/ /g, "_")}`;
                const blob = bucket.file(filename);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    contentType: file.mimetype,
                });

                await new Promise((resolve, reject) => {
                    blobStream.on('error', err => reject(new Error('GCS upload failed: ' + err.message)));
                    blobStream.on('finish', () => {
                        imageURL = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
                // TODO: Delete old image from GCS
            }
            // --- End GCS Upload ---

            const updatedFields = {
                name,
                description,
                websiteLink: websiteLink || '#',
                logoUrl: imageURL, 
                whatsapp: whatsapp || '',
                email: email || '',
            };

            const partner = await Partner.findByIdAndUpdate(
                req.params.id,
                { $set: updatedFields },
                { new: true, runValidators: true }
            );

            if (!partner) {
                return res.status(404).json({ message: 'Partner not found for update' });
            }

            res.json(partner);

        } catch (err) {
            console.error("!!! Error Updating Partner !!!");
            console.error("Error:", err.message);
            res.status(500).send('Server error');
        }
    });
});


// --- DELETE /api/partners/:id ---
// --- 4. Replace 'isLandlord' with 'isAdmin' ---
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // TODO: Add logic to delete the logoUrl from GCS bucket
    
    await partner.deleteOne();
    res.json({ message: 'Partner removed' });
    
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Partner not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;