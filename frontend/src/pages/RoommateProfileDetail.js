import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Image, Badge, ListGroup } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

function RoommateProfileDetail({ user, setShowLoginModal }) {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/roommate/${profileId}`);
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
      setShowLoginModal(true);
    }
  }, [profileId, user, setShowLoginModal]);
  
  if (!user) {
    return (
        <Container className="text-center py-5">
            <Alert variant="warning" data-aos="fade-in">
                <Alert.Heading>Access Denied</Alert.Heading>
                <p>You must be logged in to view roommate profiles.</p>
                <p>Please log in or create an account to continue.</p>
                <hr />
                <Link to="/roommates">
                  <Button variant="secondary">Back to Roommate Finder</Button>
                </Link>
            </Alert>
        </Container>
    );
  }

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  if (!profile || !profile.user) { 
    return <Alert variant="warning">Profile could not be loaded.</Alert>;
  }
  
  const { user: profileUser, budget, preferredLocation, cleanliness, smoking, pets, guests, bio } = profile;

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm" data-aos="fade-up">
            <Card.Header as="h3" className="text-center p-4">
              {profileUser.profilePicture ? (
                <Image src={profileUser.profilePicture} roundedCircle style={{ width: '120px', height: '120px', objectFit: 'cover', border: '4px solid #fff' }} />
              ) : (
                <FaUserCircle size={120} className="text-muted" />
              )}
              <h4 className="mt-3 mb-0">{profileUser.name}</h4>
              <p className="text-muted mb-0">{profileUser.occupation} | {profileUser.gender}</p>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                {/* --- Link to the correct /messages/:userId route --- */}
                <Button as={Link} to={`/messages/${profileUser._id}`} variant="success" size="lg">
                  Send Message
                </Button>
              </div>
              
              <h5>About Me</h5>
              <p className="text-muted" style={{whiteSpace: 'pre-wrap'}}>{bio || 'No bio provided.'}</p>
              
              <hr />
              
              <h5>Preferences</h5>
              <ListGroup variant="flush">
                <ListGroup.Item><strong>Budget:</strong> KSH {budget.min} - {budget.max} / month</ListGroup.Item>
                <ListGroup.Item>
                  <strong>Preferred Locations:</strong> 
                  {preferredLocation.length > 0 ? 
                    preferredLocation.map(loc => <Badge bg="secondary" className="ms-1" key={loc}>{loc}</Badge>) : 
                    ' N/A'}
                </ListGroup.Item>
                <ListGroup.Item><strong>Cleanliness:</strong> {cleanliness}</ListGroup.Item>
                <ListGroup.Item><strong>Smoking:</strong> {smoking}</ListGroup.Item>
                <ListGroup.Item><strong>Pets:</strong> {pets}</ListGroup.Item>
                <ListGroup.Item><strong>Guests:</strong> {guests}</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RoommateProfileDetail;