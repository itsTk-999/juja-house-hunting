import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { Container, Row, Col, Carousel, Button, Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap'; 
import { FaWhatsapp, FaPhone } from 'react-icons/fa';

// --- 1. Accept 'user' and 'setShowLoginModal' as props ---
function ApartmentDetail({ user, setShowLoginModal }) {
  const { id } = useParams();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApartment = async () => { 
       setError(''); 
       // Don't set loading true here, it's already true
      try {
        const response = await fetch(`/api/apartments/${id}`); 
        if (!response.ok) {
           const errorData = await response.json();
           if (response.status === 404) throw new Error('Apartment not found.');
           throw new Error(errorData.message || `Failed to fetch apartment (${response.status})`);
        }
        const data = await response.json();
        setApartment(data);
      } catch (err) { 
          setError(err.message); 
      } 
      finally { 
          setLoading(false); 
      }
    };
    
    // --- 2. Add the protection logic ---
    if (user) {
      // User is logged in, fetch the data
      fetchApartment();
    } else {
      // No user, stop loading and show modal
      setLoading(false);
      setShowLoginModal(true);
    }
    // --- End protection logic ---

  }, [id, user, setShowLoginModal]); // Add dependencies

  // --- 3. Add a render block for non-logged-in users ---
  if (!user) {
    return (
        <Container className="text-center py-5">
            <Alert variant="warning" data-aos="fade-in">
                <Alert.Heading>Access Denied</Alert.Heading>
                <p>You must be logged in to view apartment details.</p>
                <p>Please log in or create an account to continue.</p>
                <hr />
                <Link to="/apartments">
                  <Button variant="secondary">Back to Listings</Button>
                </Link>
            </Alert>
        </Container>
    );
  }
  // --- End block ---

  // --- Loading/Error/Not Found States ---
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading apartment details...</p>
      </Container>
    );
  }
  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
        <Link to="/apartments">Back to Listings</Link>
      </Container>
    );
  }
  if (!apartment) {
     return (
      <Container>
        <Alert variant="warning">Apartment details could not be loaded.</Alert>
         <Link to="/apartments">Back to Listings</Link>
      </Container>
    );
  }
  // --- End States ---

  // Destructure data 
  const { 
      title, price, location, type, description, images, features, 
      landlordName, landlordContact, landlordWhatsapp, 
      latitude, longitude 
  } = apartment;

  // --- Contact Logic ---
  const isPhone = landlordContact && /^\+?[0-9\s-]+$/.test(landlordContact);
  const callNumber = isPhone ? landlordContact.replace(/\s|-/g, '') : null;
  const whatsappNumber = landlordWhatsapp ? landlordWhatsapp.replace(/\s|-|\+/g, '') : null; 
  
  // Create Google Maps Link
  const googleMapsLink = latitude && longitude 
    ? `https://www.google.com/maps?q=${latitude},${longitude}` 
    : null;


  return (
    <Container>
      <Row className="g-5">
        {/* Left Column: Images and Details */}
        <Col lg={8}>
          {/* Image Gallery Carousel */}
          {images && images.length > 0 ? (
            <Carousel className="mb-4 shadow rounded overflow-hidden" data-aos="fade-in">
              {images.map((img, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={img}
                    alt={`${title}`} 
                    style={{ height: '60vh', objectFit: 'cover' }} 
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div className="text-center p-5 bg-light rounded mb-4">No images available.</div>
          )}

          {/* Title and Price */}
          <div className="d-flex justify-content-between align-items-center mb-3" data-aos="fade-up">
            <h1 className="mb-0">{title || 'N/A'}</h1>
            <span className="fs-3 text-success fw-bold">
              KSH {price ? price.toLocaleString() : 'N/A'}/mo
            </span>
          </div>

          <div className="mb-3" data-aos="fade-up" data-aos-delay="50">
            {location && <Badge bg="secondary" className="me-2 fs-6">{location}</Badge>}
            {type && <Badge bg="info" className="fs-6">{type}</Badge>}
          </div>

          {/* Full Description */}
          {description && (
             <Card className="mb-4" data-aos="fade-up" data-aos-delay="100">
               <Card.Header as="h5">Description</Card.Header>
               <Card.Body>
                 <Card.Text style={{ whiteSpace: 'pre-wrap' }}>{description}</Card.Text>
               </Card.Body>
             </Card>
          )}

          {/* Location Map Section */}
          <Card data-aos="fade-up" data-aos-delay="150" className="mb-4">
            <Card.Header as="h5">Location</Card.Header>
            <Card.Body>
              {googleMapsLink ? (
                <p>
                  {' '}
                  <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" style={{ color: 'blue' }}>
                    Click Here
                  </a>.
                </p>
              ) : (
                <Card.Text>Exact location coordinates are not available for this listing.</Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Features and Contact */}
        <Col lg={4}>
          {/* Features Card */}
          <Card className="mb-4 shadow-sm" data-aos="fade-left">
            <Card.Header as="h5">Features</Card.Header>
            {features ? (
              <ListGroup variant="flush">
                <ListGroup.Item><strong>Furnishing:</strong> {features.furnishing || 'N/A'}</ListGroup.Item>
                <ListGroup.Item><strong>Water:</strong> {features.water || 'N/A'}</ListGroup.Item>
                <ListGroup.Item><strong>Wi-Fi:</strong> {features.wifi || 'N/A'}</ListGroup.Item>
                <ListGroup.Item><strong>Parking:</strong> {features.parking ? "Yes" : "No"}</ListGroup.Item>
                <ListGroup.Item><strong>Balcony:</strong> {features.balcony ? "Yes" : "No"}</ListGroup.Item>
                <ListGroup.Item><strong>Security:</strong> {features.biometric ? "Biometric Access" : "Standard"}</ListGroup.Item>
                <ListGroup.Item><strong>Shower:</strong> {features.hotShower ? "Hot Shower" : "Regular"}</ListGroup.Item>
              </ListGroup>
            ) : (
              <Card.Body>
                <Card.Text>No features listed.</Card.Text>
              </Card.Body>
            )}
          </Card>

          {/* Contact Card */}
          <Card className="shadow-sm" data-aos="fade-left" data-aos-delay="100">
            <Card.Header as="h5">Contact Landlord</Card.Header>
            <Card.Body className="text-center">
              <Card.Title>{landlordName || apartment.owner?.name || 'Landlord'}</Card.Title> 
              <Card.Text>
                Contact: <strong>{landlordContact || 'Not Provided'}</strong>
              </Card.Text>

              <Row className="g-2">
                <Col>
                  <Button 
                    variant="success" 
                    className="w-100" 
                    href={`tel:${callNumber}`}
                    disabled={!callNumber} 
                  >
                    <FaPhone className="me-2" />
                    Call
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="outline-success" 
                    className="w-100" 
                    href={`https://wa.me/${whatsappNumber}`} 
                    target="_blank"
                    disabled={!whatsappNumber} 
                  >
                    <FaWhatsapp className="me-2" />
                    WhatsApp
                  </Button>
                </Col>
              </Row>

              {!callNumber && !whatsappNumber && (
                  <p className="text-muted mt-3 small">Direct contact buttons not available.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ApartmentDetail;