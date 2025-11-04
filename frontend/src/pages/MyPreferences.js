import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import { authFetch } from '../utils/authFetch';
import ApartmentCard from '../components/ApartmentCard';
import ComparisonModal from '../components/ComparisonModal'; 
import './Apartments.css'; // Reuse styles

function MyPreferences() {
  const [likedListings, setLikedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonList, setComparisonList] = useState([]); 
  const [showCompareModal, setShowCompareModal] = useState(false);

  // --- Fetch liked listings on page load ---
  const fetchLikedListings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch('/api/preferences/my-preferences');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not fetch preferences');
      }
      const data = await response.json();
      setLikedListings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedListings();
  }, []);

  // --- Handler for unliking (removes from this page) ---
  const handleLikeToggle = async (propertyId) => {
    try {
      const response = await authFetch(`/api/preferences/like/${propertyId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update preference');
      }
      setLikedListings(prevListings =>
        prevListings.filter(listing => listing._id !== propertyId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Comparison Handler ---
  const handleCompareToggle = (apartment, isSelected) => {
    setComparisonList(prevList => {
      if (isSelected) {
        if (prevList.length < 3 && !prevList.find(item => item._id === apartment._id)) {
          return [...prevList, apartment];
        }
      } else {
        return prevList.filter(item => item._id !== apartment._id);
      }
      if (isSelected && prevList.length >= 3) {
        alert("You can only compare up to 3 apartments at a time.");
      }
      return prevList; 
    });
  };

  return (
    <>
      {/* --- Header --- */}
      <div className="apartments-header" data-aos="fade-in">
         <div className="apartments-header-content">
            <h1>My Preferences</h1>
            <p>Your saved properties. Click the heart again to remove.</p>
         </div>
      </div>

      <Container fluid className="apartments-content-area mt-4">
        {/* Messages */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* --- Floating Compare Button --- */}
        {comparisonList.length > 0 && (
          <Button 
            variant="info" 
            className="mb-3 position-fixed bottom-0 end-0 m-3 shadow compare-button" 
            style={{ zIndex: 1050 }} 
            onClick={() => setShowCompareModal(true)}
          >
            Compare ({comparisonList.length} / 3) 
          </Button>
        )}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p>Loading your saved properties...</p>
          </div>
        )}
        
        {!loading && likedListings.length === 0 && (
          <Alert variant="info" className="text-center" data-aos="fade-up">
            You haven't liked any properties yet. Click the heart icon on any listing to save it here!
          </Alert>
        )}

        {/* --- THIS IS THE CHANGE --- */}
        {/* Added xs={2} to the Row to force 2 columns */}
        <Row xs={2} md={2} lg={3} className="g-4" data-aos="fade-up" data-aos-delay="100">
          {likedListings.map(apt => (
            // Col no longer needs props
            <Col key={apt._id} className="mb-4"> 
              <ApartmentCard 
                apartment={apt} 
                onLikeToggle={handleLikeToggle}
                isLiked={true} 
                onCompareToggle={handleCompareToggle}
                isSelectedForCompare={comparisonList.some(item => item._id === apt._id)}
              />
            </Col>
          ))}
        </Row>
      </Container>

      {/* --- Comparison Modal --- */}
      <ComparisonModal 
        show={showCompareModal}
        onHide={() => setShowCompareModal(false)}
        apartments={comparisonList}
      />
    </>
  );
}

export default MyPreferences;