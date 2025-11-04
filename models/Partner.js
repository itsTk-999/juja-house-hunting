const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const partnerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String, // This will be the GCS URL
    required: true,
  },
  websiteLink: {
    type: String,
    default: '#',
  },
  
  // --- NEW FIELDS ---
  whatsapp: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  // --- END NEW FIELDS ---
  
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);