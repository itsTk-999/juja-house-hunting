const mongoose = require('mongoose');

const ApartmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'Bedsitter', '1 Bedroom'
  images: [{ type: String }], // Array of image URLs
  features: { // Sub-document for features
    furnishing: { type: String, enum: ['Furnished', 'Unfurnished', 'Partially Furnished'] },
    water: { type: String, enum: ['24/7', 'Reliable', 'Intermittent'] },
    wifi: { type: String, enum: ['Included', 'Available', 'Not Included'] },
    parking: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    biometric: { type: Boolean, default: false },
    hotShower: { type: Boolean, default: false },
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // --- NEW FIELDS ---
  landlordName: { type: String, required: true },
  landlordContact: { type: String, required: true }, // Can be email or phone
  // --- END NEW FIELDS ---
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Apartment', ApartmentSchema);