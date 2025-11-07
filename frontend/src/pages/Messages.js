import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Image, ButtonGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { FaComments, FaUserCircle, FaArchive, FaInbox, FaArrowLeft } from 'react-icons/fa';
import Conversation from '../components/Conversation';
import ChatBubble from '../components/ChatBubble';
import './Messages.css';

// --- Helper to get pinned conversations from localStorage
const getPinnedConvos = () => {
  try {
    const pinned = localStorage.getItem('pinnedConversations');
    return pinned ? new Set(JSON.parse(pinned)) : new Set();
  } catch (e) {
    console.warn("Failed to parse pinnedConversations", e);
    return new Set();
  }
};

function Messages({ socket, user, onlineUsers, onMessagesRead }) {
  const { userId: urlUserId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [view, setView] = useState('inbox');
  const [pinnedConvos, setPinnedConvos] = useState(new Set());
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);

  const myId = user.id || user._id;
  const otherUser = currentChat?.participants?.find(p => p._id !== myId);

  // --- Debounced resize
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMobileView(window.innerWidth < 768), 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // --- Load pinned conversations and initial chat list
  useEffect(() => {
    const initialPinned = getPinnedConvos();
    setPinnedConvos(initialPinned);
    getConversations('inbox', initialPinned);
  }, [user.id]);

  const getConversations = useCallback(async (currentView, pinnedSetOverride) => {
    setLoadingChats(true);
    const viewToFetch = currentView || view;
    const endpoint = viewToFetch === 'inbox' ? '/api/messages/conversations' : '/api/messages/hidden';
    try {
      const res = await authFetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      const pinnedSet = pinnedSetOverride || pinnedConvos || getPinnedConvos();

      // --- Sort by pinned + updatedAt
      const sortedData = [...data].sort((a, b) => {
        const isAPinned = pinnedSet.has(a._id);
        const isBPinned = pinnedSet.has(b._id);
        if (isAPinned !== isBPinned) return isAPinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      setConversations(sortedData);
    } catch (err) {
      console.error(err);
    }
    setLoadingChats(false);
  }, [view, pinnedConvos]);

  // --- Load messages for current conversation
  useEffect(() => {
    const getMessages = async (otherId) => {
      if (!otherId || otherId === 'inbox') {
        setCurrentChat(null);
        setCurrentChatMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const res = await authFetch(`/api/messages/${otherId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setCurrentChat(data.conversation);
        setCurrentChatMessages(data.messages);
        markAsRead(data.conversation._id);
      } catch (err) {
        console.error(err);
      }
      setLoadingMessages(false);
    };
    if (view === 'archived') {
      setCurrentChat(null);
      setCurrentChatMessages([]);
    } else {
      getMessages(urlUserId);
    }
  }, [urlUserId, view]);

  // --- Socket real-time updates
  useEffect(() => {
    if (!socket?.current) return;
    const handleGetMessage = (data) => {
      if (currentChat && data.conversationId === currentChat._id) {
        setCurrentChatMessages(prev => [...prev, data]);
      }
      setConversations(prev => {
        if (!prev || prev.length === 0) return prev;
        const idx = prev.findIndex(c => c._id === data.conversationId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], updatedAt: new Date().toISOString(), lastMessage: data.message };
        updated.sort((a, b) => {
          const isAPinned = pinnedConvos.has(a._id);
          const isBPinned = pinnedConvos.has(b._id);
          if (isAPinned !== isBPinned) return isAPinned ? -1 : 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        return updated;
      });
    };
    socket.current.on("getMessage", handleGetMessage);
    return () => socket.current.off("getMessage", handleGetMessage);
  }, [socket, currentChat, pinnedConvos]);

  // --- Scroll to latest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [currentChatMessages]);

  // --- Send message handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    const messagePayload = {
      senderId: myId,
      receiverId: otherUser._id,
      message: newMessage,
      conversationId: currentChat._id
    };

    if (socket?.current) socket.current.emit("sendMessage", messagePayload);

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: myId,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    setCurrentChatMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const res = await authFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setCurrentChatMessages(prev => prev.map(m => m._id === tempMessage._id ? savedMsg : m));
        setConversations(prev => {
          const updated = prev.map(c =>
            c._id === savedMsg.conversationId
              ? { ...c, updatedAt: savedMsg.createdAt, lastMessage: savedMsg.message }
              : c
          );
          updated.sort((a, b) => {
            const isAPinned = pinnedConvos.has(a._id);
            const isBPinned = pinnedConvos.has(b._id);
            if (isAPinned !== isBPinned) return isAPinned ? -1 : 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error saving message:", err);
    }
  }, [newMessage, currentChat, otherUser, socket, pinnedConvos]);

  // --- Click conversation handler
  const handleConversationClick = useCallback(async (convoOtherUser) => {
    setLoadingMessages(true);
    setCurrentChat(null);
    setCurrentChatMessages([]);
    try {
      navigate('/messages/inbox', { replace: true });
      const res = await authFetch(`/api/messages/${convoOtherUser._id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setCurrentChat(data.conversation);
      setCurrentChatMessages(data.messages);
      markAsRead(data.conversation._id);
      if (isMobileView) setShowChatList(false);
    } catch (err) {
      console.error(err);
    }
    setLoadingMessages(false);
  }, [navigate, isMobileView]);

  // --- Mark as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      const res = await authFetch(`/api/messages/read/${conversationId}`, { method: 'PATCH' });
      if (res.ok) {
        onMessagesRead();
        setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, [onMessagesRead]);

  // --- Pin/unpin conversation
  const handlePinToggle = async (conversationId) => {
    const newPinned = new Set(pinnedConvos);
    if (newPinned.has(conversationId)) newPinned.delete(conversationId);
    else newPinned.add(conversationId);
    setPinnedConvos(newPinned);
    try { localStorage.setItem('pinnedConversations', JSON.stringify(Array.from(newPinned))); } catch {}
    setConversations(prev => {
      const copy = [...prev];
      copy.sort((a, b) => {
        const isAPinned = newPinned.has(a._id);
        const isBPinned = newPinned.has(b._id);
        if (isAPinned !== isBPinned) return isAPinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      return copy;
    });
    try {
      await authFetch(`/api/messages/conversation/${conversationId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: newPinned.has(conversationId) }),
      });
    } catch {}
  };

  // --- Change view (Inbox / Archived)
  const changeView = (newView) => {
    setView(newView);
    getConversations(newView, pinnedConvos);
    setCurrentChat(null);
    setCurrentChatMessages([]);
    if (isMobileView) setShowChatList(true);
  };

  // --- Archive / Restore / Permanent Delete
  const handleArchive = async (id) => {
    if (!window.confirm("Are you sure you want to archive this conversation?")) return;
    try {
      const res = await authFetch(`/api/messages/conversation/${id}/archive`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to archive conversation");
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentChat && currentChat._id === id) setCurrentChat(null);
    } catch (err) { alert(err.message); }
  };
  const handleRestore = async (id) => {
    if (!window.confirm("Move this conversation back to your inbox?")) return;
    try {
      const res = await authFetch(`/api/messages/conversation/${id}/restore`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to restore conversation");
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentChat && currentChat._id === id) setCurrentChat(null);
    } catch (err) { alert(err.message); }
  };
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("DANGER: Permanently delete this conversation from your view?")) return;
    try {
      const res = await authFetch(`/api/messages/conversation/${id}/permanent`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to permanently delete conversation");
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentChat && currentChat._id === id) setCurrentChat(null);
    } catch (err) { alert(err.message); }
  };

  const isCurrentChatOnline = otherUser && onlineUsers.includes(otherUser._id);

  return (
    <Container fluid className={`chat-container ${isMobileView ? 'mobile-view' : ''}`} data-aos="fade-in">
      <Row className="h-100">
        {/* Chat List Column */}
        {(!isMobileView || showChatList) && (
          <Col md={3} className={`chat-menu-wrapper ${isMobileView ? 'mobile-list' : ''}`}>
            <div className="chat-menu-header">{view === 'inbox' ? 'Conversations' : 'Archived'}</div>
            <ButtonGroup className="p-2">
              <Button variant={view === 'inbox' ? 'primary' : 'outline-secondary'} onClick={() => changeView('inbox')}>
                <FaInbox className="me-2" /> Inbox
              </Button>
              <Button variant={view === 'archived' ? 'primary' : 'outline-secondary'} onClick={() => changeView('archived')}>
                <FaArchive className="me-2" /> Archived
              </Button>
            </ButtonGroup>
            <div className="chat-menu-conversations">
              {loadingChats ? (
                <div className="text-center"><Spinner animation="border" size="sm" /></div>
              ) : (
                conversations.map(c => {
                  const otherUserInConvo = c.participants.find(p => p._id !== myId);
                  if (!otherUserInConvo) return null;
                  return (
                    <Conversation
                      key={c._id}
                      conversation={c}
                      myId={myId}
                      onClick={() => handleConversationClick(otherUserInConvo)}
                      otherUser={otherUserInConvo}
                      isOnline={onlineUsers.includes(otherUserInConvo._id)}
                      unreadCount={c.unreadCount}
                      isPinned={pinnedConvos.has(c._id)}
                      onPinToggle={handlePinToggle}
                      onArchive={view === 'inbox' ? handleArchive : null}
                      onRestore={view === 'archived' ? handleRestore : null}
                      onPermanentDelete={view === 'archived' ? handlePermanentDelete : null}
                    />
                  );
                })
              )}
              {!loadingChats && conversations.length === 0 && (
                <p className="text-center text-muted p-3">{view === 'inbox' ? "No active conversations." : "No archived conversations."}</p>
              )}
            </div>
          </Col>
        )}

        {/* Chat Column */}
        {(!isMobileView || !showChatList) && (
          <Col md={6} className={`chat-box-wrapper ${isMobileView ? 'mobile-chat' : ''}`}>
            {isMobileView && (
              <Button variant="link" className="back-btn" onClick={() => setShowChatList(true)}>
                <FaArrowLeft size={20} /> Back
              </Button>
            )}
            {currentChat && otherUser ? (
              <>
                <div className="chat-box-header">
                  {otherUser.profilePicture ? (
                    <Image src={otherUser.profilePicture} roundedCircle className="avatar" />
                  ) : (
                    <FaUserCircle size={40} className="text-muted" />
                  )}
                  <div>
                    <div className="username">{otherUser.name}</div>
                    <div className={`status ${isCurrentChatOnline ? 'online' : 'offline'}`}>
                      {isCurrentChatOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div className="chat-box-messages">
                  {loadingMessages ? (
                    <div className="text-center m-auto"><Spinner animation="border" /></div>
                  ) : (
                    <>
                      {currentChatMessages.map(m => (
                        <div key={m._id}>
                          <ChatBubble
                            message={m}
                            isOwnMessage={(m.sender._id || m.sender) === myId}
                          />
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </>
                  )}
                </div>
                <Form onSubmit={handleSubmit} className="chat-box-input">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button variant="success" type="submit" className="ms-2">Send</Button>
                </Form>
              </>
            ) : (
              <div className="chat-box-placeholder">
                <FaComments className="placeholder-icon" />
                <h4>{view === 'inbox' ? "Select a conversation" : "Archived Conversations"}</h4>
                <p>{view === 'inbox' ? "Start chatting to see your messages here." : "Conversations you archive will appear here."}</p>
              </div>
            )}
          </Col>
        )}

        {/* Online Users (Desktop only) */}
        {!isMobileView && (
          <Col md={3} className="chat-online-wrapper">
            <div className="chat-online-header">Online Users</div>
            <div className="chat-online-users">
              {onlineUsers.length > 1 ? (
                onlineUsers.filter(id => id !== myId).map(userId => (
                  <div key={userId} className="online-user-item">
                    <span className="online-dot-lg"></span>
                    User {userId.substring(0, 8)}...
                  </div>
                ))
              ) : (
                <div className="text-muted">No other users online.</div>
              )}
              <small className="text-muted mt-3 d-block">
                {onlineUsers.filter(id => id !== myId).length} other user(s) online.
              </small>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Messages;
