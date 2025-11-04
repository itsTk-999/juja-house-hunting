import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, Image } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { FaPlus, FaTrash } from 'react-icons/fa'; 
import './EditListing.css'; 

const initialFormState = {
    title: '', description: '', price: '', location: 'Gate A', type: 'Bedsitter',
    latitude: '', longitude: '', landlordName: '', landlordContact: '',
    landlordWhatsapp: '', isAvailable: true, 
    vacancies: 1, 
    features: {
      furnishing: 'Unfurnished', water: 'Reliable', wifi: 'Not Included', parking: false, balcony: false,
      biometric: false, hotShower: false,
    },
    images: [], 
};

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [currentImageUrls, setCurrentImageUrls] = useState([]); 
  const [selectedFiles, setSelectedFiles] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- (Fetch Data, Handlers, handleSubmit, handleDelete are unchanged) ---
  useEffect(() => {
    const fetchListingData = async () => {
      setLoading(true); setError('');
      try {
        const response = await authFetch(`/api/apartments/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch listing data');
        
        setFormData({
            title: data.title || '', description: data.description || '',
            price: data.price || '', location: data.location || '', type: data.type || '',
            latitude: data.latitude || '', longitude: data.longitude || '',
            landlordName: data.landlordName || '', landlordContact: data.landlordContact || '',
            landlordWhatsapp: data.landlordWhatsapp || '',
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            vacancies: data.vacancies || 1, 
            features: data.features || initialFormState.features,
            images: data.images || [], 
        });
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            setCurrentImageUrls(data.images); 
        } else {
             setCurrentImageUrls([]);
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchListingData();
  }, [id]);

  const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      if (name === 'isAvailable') {
         setFormData(prev => ({ ...prev, [name]: checked })); 
      } else {
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
      }
  };
  const handleFeatureChange = (e) => {
       const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            features: { ...prev.features, [name]: type === 'checkbox' ? checked : value }
        }));
  };
   const handleFileChange = (e) => {
       setSelectedFiles(e.target.files);
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!formData.title || !formData.description || !formData.price || !formData.location || !formData.type || !formData.landlordName || !formData.landlordContact) {
      setError('Please fill in all required text fields.');
      setLoading(false); return;
    }
    const data = new FormData();
    if (selectedFiles && selectedFiles.length > 0) {
        Array.from(selectedFiles).forEach(file => {
            data.append('listingImages', file); 
        });
    }
    for (const key in formData) {
      if (key === 'images') continue; 
      if (key === 'features') {
        data.append('features', JSON.stringify(formData.features));
      } else if (key === 'price' || key === 'latitude' || key === 'longitude' || key === 'vacancies') { 
         data.append(key, String(formData[key] || ''));
      }
      else if (key === 'isAvailable'){
          data.append(key, String(formData[key])); 
      }
      else {
        data.append(key, formData[key]);
      }
    }
    try {
      const response = await authFetch(`/api/apartments/${id}`, {
        method: 'PUT', body: data,
      });
      const responseData = await response.json(); 
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update listing');
      }
      setSuccess('Listing updated successfully! Redirecting...');
      setTimeout(() => { navigate('/my-listings'); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      setLoading(true); setError(''); setSuccess('');
      try {
        const response = await authFetch(`/api/apartments/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete listing');
        }
        setSuccess('Listing deleted. Redirecting...');
        setTimeout(() => {
          navigate('/my-listings');
        }, 2000);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  };
  // --- End Handlers ---


  if (loading && !formData.title) {
      return ( <Container className="text-center py-5"><Spinner animation="border" /><p>Loading...</p></Container> );
  }

  return (
    <>
      <div className="edit-listing-header" data-aos="fade-in">
        <h1>Edit Listing</h1>
        <p>Make changes to your property details and availability.</p>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="p-4 p-md-5 shadow-sm" data-aos="fade-up">
              <Card.Body>
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
                            <Form.Control type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3" controlId="longitude">
                            <Form.Label>Longitude *</Form.Label>
                            <Form.Control type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required />
                        </Form.Group>
                    </Col>
                  </Row>

                  {/* --- ADDED CLASSNAME --- */}
                  <h4 className="mb-3 form-section-heading">Listing Images</h4>
                  <Form.Group className="mb-3" controlId="listingImage">
                    <Form.Label>Current Images</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2 current-image-preview">
                      
                      {currentImageUrls.length > 0 && !selectedFiles ? (
                        currentImageUrls.map((url, index) => (
                          <Image 
                            key={index} src={url} alt={`Current listing ${index + 1}`} thumbnail 
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                          />
                        ))
                      ) : null}
                      
                      {selectedFiles && (
                        Array.from(selectedFiles).map((file, index) => (
                           <Image 
                             key={index} src={URL.createObjectURL(file)} alt={`New preview ${index + 1}`} thumbnail 
                             style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                           />
                        ))
                      )}
                      
                      {!currentImageUrls.length && !selectedFiles && (
                        <p className="text-muted small">No images available for this listing.</p>
                      )}
                    </div>
                    
                    <Form.Label htmlFor="file-upload-input" className="file-upload-zone mt-2">
                      <input 
                        id="file-upload-input" type="file" name="listingImages" 
                        accept="image/*" multiple onChange={handleFileChange}
                      />
                      <div className="upload-icon"><FaPlus /></div> 
                      <p>{selectedFiles ? `${selectedFiles.length} new file(s) selected` : "Click or drag to replace images"}</p>
                      <span className="upload-info">Max 10 files, 5MB each (JPG, PNG)</span>
                    </Form.Label>
                  </Form.Group>

                  {/* --- ADDED CLASSNAME --- */}
                  <h4 className="mb-3 form-section-heading">Your Contact Details (Landlord) *</h4>
                  <Form.Group className="mb-3" controlId="landlordName"><Form.Label>Your Name *</Form.Label><Form.Control type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} required /></Form.Group>
                  <Form.Group className="mb-3" controlId="landlordContact"><Form.Label>Your Contact (Phone or Email) *</Form.Label><Form.Control type="text" name="landlordContact" value={formData.landlordContact} onChange={handleChange} required /></Form.Group>
                  <Form.Group className="mb-3" controlId="landlordWhatsapp"><Form.Label>WhatsApp Number (Optional)</Form.Label><Form.Control type="text" name="landlordWhatsapp" value={formData.landlordWhatsapp} onChange={handleChange} placeholder="+254..." /></Form.Group>
                  
                  {/* --- ADDED CLASSNAME --- */}
                  <h4 className="mb-3 form-section-heading">Features & Amenities</h4>
                  <Row className="features-grid">
                    <Col md={4}><Form.Group className="mb-3" controlId="furnishing"><Form.Label>Furnishing</Form.Label><Form.Select name="furnishing" value={formData.features.furnishing} onChange={handleFeatureChange}><option value="Unfurnished">Unfurnished</option><option value="Furnished">Furnished</option></Form.Select></Form.Group></Col>
                    <Col md={4}><Form.Group className="mb-3" controlId="water"><Form.Label>Water</Form.Label><Form.Select name="water" value={formData.features.water} onChange={handleFeatureChange}><option value="Reliable">Reliable</option><option value="24/7">24/7</option></Form.Select></Form.Group></Col>
                    <Col md={4}><Form.Group className="mb-3" controlId="wifi"><Form.Label>Wi-Fi</Form.Label><Form.Select name="wifi" value={formData.features.wifi} onChange={handleFeatureChange}><option value="Not Included">Not Included</option><option value="Available">Available (Payable)</option><option value="Included">Included</option></Form.Select></Form.Group></Col>
                  </Row>
                  <Row className="features-grid-checks mt-3">
                     <Col xs={6} sm={3}><Form.Check type="checkbox" label="Parking" name="parking" checked={formData.features.parking} onChange={handleFeatureChange} /></Col>
                     <Col xs={6} sm={3}><Form.Check type="checkbox" label="Balcony" name="balcony" checked={formData.features.balcony} onChange={handleFeatureChange} /></Col>
                     <Col xs={6} sm={3}><Form.Check type="checkbox" label="Biometric" name="biometric" checked={formData.features.biometric} onChange={handleFeatureChange} /></Col>
                     <Col xs={6} sm={3}><Form.Check type="checkbox" label="Hot Shower" name="hotShower" checked={formData.features.hotShower} onChange={handleFeatureChange} /></Col>
                  </Row>
                  
                  <Form.Group className="my-4" controlId="isAvailable">
                    <Form.Check 
                        type="switch" 
                        label={formData.isAvailable ? "Listing is PUBLIC / AVAILABLE" : "Listing is PRIVATE / UNAVAILABLE"}
                        name="isAvailable" checked={formData.isAvailable} onChange={handleChange} 
                    />
                  </Form.Group>

                  <div className="d-grid mt-4">
                    <Button variant="primary" type="submit" size="lg" disabled={loading}>
                      {loading ? <Spinner as="span" animation="border" size="sm"/> : 'Update Listing'} 
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* --- DANGER ZONE --- */}
            <Card className="danger-zone" data-aos="fade-up" data-aos-delay="200">
              <Card.Header>Danger Zone</Card.Header>
              <Card.Body>
                <div className="danger-text">
                  <p>Delete this listing</p>
                  <span>Once deleted, this action cannot be undone.</span>
                </div>
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                  <FaTrash /> Delete Listing
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default EditListing;