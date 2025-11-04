import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHourglassHalf, FaEnvelope } from 'react-icons/fa';
// Import the shared auth card styling
import '../components/LoginModal.css';

function VerificationPending() {
  const adminEmail = "jujahousehunt@gmail.com"; // Change this to your actual admin email

  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={8}>
          <Card className="auth-card shadow-lg" data-aos="fade-up">
            <Card.Header as="h3" className="text-center auth-card-header">
              <FaHourglassHalf className="me-3" />
              Account Pending Verification
            </Card.Header>
            <Card.Body className="text-center">
              <Alert variant="info">
                Your landlord account has been created successfully, but it is currently pending verification from an administrator.
              </Alert>
              
              <p className="lead mt-4">
                To activate your account and begin posting listings, please send an email to:
              </p>
              
              <h4 className="my-3">
                <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
              </h4>
              
              <p className="text-muted">
                Please include your registered email and full name in your verification request. We apologize for the inconvenience, this step ensures the quality and safety of our listings.
              </p>
              
              <hr />
              
              <div className="d-grid gap-2 d-md-flex justify-content-center">
                <Button as={Link} to="/" variant="primary" size="lg">
                  Back to Home
                </Button>
                <Button href={`mailto:${adminEmail}`} variant="outline-success" size="lg">
                  <FaEnvelope className="me-2" />
                  Open Email Client
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default VerificationPending;