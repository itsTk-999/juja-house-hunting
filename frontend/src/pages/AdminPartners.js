import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Image, ListGroup } from 'react-bootstrap';
import { authFetch } from '../utils/authFetch';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave } from 'react-icons/fa'; 
import './AdminPartners.css'; 

function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentEdit, setCurrentEdit] = useState(null); 

  // Form state (for creating new partner)
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState(''); // --- ADDED ---
  const [newEmail, setNewEmail] = useState(''); // --- ADDED ---
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({ 
    name: '', description: '', websiteLink: '', 
    whatsapp: '', email: '', // --- ADDED ---
    currentLogoUrl: '', newLogoFile: null 
  });


  // Fetch partners
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partners'); 
      if (!res.ok) throw new Error('Failed to fetch partners');
      const data = await res.json();
      setPartners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPartners();
  }, []);

  // Handle file input change for NEW partner
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewLogoFile(e.target.files[0]);
    }
  };

  // Handle NEW partner submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newDescription || !newLogoFile) {
      setError("Name, Description, and Logo are all required.");
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('description', newDescription);
    formData.append('websiteLink', newLink);
    formData.append('whatsapp', newWhatsapp); // --- ADDED ---
    formData.append('email', newEmail); // --- ADDED ---
    formData.append('logoImage', newLogoFile); 

    try {
      const res = await authFetch('/api/partners', {
        method: 'POST',
        body: formData, 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add partner');

      setSuccess('Partner added successfully!');
      setPartners([data, ...partners]); 
      // Clear form
      setNewName('');
      setNewDescription('');
      setNewLink('');
      setNewWhatsapp(''); // --- ADDED ---
      setNewEmail(''); // --- ADDED ---
      setNewLogoFile(null);
      e.target.reset(); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle EXISTING partner edit start
  const handleEditStart = (partner) => {
    setCurrentEdit(partner._id);
    setEditData({
      name: partner.name,
      description: partner.description,
      websiteLink: partner.websiteLink,
      whatsapp: partner.whatsapp || '', // --- ADDED ---
      email: partner.email || '', // --- ADDED ---
      currentLogoUrl: partner.logoUrl,
      newLogoFile: null,
    });
  };

  // Handle EXISTING partner edit change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Handle EXISTING partner file change
  const handleEditFileChange = (e) => {
    if (e.target.files[0]) {
      setEditData(prev => ({ ...prev, newLogoFile: e.target.files[0] }));
    }
  };

  // Handle EXISTING partner update submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('description', editData.description);
    formData.append('websiteLink', editData.websiteLink);
    formData.append('whatsapp', editData.whatsapp); // --- ADDED ---
    formData.append('email', editData.email); // --- ADDED ---
    formData.append('currentLogoUrl', editData.currentLogoUrl); 

    if (editData.newLogoFile) {
        formData.append('logoImage', editData.newLogoFile);
    }
    
    try {
      const res = await authFetch(`/api/partners/${currentEdit}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update partner');

      setSuccess(`Partner "${data.name}" updated successfully!`);
      setPartners(partners.map(p => (p._id === currentEdit ? data : p)));
      setCurrentEdit(null); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };


  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this partner?")) {
      try {
        setError('');
        setSuccess('');
        const res = await authFetch(`/api/partners/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete');
        
        setSuccess('Partner deleted.');
        setPartners(partners.filter(p => p._id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  // --- Component for the edit form ---
  const PartnerEditForm = () => (
    <Card className="mb-4 admin-partner-edit-form" data-aos="fade-in">
      <Card.Header as="h5">Editing: {editData.name}</Card.Header>
      <Card.Body>
        {error && currentEdit && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleUpdate}>
          <Row>
            <Col xs={12} className="text-center mb-3">
               <Image 
                  src={editData.newLogoFile ? URL.createObjectURL(editData.newLogoFile) : editData.currentLogoUrl} 
                  className="admin-partner-logo-preview" 
               />
            </Col>
            <Col xs={12}>
              <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" value={editData.name} onChange={handleEditChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={editData.description} onChange={handleEditChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Website Link</Form.Label>
                  <Form.Control type="text" name="websiteLink" value={editData.websiteLink} onChange={handleEditChange} />
              </Form.Group>
              {/* --- ADDED FIELDS --- */}
              <Form.Group className="mb-3">
                  <Form.Label>WhatsApp Number</Form.Label>
                  <Form.Control type="text" name="whatsapp" value={editData.whatsapp} onChange={handleEditChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={editData.email} onChange={handleEditChange} />
              </Form.Group>
              {/* --- END ADDED FIELDS --- */}
              <Form.Group className="mb-4">
                  <Form.Label>Change Logo (Optional)</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleEditFileChange} />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-between">
            <Button variant="success" type="submit" disabled={submitting}>
              {submitting ? <Spinner as="span" size="sm" /> : <><FaSave className="me-2" /> Save Changes</>}
            </Button>
            <Button variant="outline-secondary" onClick={() => setCurrentEdit(null)}>
              <FaTimes className="me-2" /> Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );


  return (
    <Container>
      <h1 className="mb-4">Manage Partners</h1>
      <Row className="g-5">
        {/* --- Left Column: Add New Partner --- */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Header as="h5">Add New Partner</Card.Header>
            <Card.Body>
              {error && !currentEdit && <Alert variant="danger">{error}</Alert>}
              {success && !currentEdit && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="partnerName">
                  <Form.Label>Partner Name</Form.Label>
                  <Form.Control type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="partnerDesc">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="partnerLink">
                  <Form.Label>Website URL (e.g., https://...)</Form.Label>
                  <Form.Control type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                </Form.Group>
                {/* --- ADDED FIELDS --- */}
                <Form.Group className="mb-3" controlId="partnerWhatsapp">
                  <Form.Label>WhatsApp Number</Form.Label>
                  <Form.Control type="text" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} placeholder="+2547..." />
                </Form.Group>
                <Form.Group className="mb-3" controlId="partnerEmail">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="contact@company.com" />
                </Form.Group>
                {/* --- END ADDED FIELDS --- */}
                <Form.Group className="mb-3" controlId="partnerLogo">
                  <Form.Label>Logo Image</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleFileChange} required />
                  {newLogoFile && <small className="text-muted d-block mt-1">{newLogoFile.name}</small>}
                </Form.Group>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? <Spinner as="span" size="sm" /> : <><FaPlus className="me-2"/> Add Partner</>}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        {/* --- Right Column: Existing Partners --- */}
        <Col md={7}>
          <h5 className="mb-3">Existing Partners ({partners.length})</h5>
          
          {currentEdit && <PartnerEditForm />}
          
          {loading ? <Spinner animation="border" /> : (
            <ListGroup className="admin-partner-list">
              {partners.length === 0 && (
                <ListGroup.Item>No partners added yet.</ListGroup.Item>
              )}
              {partners.map(p => (
                p._id !== currentEdit && (
                  <ListGroup.Item key={p._id} className="d-flex justify-content-between align-items-center">
                    <Image src={p.logoUrl} className="admin-partner-logo" alt={p.name} />
                    <div className="admin-partner-details">
                      <strong>{p.name}</strong>
                      <small>{p.description.substring(0, 50)}...</small>
                    </div>
                    <div className="admin-partner-actions">
                      <Button variant="outline-secondary" size="sm" onClick={() => handleEditStart(p)} className="me-2">
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p._id)}>
                        <FaTrash />
                      </Button>
                    </div>
                  </ListGroup.Item>
                )
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminPartners;