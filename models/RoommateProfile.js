const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roommateProfileSchema = new Schema({
  // Link to the user this profile belongs to
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Compatibility Assessment Fields
  budget: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 10000 },
  },
  preferredLocation: [{
    type: String,
    enum: ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E'],
  }],
  
  // Lifestyle Questions
  cleanliness: {
    type: String,
    enum: ['Very Tidy', 'Tidy', 'Average', 'Relaxed'],
    default: 'Average',
  },
  smoking: {
    type: String,
    enum: ['Never', 'Sometimes', 'Outside Only', 'Regularly'],
    default: 'Never',
  },
  pets: {
    type: String,
    enum: ['No', 'Yes', 'Maybe'],
    default: 'No',
  },
  guests: {
    type: String,
    enum: ['Rarely', 'Sometimes', 'Often'],
    default: 'Sometimes',
  },
  bio: { // A specific bio for finding roommates
    type: String,
    maxlength: 500,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('RoommateProfile', roommateProfileSchema);