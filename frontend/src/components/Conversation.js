import React, { memo } from 'react';
import { Image, Badge, Dropdown } from 'react-bootstrap';
import { FaUserCircle, FaThumbtack, FaInbox, FaArchive, FaExclamationTriangle } from 'react-icons/fa';
import './Conversation.css';

function Conversation({
  conversation,
  myId,
  onClick,
  unreadCount,
  otherUser,
  isPinned,
  onPinToggle,
  onArchive,
  onRestore,
  onPermanentDelete
}) {
  if (!otherUser) return null;

  const lastMessage = conversation.messages?.[0];

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
      href="#!"
      role="button"
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      className="conversation-options"
    >
      {children}
    </a>
  ));

  return (
    <div
      className={`conversation-item ${unreadCount > 0 ? 'unread' : ''} ${isPinned ? 'pinned' : ''}`}
      onClick={() => onClick(otherUser)}
    >
      {isPinned && !onRestore && <FaThumbtack className="pin-icon" />}

      {otherUser.profilePicture ? (
        <Image src={otherUser.profilePicture} roundedCircle className="conversation-avatar" />
      ) : (
        <FaUserCircle size={45} className="conversation-avatar-placeholder" />
      )}

      <div className="conversation-details">
        <div className="conversation-name">{otherUser.name}</div>
        <div className="conversation-preview">
          {lastMessage
            ? `${lastMessage.sender === myId ? 'You: ' : ''}${lastMessage.message.substring(0, 30)}${lastMessage.message.length > 30 ? '...' : ''}`
            : 'No messages yet'}
        </div>
      </div>

      {unreadCount > 0 && (
        <Badge pill bg="success" className="unread-dot">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}

      <Dropdown
        className="ms-auto"
        onSelect={(eventKey) => {
          if (eventKey === 'pin' && onPinToggle) onPinToggle(conversation._id);
          else if (eventKey === 'archive' && onArchive) onArchive(conversation._id);
          else if (eventKey === 'restore' && onRestore) onRestore(conversation._id);
          else if (eventKey === 'permanentDelete' && onPermanentDelete) onPermanentDelete(conversation._id);
        }}
      >
        <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
          &#8942;
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {onRestore ? (
            <>
              <Dropdown.Item eventKey="restore">
                <FaInbox className="me-2" /> Restore to Inbox
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item eventKey="permanentDelete" className="text-danger">
                <FaExclamationTriangle className="me-2" /> Delete Permanently
              </Dropdown.Item>
            </>
          ) : (
            <>
              <Dropdown.Item eventKey="pin">
                <FaThumbtack className="me-2" /> {isPinned ? 'Unpin' : 'Pin'}
              </Dropdown.Item>
              <Dropdown.Item eventKey="archive" className="text-warning">
                <FaArchive className="me-2" /> Archive Conversation
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

// Memoize for performance in long conversation lists
export default memo(Conversation);
