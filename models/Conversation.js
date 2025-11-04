const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: []
  }],
  
  // This is the "Archive" feature. It's reversible.
  hiddenFor: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  // --- THIS IS THE NEW FIELD ---
  // This is the "Permanent Delete" feature. It is irreversible.
  permanentlyDeletedFor: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
  // --- END NEW FIELD ---

}, { timestamps: true }); 

module.exports = mongoose.model('Conversation', conversationSchema);