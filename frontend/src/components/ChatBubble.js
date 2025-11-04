import React from 'react';
import './ChatBubble.css';

function ChatBubble({ message, isOwnMessage }) {
  
  // Format the timestamp
  const messageTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-text">{message.message}</div>
        <div className="message-time">{messageTime}</div>
      </div>
    </div>
  );
}

export default ChatBubble;