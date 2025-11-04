import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Image, ListGroup } from 'react-bootstrap';
import { FaGlobe, FaWhatsapp, FaEnvelope, FaLink } from 'react-icons/fa';
import './Resources.css'; // Use the same styles as the Resources page

function PartnerDetail() {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/partners/${partnerId}`); 
        if (!response.ok) throw new Error('Partner not found.');
        const data = await response.json();
        setPartner(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [partnerId]);
  
  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  if (!partner) {
    return <Alert variant="warning">Partner details could not be loaded.</Alert>;
  }
  
  // --- THIS IS THE FIX ---
  // Use the new fields directly from the database
  const websiteLink = partner.websiteLink && partner.websiteLink !== '#' ? partner.websiteLink : null;
  const whatsappNumber = partner.whatsapp || null; // Use the whatsapp field
  const email = partner.email || null; // Use the email field
  // --- END FIX ---

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg partner-detail-card" data-aos="fade-up">
            <Card.Header className="text-center p-4 resource-header-simple">
              <Image src={partner.logoUrl} alt={partner.name} className="partner-logo-large" />
              <h2 className="mt-3">{partner.name}</h2>
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
              
              <h5 className="section-heading-detail">About This Partner</h5>
              <p className="text-muted" style={{whiteSpace: 'pre-wrap'}}>{partner.description}</p>
              
              <h5 className="section-heading-detail mt-4">Contact & Links</h5>
              <ListGroup variant="flush" className="mb-4">
                {websiteLink && (
                  <ListGroup.Item>
                    <FaLink className="me-3 text-primary" />
                    <strong>Website:</strong> <a href={websiteLink} target="_blank" rel="noopener noreferrer">{websiteLink.replace(/(^\w+:|^)\/\//, '').split('/')[0]}</a>
                  </ListGroup.Item>
                )}
                {email && (
                  <ListGroup.Item>
                    <FaEnvelope className="me-3 text-info" />
                    <strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a>
                  </ListGroup.Item>
                )}
                {whatsappNumber && (
                  <ListGroup.Item>
                    <FaWhatsapp className="me-3 text-success" />
                    <strong>WhatsApp:</strong> {whatsappNumber}
                  </ListGroup.Item>
                )}
              </ListGroup>

              {/* --- Contact Buttons --- */}
              <Row className="g-3">
                {websiteLink && (
                  <Col md={whatsappNumber ? 6 : 12}>
                    <Button 
                      variant="primary" 
                      href={websiteLink} 
                      target="_blank" 
                      className="w-100"
                    >
                      <FaGlobe className="me-2" /> Visit Site
                    </Button>
                  </Col>
                )}
                {whatsappNumber && (
                  <Col md={websiteLink ? 6 : 12}>
                    <Button 
                      variant="success" 
                      href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      className="w-100"
                    >
                      <FaWhatsapp className="me-2" /> Message on WhatsApp
                    </Button>
                  </Col>
                )}
              </Row>
              
              {(!whatsappNumber && !websiteLink && !email) && <Alert variant="secondary" className="mt-3">No direct contact links available.</Alert>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default PartnerDetail;