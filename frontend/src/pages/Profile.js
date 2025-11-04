import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Image, Alert, Spinner } from 'react-bootstrap';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
import { authFetch } from '../utils/authFetch'; 
import './Profile.css'; // Make sure this CSS file exists

function Profile({ user, onUpdateUser }) {
  
  // --- 1. Form state with ALL fields ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '', 
    bio: '',
    whatsapp: '',
    gender: '',
    occupation: '',
  });
  
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 2. Pre-populate form with ALL fields ---
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '', 
        phone: user.phone || '',
        bio: user.bio || '',
        whatsapp: user.whatsapp || '',
        gender: user.gender || '',
        occupation: user.occupation || '',
      });
      setPreviewPic(user.profilePicture || null);
    }
  }, [user]); 

  // Handle changes to text fields
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle new file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
          setError("File is too large. Please upload an image under 5MB.");
          e.target.value = null; 
          setProfilePicFile(null); 
          setPreviewPic(user.profilePicture || null); 
      } else {
        setError(''); 
        setProfilePicFile(file); 
        setPreviewPic(URL.createObjectURL(file)); 
      }
    }
  };

  // --- 3. Handle the "Save Changes" button click ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // --- Build FormData with ALL fields ---
    const data = new FormData();
    if (profilePicFile) {
      data.append('profileImage', profilePicFile);
    }
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('bio', formData.bio);
    data.append('whatsapp', formData.whatsapp);
    data.append('gender', formData.gender);
    data.append('occupation', formData.occupation);
    // --- End FormData ---
    
    try {
      const response = await authFetch('/api/profile', {
        method: 'PUT',
        body: data, 
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile');
      }

      // --- Success ---
      setMessage(responseData.message || 'Profile updated successfully!');
      onUpdateUser(responseData.user); // This updates the global state
      setProfilePicFile(null); // Clear file from state

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <Row className="justify-content-center">
        <Col md={10} lg={8}> 
          <Card className="profile-card" data-aos="fade-up">
            <Card.Body className="p-4 p-md-5">
              
              <div className="profile-avatar-section">
                <div className="profile-pic-container">
                  {previewPic ? (
                    <Image 
                      src={previewPic} 
                      roundedCircle 
                      className="profile-pic-image"
                    />
                  ) : (
                    <FaUserCircle size={150} className="text-muted" />
                  )}
                  <Form.Label htmlFor="file-upload" className="profile-pic-edit">
                    <FaCamera />
                  </Form.Label>
                  <Form.Control 
                    id="file-upload" 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }} 
                  />
                </div>
                <h4 className="mt-3">{formData.name}</h4>
                <p className="text-muted">{formData.email}</p>
              </div>

              <div className="profile-form-section">
                <Card.Title as="h4" className="mb-4">Edit Your Profile</Card.Title>
                
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                       <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled 
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* --- 4. RE-ADD THE MISSING FIELDS --- */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="formPhone">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          placeholder="e.g., +254 712 345 678"
                          value={formData.phone}
                          onChange={handleFormChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="formWhatsapp">
                        <Form.Label>WhatsApp Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="whatsapp"
                          placeholder="e.g., +254712345678"
                          value={formData.whatsapp}
                          onChange={handleFormChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="formGender">
                        <Form.Label>Gender</Form.Label>
                        <Form.Select name="gender" value={formData.gender} onChange={handleFormChange}>
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                       <Form.Group className="mb-3" controlId="formOccupation">
                        <Form.Label>Occupation</Form.Label>
                        <Form.Select name="occupation" value={formData.occupation} onChange={handleFormChange}>
                          <option value="">Select...</option>
                          <option value="Student">Student</option>
                          <option value="Working">Working</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3" controlId="formBio">
                    <Form.Label>About Me</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="bio"
                      placeholder="Tell us a little about yourself..."
                      value={formData.bio}
                      onChange={handleFormChange}
                    />
                  </Form.Group>
                  {/* --- END RE-ADDED FIELDS --- */}
                  
                  <Button variant="success" type="submit" disabled={loading} className="w-100 mt-3" size="lg">
                    {loading ? <Spinner as="span" size="sm" /> : 'Save Changes'}
                  </Button>
                </Form>
              </div>

            </Card.Body> 
          </Card>
        </Col>
      </Row>
    </div> 
  );
}

export default Profile;