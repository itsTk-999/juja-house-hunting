import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
// We don't need useNavigate here
import { authFetch } from '../utils/authFetch';
import { FaTrash } from 'react-icons/fa'; 
import './EditListing.css'; // Reuse danger zone styles
import './MyRoommateProfile.css'; // Import specific styles

// --- 1. DEFINE a constant for the initial state ---
const initialFormState = {
  budget: { min: 5000, max: 10000 },
  preferredLocation: [],
  cleanliness: 'Average',
  smoking: 'Never',
  pets: 'No',
  guests: 'Sometimes',
  bio: '',
};

function MyRoommateProfile({ user }) {
  const [formData, setFormData] = useState(initialFormState); // Use the constant
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasProfile, setHasProfile] = useState(false); 

  // Fetch existing profile data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authFetch('/api/roommate/me');
        if (response.ok) {
          const data = await response.json();
          // Set form data from the fetched profile
          setFormData({
            budget: data.budget || { min: 5000, max: 10000 },
            preferredLocation: data.preferredLocation || [],
            cleanliness: data.cleanliness || 'Average',
            smoking: data.smoking || 'Never',
            pets: data.pets || 'No',
            guests: data.guests || 'Sometimes',
            bio: data.bio || '',
          });
          setHasProfile(true); 
        } else {
          setHasProfile(false); 
          console.log('No existing roommate profile found.');
        }
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []); // Run once on load

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      budget: { ...prev.budget, [name]: Number(value) }
    }));
  };
  
  const handleLocationChange = (e) => {
    const { options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, preferredLocation: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await authFetch('/api/roommate/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save profile");
      setSuccess('Roommate profile saved successfully!');
      setHasProfile(true); 
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };
  
  const handleDelete = async () => {
     if (window.confirm("Are you sure you want to deactivate your roommate profile? This will remove you from all public roommate listings.")) {
      setLoading(true); setError(''); setSuccess('');
      try {
        const response = await authFetch('/api/roommate/me', {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete profile');
        
        setSuccess('Profile deactivated successfully.');
        setHasProfile(false); 
        setFormData(initialFormState); // Reset form to defaults
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !success && !error) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-4 shadow-sm" data-aos="fade-up">
            <Card.Body>
              <h2 className="text-center mb-4">My Roommate Profile</h2>
              <p className="text-center text-muted">Set your preferences to find the best matches.</p>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit} className="roommate-profile-form">
                <h5 className="mt-4">Budget (KSH per month)</h5>
                <Row>
                  <Col>
                    <Form.Group controlId="budgetMin">
                      <Form.Label>Min</Form.Label>
                      <Form.Control type="number" name="min" value={formData.budget.min} onChange={handleBudgetChange} />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="budgetMax">
                      <Form.Label>Max</Form.Label>
                      <Form.Control type="number" name="max" value={formData.budget.max} onChange={handleBudgetChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <h5 className="mt-4">Preferences</h5>
                <Form.Group className="mb-3" controlId="preferredLocation">
                  <Form.Label>Preferred Location(s) (Hold Ctrl/Cmd to select multiple)</Form.Label>
                  <Form.Select multiple name="preferredLocation" value={formData.preferredLocation} onChange={handleLocationChange}>
                    <option value="Gate A">Gate A</option>
                    <option value="Gate B">Gate B</option>
                    <option value="Gate C">Gate C</option>
                    <option value="Gate D">Gate D</option>
                    <option value="Gate E">Gate E</option>
                  </Form.Select>
                </Form.Group>
                <h5 className="mt-4">Lifestyle</h5>
                <Form.Group className="mb-3" controlId="cleanliness">
                  <Form.Label>Cleanliness</Form.Label>
                  <Form.Select name="cleanliness" value={formData.cleanliness} onChange={handleChange}>
                    <option value="Very Tidy">Very Tidy</option>
                    <option value="Tidy">Tidy</option>
                    <option value="Average">Average</option>
                    <option value="Relaxed">Relaxed</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="smoking">
                  <Form.Label>Smoking</Form.Label>
                  <Form.Select name="smoking" value={formData.smoking} onChange={handleChange}>
                    <option value="Never">Never</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Outside Only">Outside Only</option>
                    <option value="Regularly">Regularly</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="pets">
                  <Form.Label>Pets</Form.Label>
                  <Form.Select name="pets" value={formData.pets} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Maybe">Maybe</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="guests">
                  <Form.Label>Guests</Form.Label>
                  <Form.Select name="guests" value={formData.guests} onChange={handleChange}>
                    <option value="Rarely">Rarely</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Often">Often</option>
                  </Form.Select>
                </Form.Group>
                <h5 className="mt-4">Roommate Bio</h5>
                <Form.Group className="mb-3" controlId="bio">
                  <Form.Label>About you (as a roommate)</Form.Label>
                  <Form.Control as="textarea" rows={4} name="bio" value={formData.bio} onChange={handleChange} placeholder="Describe your habits, what you're looking for, etc." />
                </Form.Group>
                
                <div className="d-grid mt-4">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner as="span" size="sm" /> : (hasProfile ? 'Update Profile' : 'Create Profile')}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {hasProfile && (
            <Card className="danger-zone mt-4" data-aos="fade-up">
              <Card.Header>Danger Zone</Card.Header>
              <Card.Body>
                <div className="danger-text">
                  <p>Deactivate your Roommate Profile</p>
                  <span>This will remove you from all public roommate listings.</span>
                </div>
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                  <FaTrash /> Deactivate
                </Button>
              </Card.Body>
            </Card>
          )}

        </Col>
      </Row>
    </Container>
  );
}

export default MyRoommateProfile;