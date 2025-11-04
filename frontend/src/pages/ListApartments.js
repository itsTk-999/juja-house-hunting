import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch'; 
// import './ListApartment.css'; // If you have custom CSS for this page

function ListApartment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', location: '', type: '',
    images: [], // Assuming this will be URLs, not files
    furnishing: '', water: '', wifi: '', parking: false, balcony: false,
    biometric: false, hotShower: false,
    // --- NEW: Landlord Contact Info ---
    landlordName: '',
    landlordContact: '',
    // --- END NEW ---
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Simplified image handling for now (just accepting URLs)
  const handleImageChange = (e) => {
    const imageUrl = e.target.value;
    // For now, let's just add the URL as a single string to the images array
    // In a real app, you'd handle file uploads here
    setFormData(prev => ({
        ...prev,
        images: imageUrl ? [imageUrl] : [] // Only one image URL for simplicity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authFetch('/api/apartments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list apartment');
      }

      const data = await response.json();
      setSuccess('Apartment listed successfully!');
      // Optionally clear form or redirect
      setFormData({ // Clear form
        title: '', description: '', price: '', location: '', type: '',
        images: [], furnishing: '', water: '', wifi: '', parking: false, balcony: false,
        biometric: false, hotShower: false,
        landlordName: '', landlordContact: '',
      });
      console.log('Apartment created:', data);
      navigate('/my-listings'); // Redirect to my listings or apartment details
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-lg p-4">
            <h2 className="text-center mb-4">List Your Apartment</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSubmit}>
              {/* --- Apartment Details --- */}
              <h4 className="mb-3">Apartment Details</h4>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" name="description" rows={3} value={formData.description} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (KSH/month)</Form.Label>
                <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Select name="location" value={formData.location} onChange={handleChange} required>
                  <option value="">Select Location</option>
                  <option value="Gate A">Gate A</option>
                  <option value="Gate B">Gate B</option>
                  <option value="Gate C">Gate C</option>
                  <option value="Gate D">Gate D</option>
                  <option value="Gate E">Gate E</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Apartment Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Bedsitter">Bedsitter</option>
                  <option value="One Bedroom">One Bedroom</option>
                  <option value="Two Bedroom">Two Bedroom</option>
                  <option value="Three Bedroom">Three Bedroom</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image URL (for simplicity, one URL for now)</Form.Label>
                <Form.Control type="text" name="images" value={formData.images[0] || ''} onChange={handleImageChange} placeholder="e.g., https://example.com/apartment.jpg" />
              </Form.Group>

              {/* --- NEW: Landlord Contact Details --- */}
              <h4 className="mb-3 mt-4">Your Contact Details (Landlord)</h4>
              <Form.Group className="mb-3">
                <Form.Label>Your Name</Form.Label>
                <Form.Control type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Your Contact (Phone or Email)</Form.Label>
                <Form.Control type="text" name="landlordContact" value={formData.landlordContact} onChange={handleChange} required />
              </Form.Group>
              {/* --- END NEW --- */}

              {/* --- Features --- */}
              <h4 className="mb-3 mt-4">Features & Amenities</h4>
              <Form.Group className="mb-3">
                <Form.Label>Furnishing</Form.Label>
                <Form.Select name="furnishing" value={formData.furnishing} onChange={handleChange}>
                  <option value="">Select Furnishing</option>
                  <option value="Furnished">Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Partially Furnished">Partially Furnished</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Water Availability</Form.Label>
                <Form.Select name="water" value={formData.water} onChange={handleChange}>
                  <option value="">Select Water Info</option>
                  <option value="24/7">24/7</option>
                  <option value="Reliable">Reliable</option>
                  <option value="Intermittent">Intermittent</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Wi-Fi</Form.Label>
                <Form.Select name="wifi" value={formData.wifi} onChange={handleChange}>
                  <option value="">Select Wi-Fi Info</option>
                  <option value="Included">Included</option>
                  <option value="Available">Available (Payable)</option>
                  <option value="Not Included">Not Included</option>
                </Form.Select>
              </Form.Group>

              <Row className="mb-3">
                <Col>
                  <Form.Check type="checkbox" label="Parking Available" name="parking" checked={formData.parking} onChange={handleChange} />
                </Col>
                <Col>
                  <Form.Check type="checkbox" label="Balcony" name="balcony" checked={formData.balcony} onChange={handleChange} />
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Form.Check type="checkbox" label="Biometric Access" name="biometric" checked={formData.biometric} onChange={handleChange} />
                </Col>
                <Col>
                  <Form.Check type="checkbox" label="Hot Shower" name="hotShower" checked={formData.hotShower} onChange={handleChange} />
                </Col>
              </Row>

              <div className="d-grid mt-4">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'List Apartment'}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ListApartment;