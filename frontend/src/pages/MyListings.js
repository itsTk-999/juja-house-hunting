import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import MyListingCard from '../components/MyListingCard'; 
import './MyListings.css'; 

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); 

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true); setError(''); setSuccess('');
        const response = await authFetch('/api/apartments/my-listings');
        
        if (!response.ok) { // Check response.ok
          const errorData = await response.json(); // Try to parse error
          throw new Error(errorData.message || 'Could not fetch listings');
        }
        
        const data = await response.json();
        setListings(data);
      } catch (err) { 
          setError(err.message); 
      } 
      finally { setLoading(false); }
    };
    fetchListings();
  }, []); 

  // --- Handler for toggling status (UPDATED) ---
  const handleStatusChange = async (id, newStatus) => {
    setSuccess(''); 
    setError(''); // Clear error on new action
    try {
      // --- CHANGED to use new PATCH route ---
      const response = await authFetch(`/api/apartments/${id}/status`, { // New URL
        method: 'PATCH', // New Method
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      // --- END CHANGE ---
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }
      
      setListings(prevListings => 
        prevListings.map(listing => 
          listing._id === id ? { ...listing, isAvailable: newStatus } : listing
        )
      );
      setSuccess(`Listing status updated to "${newStatus ? 'Available' : 'Unavailable'}"`);
    } catch (err) {
      setError(err.message);
      // Revert optimistic UI update if API call failed (optional but good)
      setListings(prevListings => 
        prevListings.map(listing => 
          listing._id === id ? { ...listing, isAvailable: !newStatus } : listing
        )
      );
    }
  };

  // --- Handler for deleting a listing ---
  const handleDeleteListing = async (id) => {
    setSuccess(''); 
    setError(''); // Clear error on new action
    try {
      const response = await authFetch(`/api/apartments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete listing');
      }
      
      setListings(prevListings => 
        prevListings.filter(listing => listing._id !== id)
      );
      setSuccess('Listing deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {/* --- Header --- */}
      <div className="my-listings-header" data-aos="fade-in">
        <div className="my-listings-header-content">
          <h1>My Listings Dashboard</h1>
          <p>Manage your properties, update availability, and create new listings.</p>
          <Button as={Link} to="/my-listings/new" variant="light">
            + Create New Listing
          </Button>
        </div>
      </div>

      <Container>
        {/* Messages */}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p>Loading your listings...</p>
          </div>
        )}
        
        {!loading && listings.length === 0 && (
          <Alert variant="info" className="text-center" data-aos="fade-up">
            You haven't created any listings yet. Click "Create New Listing" to get started!
          </Alert>
        )}

        <Row data-aos="fade-up" data-aos-delay="100">
          {listings.map(listing => (
            <Col md={6} lg={4} key={listing._id} className="mb-4">
              <MyListingCard 
                listing={listing} 
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteListing}
              />
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default MyListings;