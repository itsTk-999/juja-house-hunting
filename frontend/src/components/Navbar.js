import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown, Image, Badge} from 'react-bootstrap'; 
import { LinkContainer } from 'react-router-bootstrap'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUserCircle, FaSun, FaMoon, FaBuilding, FaCommentDots, 
  FaSignOutAlt, FaRegHeart, FaWrench 
} from 'react-icons/fa'; 
import { useTheme } from '../context/ThemeContext'; 
import './Navbar.css'; 
import logo from '../assets/logo.png'; 

function AppNavbar({ user, onLogout, onLoginClick, unreadCount }) {
  const { theme, toggleTheme } = useTheme(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // ✅ 1. Remove token from localStorage / sessionStorage
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      // ✅ 2. Remove user info
      localStorage.removeItem('user');

      // ✅ 3. Clear global axios Authorization header
      delete axios.defaults.headers.common['Authorization'];

      // ✅ 4. Trigger parent logout (if provided)
      if (onLogout) onLogout();

      // ✅ 5. Redirect user to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isLandlord = user && user.role === 'landlord';
  const isTenant = user && (user.role === 'tenant' || !user.role); 
  const isAdmin = user && user.role === 'admin'; 

  return (
    <Navbar 
      expand="lg" 
      sticky="top" 
      className={`navbar-custom shadow-sm navbar-${theme}`} 
    >
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="d-flex align-items-center">
            <img src={logo} alt="Juja Home Logo" className="navbar-logo" />
            <span className="ms-2 site-title d-none d-md-block">Juja Homes</span> 
          </Navbar.Brand>
        </LinkContainer>
        <div className="d-flex align-items-center">
          {user && (
            <NavDropdown 
              title={
                <div className="d-flex align-items-center">
                  {user.profilePicture ? (
                    <Image src={user.profilePicture} roundedCircle className="mobile-navbar-avatar" />
                  ) : (
                    <FaUserCircle className="mobile-navbar-avatar-placeholder" />
                  )}
                </div>
              } 
              id="mobile-nav-dropdown"
              align="end"
              className="mobile-profile-dropdown"
            >
              <LinkContainer to="/profile"><NavDropdown.Item><FaUserCircle className="me-2" />My Profile</NavDropdown.Item></LinkContainer>
              {isTenant && (
                <>
                  <LinkContainer to="/my-preferences"><NavDropdown.Item><FaRegHeart className="me-2" />My Preferences</NavDropdown.Item></LinkContainer>
                  <LinkContainer to="/my-roommate-profile"><NavDropdown.Item><FaUserCircle className="me-2" />My Roommate Profile</NavDropdown.Item></LinkContainer>
                  <LinkContainer to="/messages/inbox">
                    <NavDropdown.Item>
                      <FaCommentDots className="me-2" /> Messages 
                      {unreadCount > 0 && <Badge bg="success" pill className="ms-2">{unreadCount}</Badge>}
                    </NavDropdown.Item>
                  </LinkContainer>
                </>
              )}
              {isLandlord && (
                <LinkContainer to="/my-listings"><NavDropdown.Item><FaBuilding className="me-2" />My Listings</NavDropdown.Item></LinkContainer>
              )}
              {isAdmin && (
                <>
                  <LinkContainer to="/my-listings"><NavDropdown.Item><FaBuilding className="me-2" />My Listings</NavDropdown.Item></LinkContainer>
                  <LinkContainer to="/my-preferences"><NavDropdown.Item><FaRegHeart className="me-2" />My Preferences</NavDropdown.Item></LinkContainer>
                  <NavDropdown.Divider />
                  <NavDropdown.Header>Admin</NavDropdown.Header>
                  <LinkContainer to="/admin/partners"><NavDropdown.Item><FaWrench className="me-2" />Manage Partners</NavDropdown.Item></LinkContainer>
                </>
              )}
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout} className="text-danger">
                <FaSignOutAlt className="me-2" /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          )}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
        </div>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/"><Nav.Link>Home</Nav.Link></LinkContainer>
            <LinkContainer to="/apartments"><Nav.Link>Apartments</Nav.Link></LinkContainer>
            {(!user || isTenant) && (
              <LinkContainer to="/roommates"><Nav.Link>Roommates</Nav.Link></LinkContainer>
            )}
            <LinkContainer to="/resources"><Nav.Link>Resources</Nav.Link></LinkContainer>
            <LinkContainer to="/about"><Nav.Link>About</Nav.Link></LinkContainer>
            <LinkContainer to="/contact"><Nav.Link>Contact</Nav.Link></LinkContainer>
          </Nav>

          <Nav className="ms-auto d-flex align-items-center flex-row"> 
            <button 
              onClick={toggleTheme}
              className="theme-switch me-3"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? 
                <FaSun className="text-warning"/> : 
                <FaMoon className="text-light"/>
              }
            </button>

            {user ? (
              <NavDropdown 
                title={
                  <>
                    {user.profilePicture ? (
                      <Image src={user.profilePicture} roundedCircle className="navbar-avatar" />
                    ) : (
                      <FaUserCircle size={24} className="navbar-avatar-placeholder" />
                    )}
                    <span className="d-none d-lg-inline ms-1">{user.name}</span>
                  </>
                } 
                id="basic-nav-dropdown"
                align="end"
                className="profile-dropdown"
              >
                <LinkContainer to="/profile"><NavDropdown.Item><FaUserCircle className="me-2" />My Profile</NavDropdown.Item></LinkContainer>
                
                {isTenant && (
                  <>
                    <LinkContainer to="/my-preferences"><NavDropdown.Item><FaRegHeart className="me-2" />My Preferences</NavDropdown.Item></LinkContainer>
                    <LinkContainer to="/my-roommate-profile"><NavDropdown.Item><FaUserCircle className="me-2" />My Roommate Profile</NavDropdown.Item></LinkContainer>
                    <LinkContainer to="/messages/inbox">
                      <NavDropdown.Item>
                        <FaCommentDots className="me-2" /> Messages 
                        {unreadCount > 0 && <Badge bg="success" pill className="ms-2">{unreadCount}</Badge>}
                      </NavDropdown.Item>
                    </LinkContainer>
                  </>
                )}

                {isLandlord && (
                  <LinkContainer to="/my-listings"><NavDropdown.Item><FaBuilding className="me-2" />My Listings</NavDropdown.Item></LinkContainer>
                )}
                
                {isAdmin && (
                  <>
                    <LinkContainer to="/my-listings"><NavDropdown.Item><FaBuilding className="me-2" />My Listings</NavDropdown.Item></LinkContainer>
                    <LinkContainer to="/my-preferences"><NavDropdown.Item><FaRegHeart className="me-2" />My Preferences</NavDropdown.Item></LinkContainer>
                    <NavDropdown.Divider />
                    <NavDropdown.Header>Admin</NavDropdown.Header>
                    <LinkContainer to="/admin/partners"><NavDropdown.Item><FaWrench className="me-2" />Manage Partners</NavDropdown.Item></LinkContainer>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button variant="outline-success" onClick={onLoginClick}>
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
