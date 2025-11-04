const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema; 

const savedSearchSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  filters: {
    type: Object, 
    required: true
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin'], 
    default: 'tenant',
  },
  isVerified: {
    type: Boolean,
    default: false, 
  },
  profilePicture: {
    type: String, 
    default: null,
  },
  phone: { 
    type: String,
    default: '',
  },
  bio: { 
    type: String,
    default: '',
  },
  whatsapp: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['', 'Male', 'Female', 'Other', 'Prefer not to say'], // Allow empty string
  },
  occupation: {
    type: String,
    enum: ['', 'Student', 'Working', 'Other'], // Allow empty string
  },
  roommateProfile: {
    type: Schema.Types.ObjectId,
    ref: 'RoommateProfile'
  },
  likedProperties: [{
    type: Schema.Types.ObjectId,
    ref: 'Property' 
  }],
  savedSearches: [savedSearchSchema]

}, { timestamps: true }); 

// --- THIS IS THE HASHING LOGIC ---
// This hook runs BEFORE a user is saved
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// --- THIS IS THE COMPARISON LOGIC ---
// This method is called by the login route
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);