import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa'; 
// --- 1. Import the correct CSS ---
import '../components/LoginModal.css'; 

function ResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      setSuccess(data.message);
      setTimeout(() => navigate('/'), 3000); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={6}>
          {/* --- 2. Add custom class --- */}
          <Card className="auth-card shadow-lg" data-aos="fade-up">
            <Card.Header as="h3" className="text-center auth-card-header">
              Choose a New Password
            </Card.Header>
            <Card.Body>
              
              {/* --- 3. Add Back Arrow Link --- */}
              <Link to="/" className="forgot-password-link text-muted mb-3 d-block" style={{ textDecoration: 'none' }}>
                <FaArrowLeft className="me-2" /> Back to Home
              </Link>
              {/* --- End Add --- */}

              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  {success} Redirecting...
                </Alert>
              )}
              
              {!success && (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter new password (8+ characters)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button variant="primary" type="submit" disabled={loading} size="lg">
                      {loading ? <Spinner as="span" size="sm" /> : 'Set New Password'}
                    </Button>
                  </div>
                </Form>
              )}
               {success && (
                <div className="text-center mt-3">
                  <Link to="/">Go to Home</Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ResetPassword;