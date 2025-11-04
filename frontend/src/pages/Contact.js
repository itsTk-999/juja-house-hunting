import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaLinkedin, FaFacebookSquare, FaTiktok, FaInstagramSquare, FaWhatsappSquare, FaTwitterSquare } from 'react-icons/fa';
import './Contact.css'; // Import the CSS

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => { 
     setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => { 
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || "Thanks for getting in touch!");
        setFormData({ name: '', email: '', message: '' }); 
      } else {
        setError(data.message || 'An error occurred.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // --- Container div now handles image background ---
    <div className="contact-page-container"> 
      
      {/* --- Image Overlay --- */}
      <div className="contact-image-overlay"></div> 
      
      {/* --- Wrapper for Content --- */}
      <div className="contact-content-wrapper">
        <Container>
          <Row className="justify-content-center">
            <Col md={7}>
              <Card className="p-4 contact-card" data-aos="fade-up"> 
                <Card.Body>
                  <h2 className="text-center mb-4">Get In Touch</h2>
                  <p className="text-center text-muted mb-4">
                    Have a question or a listing to add? Drop us a line.
                  </p>
                  
                  {success && <Alert variant="success" className="success-message-fade-in">{success}</Alert>}
                  {error && <Alert variant="danger">{error}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    {/* ... Form groups ... */}
                    <Form.Group className="mb-3" controlId="contactForm.Name">
                      <Form.Label>Your Name</Form.Label>
                      <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="contactForm.Email">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="contactForm.Message">
                      <Form.Label>Message</Form.Label>
                      <Form.Control as="textarea" name="message" rows={5} value={formData.message} onChange={handleChange} required />
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* --- Social Media Icons Section --- */}
          <Row data-aos="fade-up" data-aos-delay="100">
            <Col className="social-icons-section">
              <h4>Connect with us</h4>
              <div>
                {/* Remember to replace '#' and phone number */}
                <a href="https://www.linkedin.com/in/mutai-felix-184a1a2a5" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaLinkedin /></a>
                <a href="#!" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaFacebookSquare /></a>
                <a href="https://www.tiktok.com/@jujahousehunt" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaTiktok /></a>
                <a href="https://www.instagram.com/jujahousehunt/" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaInstagramSquare /></a>
                <a href="https://wa.me/+254101290354" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaWhatsappSquare /></a>
                <a href="https://x.com/jujahousehunt" target="_blank" rel="noopener noreferrer" role="button" className="social-icon-link"><FaTwitterSquare /></a>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default Contact;