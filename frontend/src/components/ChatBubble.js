import React, { memo, useMemo } from 'react';
import './ChatBubble.css';

function ChatBubble({ message, isOwnMessage }) {
  // Memoize formatted time to avoid recalculating on each render
  const messageTime = useMemo(() => {
    if (!message.createdAt) return '';
    return new Date(message.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  }, [message.createdAt]);

  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-text">{message.message}</div>
        <div className="message-time">{messageTime}</div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders in long message lists
export default memo(ChatBubble);
