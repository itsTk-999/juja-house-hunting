const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

// --- Initialize GCS ---
let storage;
let bucket;
const bucketName = process.env.GCS_BUCKET_NAME;

try {
    storage = new Storage(); 
    if (!bucketName) {
        throw new Error("GCS_BUCKET_NAME environment variable is not set.");
    }
    bucket = storage.bucket(bucketName);
    console.log(`[GCS Config] Successfully connected to bucket: ${bucketName}`);
} catch (error) {
    console.error("!!! FATAL: Failed to initialize Google Cloud Storage !!!");
    console.error("Error:", error.message);
}


// --- 1. UPLOAD MIDDLEWARE FOR APARTMENT LISTINGS (Multiple Files) ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
}).array('listingImages', 10); // Expects 'listingImages' field name

// --- 2. GCS HANDLER FOR APARTMENT LISTINGS (Multiple Files) ---
const uploadImagesToGCS = (req, res, next) => {
    if (!bucket) {
        req.fileError = 'GCS is not configured or failed to initialize.';
        return next(); 
    }
    
    if (!req.files || req.files.length === 0) { // Uses req.files (plural)
        return next(); 
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const filename = `listings/${timestamp}-${file.originalname.replace(/ /g, "_")}`; 
        const blob = bucket.file(filename);
        
        const blobStream = blob.createWriteStream({
            resumable: false, 
            contentType: file.mimetype,
        });

        blobStream.on('error', err => {
            console.error("!!! GCS Blob Stream Error (Multiple) !!!", err.message);
            reject(err); 
        });

        blobStream.on('finish', () => { 
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
            resolve(publicUrl); 
        });

        blobStream.end(file.buffer);
      });
    });

    Promise.all(uploadPromises)
      .then(publicUrls => {
          if (!req.body) req.body = {}; 
          req.body.imageURLs = publicUrls; // Adds 'imageURLs' (plural)
          next();
      })
      .catch(err => {
          req.fileError = 'GCS upload failed: ' + err.message;
          console.error("[uploadImagesToGCS] One or more file uploads failed.", err);
          next(); 
      });
};

// --- 3. REMOVED 'uploadSingleImageToGCS' ---

// --- 4. EXPORT ONLY APARTMENT FUNCTIONS ---
module.exports = { 
    upload,                 
    uploadImagesToGCS
};