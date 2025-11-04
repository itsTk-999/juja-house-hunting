const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // The User ID of the person who sent the message
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The User ID of the person who is receiving the message
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The text content of the message
  message: {
    type: String,
    required: true
  },
  // This links the message back to its parent conversation
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  // This will be used for the "green dot" notification
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true }); // timestamps adds createdAt (to show when msg was sent)

module.exports = mongoose.model('Message', messageSchema);