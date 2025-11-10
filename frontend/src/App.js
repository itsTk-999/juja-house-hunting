import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'; 
import { io } from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { authFetch } from './utils/authFetch'; 
import AppNavbar from './components/Navbar';
import LoginModal from './components/LoginModal'; 
import { Container, Spinner } from 'react-bootstrap';
import './App.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { SpeedInsights } from "@vercel/speed-insights/react";



// --- STATIC PAGES (frequent/lightweight) ---
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import TermsAndConditions from './pages/TermsAndConditions';

// --- LAZY LOAD HEAVIER PAGES ---
const Apartments = React.lazy(() => import('./pages/Apartments'));
const ApartmentDetail = React.lazy(() => import('./pages/ApartmentDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const MyListings = React.lazy(() => import('./pages/MyListings'));
const CreateListing = React.lazy(() => import('./pages/CreateListing'));
const EditListing = React.lazy(() => import('./pages/EditListing'));
const MyPreferences = React.lazy(() => import('./pages/MyPreferences'));
const RoommateFinder = React.lazy(() => import('./pages/RoommateFinder'));
const MyRoommateProfile = React.lazy(() => import('./pages/MyRoommateProfile'));
const RoommateProfileDetail = React.lazy(() => import('./pages/RoommateProfileDetail'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Resources = React.lazy(() => import('./pages/Resources'));
const AdminPartners = React.lazy(() => import('./pages/AdminPartners'));
const PartnerDetail = React.lazy(() => import('./pages/PartnerDetail'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const VerificationPending = React.lazy(() => import('./pages/VerificationPending'));

function App() {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false); 
  const [authLoading, setAuthLoading] = useState(true);
  
  const socket = useRef(); 
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem('token')) return; 
    try {
        const res = await authFetch('/api/messages/unread-count');
        if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount);
        }
    } catch (err) {
        console.error("Failed to fetch unread count", err);
    }
  };

  useEffect(() => { 
    AOS.init({ duration: 1000, once: true });
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUnreadCount(); 
    }
    setAuthLoading(false); 
  }, []); 

  useEffect(() => {
    if (user) {
      socket.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5001");
      socket.current.emit('addUser', user.id || user._id);
      socket.current.on('getUsers', (users) => setOnlineUsers(users));
      socket.current.on('getNotification', (data) => {
        toast.info(<div><strong>{data.senderName}</strong><br/>{data.message}</div>, {
          onClick: () => navigate('/messages/inbox') 
        });
        setUnreadCount(prev => prev + 1);
      });
      return () => {
        socket.current.disconnect();
        socket.current.off('getUsers');
        socket.current.off('getNotification');
      };
    } else {
      if (socket.current) socket.current.disconnect();
    }
  }, [user, navigate]); 

  const handleLoginSuccess = (loginData) => { 
    setUser(loginData.user);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    localStorage.setItem('token', loginData.token); 

    axios.defaults.headers.common['Authorization'] = `Bearer ${loginData.token}`;
    if (authFetch?.setToken) authFetch.setToken(loginData.token);

    fetchUnreadCount(); 
    setShowLoginModal(false);
  };
  
  const handleLogout = () => { 
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 
    setUnreadCount(0);
    window.location.href = '/';

    delete axios.defaults.headers.common['Authorization'];
    if (authFetch?.clearToken) authFetch.clearToken?.();

    sessionStorage.clear();

    navigate('/'); 
  };
  
  const handleUpdateUser = (updatedUserData) => { 
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };
  
  const LandlordRoute = ({ children }) => { 
    if (user && user.isVerified && (user.role === 'landlord' || user.role === 'admin')) {
      return children;
    }
    if (user && user.role === 'landlord' && !user.isVerified) {
      return <Navigate to="/verification-pending" />;
    }
    if (!user) {
      setShowLoginModal(true); 
      return <Navigate to="/" />;
    }
    return <Navigate to="/" />;
  };

  const AdminRoute = ({ children }) => { 
    if (user && user.role === 'admin') {
      return children;
    }
    if (!user) {
      setShowLoginModal(true);
      return <Navigate to="/" />;
    }
    return <Navigate to="/" />; 
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    
      <AppNavbar 
        user={user} 
        onLogout={handleLogout} 
        onLoginClick={() => setShowLoginModal(true)} 
        unreadCount={unreadCount} 
      />
      
      <LoginModal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

      <Suspense fallback={
        <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <Spinner animation="border" variant="primary" />
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Container fluid="lg" className="mt-4"><About /></Container>} />
          <Route path="/contact" element={<Container fluid="lg" className="mt-4"><Contact /></Container>} />
          <Route path="/terms-and-conditions" element={<Container fluid="lg" className="mt-4"><TermsAndConditions /></Container>} />

          {/* Lazy-loaded public routes */}
          <Route path="/apartments" element={<Container fluid="lg" className="mt-4"><Apartments user={user} setShowLoginModal={setShowLoginModal} /></Container>} />
          <Route path="/apartment/:id" element={<Container fluid="lg" className="mt-4"><ApartmentDetail user={user} setShowLoginModal={setShowLoginModal} /></Container>} />
          <Route path="/roommates" element={<Container fluid="lg" className="mt-4"><RoommateFinder user={user} setShowLoginModal={setShowLoginModal} /></Container>} />
          <Route path="/roommate/:profileId" element={<Container fluid="lg" className="mt-4"><RoommateProfileDetail user={user} setShowLoginModal={setShowLoginModal} /></Container>} />
          <Route path="/resources" element={<Container fluid="lg" className="mt-4"><Resources /></Container>} />
          <Route path="/resources/partner/:partnerId" element={<Container fluid="lg" className="mt-4"><PartnerDetail /></Container>} />
          <Route path="/reset-password/:token" element={<Container fluid="lg" className="mt-4"><ResetPassword /></Container>} />
          <Route path="/forgot-password" element={<Container fluid="lg" className="mt-4"><ForgotPassword /></Container>} />
          <Route path="/verification-pending" element={<Container fluid="lg" className="mt-4"><VerificationPending /></Container>} />

          {/* Lazy-loaded protected routes */}
          <Route path="/profile" element={ user ? ( <Container fluid="lg" className="mt-4"><Profile user={user} onUpdateUser={handleUpdateUser} /></Container> ) : <Navigate to="/" /> } />
          <Route path="/my-preferences" element={ user ? ( <Container fluid="lg"className="mt-4"><MyPreferences /></Container> ) : <Navigate to="/" /> } />
          <Route path="/my-roommate-profile" element={ user ? ( <Container fluid="lg" className="mt-4"><MyRoommateProfile user={user} /></Container> ) : <Navigate to="/" /> } />
          <Route path="/messages/:userId" element={ user ? ( <Container fluid="lg" className="mt-4"><Messages socket={socket} user={user} onlineUsers={onlineUsers} onMessagesRead={fetchUnreadCount} /></Container> ) : <Navigate to="/" /> } />
          <Route path="/messages/inbox" element={ user ? ( <Container fluid="lg" className="mt-4"><Messages socket={socket} user={user} onlineUsers={onlineUsers} onMessagesRead={fetchUnreadCount} /></Container> ) : <Navigate to="/" /> } />

          {/* Landlord/Admin routes */}
          <Route path="/my-listings" element={<LandlordRoute><Container fluid="lg" className="mt-4"><MyListings /></Container></LandlordRoute>} />
          <Route path="/my-listings/new" element={<LandlordRoute><Container fluid="lg" className="mt-4"><CreateListing /></Container></LandlordRoute>} />
          <Route path="/my-listings/edit/:id" element={<LandlordRoute><Container fluid="lg" className="mt-4"><EditListing /></Container></LandlordRoute>} />
          <Route path="/admin/partners" element={<AdminRoute><Container fluid="lg" className="mt-4"><AdminPartners /></Container></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
