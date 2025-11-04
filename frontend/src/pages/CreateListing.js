import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { FaPlus } from 'react-icons/fa'; 
import './EditListing.css'; // We use the (updated) EditListing.css for styling

const initialState = {
  title: '', description: '', price: '', location: 'Gate A', type: 'Bedsitter',
  latitude: '', longitude: '', landlordName: '', landlordContact: '', landlordWhatsapp: '',
  vacancies: 1, 
  features: {
    furnishing: 'Unfurnished', water: 'Reliable', wifi: 'Not Included', parking: false, balcony: false,
    biometric: false, hotShower: false,
  },
};

function CreateListing() {
  const [formData, setFormData] = useState(initialState);
  const [selectedFiles, setSelectedFiles] = useState(null); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- (Handlers: handleChange, handleFeatureChange, handleFileChange are unchanged) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };
  const handleFeatureChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };
  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files); 
  };
  // --- End Handlers ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    // Validation (unchanged)
    if (!formData.title || !formData.description || !formData.price || !formData.location || !formData.type || !formData.landlordName || !formData.landlordContact) {
        setError('Please fill in all required text fields.');
        setLoading(false); return;
    }
    if (!selectedFiles || selectedFiles.length === 0) { 
         setError('Please select at least one image file for the listing.');
         setLoading(false); return;
    }

    // Build FormData (unchanged)
    const data = new FormData();
    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file) => {
        data.append('listingImages', file); 
      });
    }
    for (const key in formData) {
      if (key === 'features') {
        data.append('features', JSON.stringify(formData.features));
      } else if (key === 'price' || key === 'latitude' || key === 'longitude' || key === 'vacancies') { 
         data.append(key, String(formData[key] || ''));
      } else if (key !== 'images'){ 
        data.append(key, formData[key]);
      }
    }
    
    // Fetch (unchanged)
    try {
      const response = await authFetch('/api/apartments', {
        method: 'POST', body: data, 
      });
      const responseData = await response.json(); 
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create listing.');
      }
      setSuccess('Listing created successfully! Redirecting...');
      setTimeout(() => { navigate('/my-listings'); }, 2000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="p-4 p-md-5 shadow-sm" data-aos="fade-up">
            <Card.Body>
              <h2 className="text-center mb-4">Create a New Listing</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit} noValidate> 
                {/* --- ADDED CLASSNAME --- */}
                <h4 className="mb-3 form-section-heading">Apartment Details</h4>
                <Form.Group className="mb-3" controlId="title">
                  <Form.Label>Property Title *</Form.Label>
                  <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>Property Description *</Form.Label>
                  <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleChange} required />
                </Form.Group>
                
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="price">
                      <Form.Label>Price (KSH/month) *</Form.Label>
                      <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required min="0" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="vacancies">
                      <Form.Label>Vacancies *</Form.Label>
                      <Form.Control type="number" name="vacancies" value={formData.vacancies} onChange={handleChange} required min="0" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="location">
                      <Form.Label>Location *</Form.Label>
                      <Form.Select name="location" value={formData.location} onChange={handleChange} required>
                        <option value="Gate A">Gate A</option>
                        <option value="Gate B">Gate B</option>
                        <option value="Gate C">Gate C</option>
                        <option value="Gate D">Gate D</option>
                        <option value="Gate E">Gate E</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="type">
                            <Form.Label>Property Type *</Form.Label>
                            <Form.Select name="type" value={formData.type} onChange={handleChange} required>
                                <option value="Single Room">Single Room</option>
                                <option value="Bedsitter">Bedsitter</option>
                                <option value="One Bedroom">One Bedroom</option>
                                <option value="Two Bedroom">Two Bedroom</option>
                                <option value="Three Bedroom">Three Bedroom</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="latitude">
                            <Form.Label>Latitude *</Form.Label>
                            <Form.Control type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="-1.1018" required />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="longitude">
                            <Form.Label>Longitude *</Form.Label>
                            <Form.Control type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="37.0144" required />
                        </Form.Group>
                    </Col>
                </Row>
                 <Form.Text className="text-muted mb-3 d-block">
                  Coordinates required for map feature.
                </Form.Text>
                
                {/* --- ADDED CLASSNAME --- */}
                <h4 className="mb-3 form-section-heading">Listing Images *</h4>
                <Form.Group className="mb-3" controlId="listingImages">
                  <Form.Label htmlFor="file-upload-input" className="file-upload-zone mt-2">
                    <input 
                      id="file-upload-input" 
                      type="file" 
                      name="listingImages" 
                      accept="image/*"
                      multiple 
                      onChange={handleFileChange} 
                      required 
                    />
                    <div className="upload-icon"><FaPlus /></div> 
                    <p>{selectedFiles ? `${selectedFiles.length} file(s) selected` : "Click or drag to add images"}</p>
                    <span className="upload-info">Max 10 files, 5MB each (JPG, PNG)</span>
                  </Form.Label>
                  {selectedFiles && selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <small>Selected: {Array.from(selectedFiles).map(f => f.name).join(', ')}</small>
                    </div>
                  )}
                </Form.Group>

                {/* --- ADDED CLASSNAME --- */}
                <h4 className="mb-3 form-section-heading">Your Contact Details (Landlord) *</h4>
                 <Form.Group className="mb-3" controlId="landlordName">
                   <Form.Label>Your Name *</Form.Label>
                   <Form.Control type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} required />
                 </Form.Group>
                 <Form.Group className="mb-3" controlId="landlordContact">
                   <Form.Label>Your Contact (Phone or Email) *</Form.Label>
                   <Form.Control type="text" name="landlordContact" value={formData.landlordContact} onChange={handleChange} required />
                 </Form.Group>
                 <Form.Group className="mb-3" controlId="landlordWhatsapp">
                   <Form.Label>WhatsApp Number (Optional, e.g., +254...)</Form.Label>
                   <Form.Control type="text" name="landlordWhatsapp" value={formData.landlordWhatsapp} onChange={handleChange} placeholder="+254712345678" />
                 </Form.Group>

                {/* --- ADDED CLASSNAME --- */}
                <h4 className="mb-3 form-section-heading">Features & Amenities</h4>
                <Row className="features-grid">
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="furnishing">
                      <Form.Label>Furnishing</Form.Label>
                      <Form.Select name="furnishing" value={formData.features.furnishing} onChange={handleFeatureChange}>
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Furnished">Furnished</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                     <Form.Group className="mb-3" controlId="water">
                      <Form.Label>Water</Form.Label>
                      <Form.Select name="water" value={formData.features.water} onChange={handleFeatureChange}>
                        <option value="Reliable">Reliable</option>
                        <option value="24/7">24/7</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="wifi">
                      <Form.Label>Wi-Fi</Form.Label>
                      <Form.Select name="wifi" value={formData.features.wifi} onChange={handleFeatureChange}>
                        <option value="Not Included">Not Included</option>
                        <option value="Available">Available (Payable)</option>
                        <option value="Included">Included</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="features-grid-checks mt-3">
                  <Col xs={6} sm={3}>
                    <Form.Check type="checkbox" label="Parking" name="parking" checked={formData.features.parking} onChange={handleFeatureChange} />
                  </Col>
                  <Col xs={6} sm={3}>
                    <Form.Check type="checkbox" label="Balcony" name="balcony" checked={formData.features.balcony} onChange={handleFeatureChange} />
                  </Col>
                  <Col xs={6} sm={3}>
                    <Form.Check type="checkbox" label="Biometric Access" name="biometric" checked={formData.features.biometric} onChange={handleFeatureChange} />
                  </Col>
                  <Col xs={6} sm={3}>
                    <Form.Check type="checkbox" label="Hot Shower" name="hotShower" checked={formData.features.hotShower} onChange={handleFeatureChange} />
                  </Col>
                </Row>
                
                <div className="d-grid mt-4">
                  <Button variant="primary" type="submit" size="lg" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Listing'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateListing;