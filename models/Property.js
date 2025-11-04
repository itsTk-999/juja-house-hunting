const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    enum: ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E'],
    required: true,
  },
  type: {
    type: String,
    enum: ['Single Room', 'Bedsitter', 'One Bedroom', 'Two Bedroom', 'Three Bedroom'],
    required: true,
  },
  images: [{
    type: String, // Array of URLs to images
  }],
  
  // Geolocation for the 3D map
  longitude: {
    type: Number,
  },
  latitude: {
    type: Number,
  },

  // Amenity features
  features: {
    furnishing: { type: String, enum: ['Furnished', 'Unfurnished'] },
    water: { type: String, enum: ['24/7', 'Reliable'] },
    wifi: { type: String, enum: ['Included', 'Available', 'Not Included'] },
    parking: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    biometric: { type: Boolean, default: false },
    hotShower: { type: Boolean, default: false },
  },

  // Landlord Contact Info
  landlordName: { type: String, required: true },
  landlordContact: { type: String, required: true }, 
  landlordWhatsapp: { type: String }, 

  // --- NEW FIELD ---
  vacancies: {
    type: Number,
    default: 1,
    min: 0,
  },
  // --- END NEW FIELD ---

  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);