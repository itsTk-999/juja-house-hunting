import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, Alert, Spinner, Button } from 'react-bootstrap';
import RoommateCard from '../components/RoommateCard';
import { authFetch } from '../utils/authFetch'; 
import { Link } from 'react-router-dom';
import './RoommateFinder.css'; 

// --- Compatibility Calculation Function ---
const calculateCompatibility = (myProfile, otherProfile) => {
  if (!myProfile) return 0; // Can't calculate if logged-in user has no profile

  let score = 0;
  
  // 1. Budget Match (40 points)
  if (myProfile.budget && otherProfile.budget) {
    const budgetOverlap = 
      myProfile.budget.max >= otherProfile.budget.min &&
      myProfile.budget.min <= otherProfile.budget.max;
    if (budgetOverlap) {
      score += 40;
    }
  }

  // 2. Location Match (20 points)
  if (myProfile.preferredLocation && otherProfile.preferredLocation) {
    const locationMatch = myProfile.preferredLocation.some(loc => 
      otherProfile.preferredLocation.includes(loc)
    );
    if (locationMatch) {
      score += 20;
    }
  }

  // 3. Lifestyle Match (40 points total, 10 each)
  if (myProfile.cleanliness === otherProfile.cleanliness) score += 10;
  if (myProfile.smoking === otherProfile.smoking) score += 10;
  if (myProfile.pets === otherProfile.pets) score += 10;
  if (myProfile.guests === otherProfile.guests) score += 10;

  return score;
};
// --- END NEW FUNCTION ---


function RoommateFinder({ user, setShowLoginModal }) {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  
  const [myUserId, setMyUserId] = useState(null);
  const [myRoommateProfile, setMyRoommateProfile] = useState(null); // <-- This is the prop we need

  const [filters, setFilters] = useState({
    location: '', gender: '', occupation: '', minBudget: '', maxBudget: ''
  });

  // Fetch all profiles AND logged-in user's profile
  useEffect(() => {
    if (user) {
      setMyUserId(user.id || user._id); 

      const fetchAllData = async () => {
        try {
          // setLoading(true); // Already true
          const token = localStorage.getItem('token');
          if (token) {
            // --- THIS IS THE FIX ---
            // Fetch *your* roommate profile and store it
            const myProfileResponse = await authFetch('/api/roommate/me');
            if (myProfileResponse.ok) {
              const myData = await myProfileResponse.json();
              setMyRoommateProfile(myData); // <-- Store your profile
            }
            // --- END FIX ---
          }
          
          const allProfilesResponse = await fetch('/api/roommate/all');
          if (!allProfilesResponse.ok) throw new Error('Failed to fetch profiles');
          const allData = await allProfilesResponse.json();
          setProfiles(allData);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    } else {
      // No user, stop loading and show modal
      setLoading(false);
      setShowLoginModal(true);
    }
  }, [user, setShowLoginModal]); 

  // Handle filter input changes (unchanged)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  useEffect(() => {
    let tempProfiles = [...profiles];
    if (myUserId) {
      tempProfiles = tempProfiles.filter(p => p.user && p.user._id !== myUserId);
    }
    if (filters.location) {
      tempProfiles = tempProfiles.filter(p => p.preferredLocation && p.preferredLocation.includes(filters.location));
    }
    if (filters.gender) {
      tempProfiles = tempProfiles.filter(p => p.user && p.user.gender === filters.gender);
    }
    if (filters.occupation) {
      tempProfiles = tempProfiles.filter(p => p.user && p.user.occupation === filters.occupation);
    }
    if (filters.minBudget) {
      tempProfiles = tempProfiles.filter(p => p.budget && p.budget.max >= filters.minBudget);
    }
    if (filters.maxBudget) {
      tempProfiles = tempProfiles.filter(p => p.budget && p.budget.min <= filters.maxBudget);
    }
    setFilteredProfiles(tempProfiles);
  }, [filters, profiles, myUserId]); 

  // --- Render block for non-logged-in users ---
  if (!user) {
    return (
        <Container className="text-center py-5">
            <Alert variant="warning" data-aos="fade-in">
                <Alert.Heading>Access Denied</Alert.Heading>
                <p>You must be logged in to view roommate profiles.</p>
                <p>Please log in or create an account to continue.</p>
                <hr />
                <Link to="/">
                  <Button variant="secondary">Back to Home</Button>
                </Link>
            </Alert>
        </Container>
    );
  }
  // --- End block ---

  return (
    <>
      <div className="apartments-header" data-aos="fade-in">
         <div className="apartments-header-content">
            <h1>Find a Roommate</h1>
            <p>Connect with people looking for a place in Juja.</p>
         </div>
      </div>
      
      <Container fluid className="apartments-content-area mt-4">
        <Row>
          {/* --- Filters Column --- */}
          <Col md={3}>
            <Card className="filter-card-custom" data-aos="fade-right">
              <h4>Filters</h4>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Select name="location" value={filters.location} onChange={handleFilterChange}>
                    <option value="">All Locations</option>
                    <option value="Gate A">Gate A</option>
                    <option value="Gate B">Gate B</option>
                    <option value="Gate C">Gate C</option>
                    <option value="Gate D">Gate D</option>
                    <option value="Gate E">Gate E</option>
                  </Form.Select>
                </Form.Group>
                
                <h5 className="filter-subheading">Budget (per person)</h5>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Min</Form.Label>
                      <Form.Control type="number" name="minBudget" value={filters.minBudget} onChange={handleFilterChange} placeholder="5000" />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Max</Form.Label>
                      <Form.Control type="number" name="maxBudget" value={filters.maxBudget} onChange={handleFilterChange} placeholder="10000" />
                    </Form.Group>
                  </Col>
                </Row>
                
                <h5 className="filter-subheading">Personal</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select name="gender" value={filters.gender} onChange={handleFilterChange}>
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Occupation</Form.Label>
                  <Form.Select name="occupation" value={filters.occupation} onChange={handleFilterChange}>
                    <option value="">Any</option>
                    <option value="Student">Student</option>
                    <option value="Working">Working</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card>
          </Col>

          {/* --- Profiles Column --- */}
          <Col md={9} data-aos="fade-left" data-aos-delay="100">
            <h3 className="results-heading">Found {filteredProfiles.length} potential roommate(s)</h3>
            
            {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Row xs={1} md={2} lg={3} className="g-4">
              {!loading && !error && filteredProfiles.length > 0 && (
                filteredProfiles.map(profile => (
                  <Col key={profile._id} data-aos="fade-up">
                    {/* --- THIS IS THE FIX --- */}
                    {/* Pass your profile to the calculation function */}
                    <RoommateCard 
                      profile={profile} 
                      score={calculateCompatibility(myRoommateProfile, profile)}
                    />
                  </Col>
                ))
              )}
              {!loading && !error && filteredProfiles.length === 0 && (
                <Col xs={12}><Alert variant="info">No profiles match your filters.</Alert></Col>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default RoommateFinder;