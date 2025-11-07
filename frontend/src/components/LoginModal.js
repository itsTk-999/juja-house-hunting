import loginBgImage from '../assets/login-bg.jpg';
import React, { useState, useEffect } from 'react';
// --- 1. Import InputGroup ---
import { Button, Form, Alert, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './LoginModal.css'; 
// --- 2. Import FaEye and FaEyeSlash ---
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa'; 
import loginBgImage from '../assets/login-bg.jpg'; 

function LoginModal({ show, onHide, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', 
    role: 'tenant'
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // --- 3. Add state for password visibility ---
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  // --- End Add ---

  const navigate = useNavigate();

  // (All functions like useEffect, handleInputChange, etc. are unchanged)
  useEffect(() => {
    if (show) {
      setError('');
      setMessage('');
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'tenant' });
      setAgreedToTerms(false); 
      setShowPassword(false); // Also reset password visibility
    }
  }, [show]);


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.name || formData.name.trim() === '') {
      return setError("Name is required.");
    }
    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (!agreedToTerms) {
      return setError("You must agree to the Terms and Conditions to create an account.");
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      
      if (formData.role === 'landlord') {
        setMessage("Success! Please log in. To activate your account, please send an email to jujuhousehunt@gmail.com for verification.");
      } else {
         setMessage(data.message || "Registration successful! Please log in.");
      }
      setIsLogin(true); 
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }) 
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to login');
      }
      onLoginSuccess(data); 
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleGoToForgotPassword = () => {
    onHide(); 
    navigate('/forgot-password'); 
  };


  return (
    <div className={`login-signup-panel-container ${show ? 'show' : ''}`} onClick={onHide}>
      <div className="login-signup-panel" onClick={e => e.stopPropagation()}> 
        
        <button className="login-signup-panel-close-btn" onClick={onHide}>
          <FaTimes />
        </button>

        {/* --- Left section for the form --- */}
        <div className="panel-form-section">
          <h3 className="text-center mb-4">{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h3>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          
          <Tabs
            activeKey={isLogin ? 'login' : 'register'}
            onSelect={(k) => setIsLogin(k === 'login')}
            className="mb-4"
            variant="pills"
            justify
          >
            <Tab eventKey="login" title="Login">
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                {/* --- 4. ADD InputGroup for Login Password --- */}
                <Form.Group className="mb-3" controlId="loginPassword">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      onChange={handleInputChange}
                      required
                    />
                    <Button variant="outline-secondary" onClick={togglePasswordVisibility} className="password-toggle-btn">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                {/* --- End Add --- */}

                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Login
                  </Button>
                </div>
                <div className="text-center mt-3">
                  <Button variant="link" size="sm" onClick={handleGoToForgotPassword} className="forgot-password-link">
                    Forgot Password?
                  </Button>
                </div>
              </Form>
            </Tab>
            <Tab eventKey="register" title="Register">
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-3" controlId="registerName">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="registerEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                {/* --- 5. ADD InputGroup for Register Password --- */}
                <Form.Group className="mb-3" controlId="registerPassword">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password (8+ characters)"
                      onChange={handleInputChange}
                      required
                    />
                    <Button variant="outline-secondary" onClick={togglePasswordVisibility} className="password-toggle-btn">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="registerConfirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      onChange={handleInputChange}
                      required
                    />
                    <Button variant="outline-secondary" onClick={togglePasswordVisibility} className="password-toggle-btn">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                {/* --- End Add --- */}

                <Form.Group className="mb-3" controlId="registerRole">
                  <Form.Label>I am a...</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="tenant">Tenant / Roommate</option>
                    <option value="landlord">Landlord</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="registerTerms">
                  <Form.Check 
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    label={
                      <span>
                        I agree to the 
                        <Link to="/terms-and-conditions" target="_blank" className="ms-1 terms-link" onClick={onHide}>
                          Terms and Conditions
                        </Link>
                      </span>
                    }
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="success" 
                    type="submit" 
                    size="lg"
                    disabled={!agreedToTerms} 
                  >
                    Create Account
                  </Button>
                </div>
              </Form>
            </Tab>
          </Tabs>
        </div>

        {/* --- Right section for the image (unchanged) --- */}
        <div 
          className="panel-image-section" 
          style={{ backgroundImage: show? `url(${loginBgImage})` : 'none' }} 
        >
          <div className="panel-image-overlay">
            <h2>Find Your Next Home</h2>
            <p>From cozy apartments to shared spaces, we connect you with the perfect living solution.</p>
            <p>Join our community today!</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginModal;