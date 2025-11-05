import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Alert, Spinner, Button, Dropdown } from 'react-bootstrap'; 
import { toast } from 'react-toastify';
import ApartmentCard from '../components/ApartmentCard';
import ComparisonModal from '../components/ComparisonModal'; 
import { authFetch } from '../utils/authFetch'; 
import './Apartments.css'; 

const initialFilterState = {
  location: "", priceRange: "", roomType: "", furnishing: "",
  water: "", wifi: "", parking: false, balcony: false,
  biometric: false, hotShower: false,
  showAvailableOnly: false, // Default to false (show all)
};

// Abstracted Filter Application Logic
const applyFilters = (apartmentsToFilter, currentFilters, setFilteredApartments) => {
    let tempApartments = [...apartmentsToFilter];
    
    if (currentFilters.showAvailableOnly) {
        // Show if vacancies field doesn't exist (old listing) OR if vacancies > 0
        tempApartments = tempApartments.filter(apt => apt.vacancies === undefined || apt.vacancies > 0);
    }
    
    if (currentFilters.location) tempApartments = tempApartments.filter(apt => apt.location === currentFilters.location);
    if (currentFilters.roomType) tempApartments = tempApartments.filter(apt => apt.type === currentFilters.roomType);
    if (currentFilters.furnishing) tempApartments = tempApartments.filter(apt => apt.features?.furnishing === currentFilters.furnishing);
    if (currentFilters.water) tempApartments = tempApartments.filter(apt => apt.features?.water === currentFilters.water);
    if (currentFilters.wifi) tempApartments = tempApartments.filter(apt => apt.features?.wifi === currentFilters.wifi);
    if (currentFilters.priceRange) { 
        const [min, max] = currentFilters.priceRange.split('-').map(Number); 
        tempApartments = tempApartments.filter(apt => apt.price >= min && apt.price <= max); 
    }
    if (currentFilters.parking) tempApartments = tempApartments.filter(apt => apt.features?.parking === true);
    if (currentFilters.balcony) tempApartments = tempApartments.filter(apt => apt.features?.balcony === true);
    if (currentFilters.biometric) tempApartments = tempApartments.filter(apt => apt.features?.biometric === true);
    if (currentFilters.hotShower) tempApartments = tempApartments.filter(apt => apt.features?.hotShower === true);
    
    setFilteredApartments(tempApartments);
};


// --- Accept 'user' and 'setShowLoginModal' props ---
function Apartments({ user, setShowLoginModal }) {
  const [allApartments, setAllApartments] = useState([]);
  const [filteredApartments, setFilteredApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(initialFilterState);
  const [comparisonList, setComparisonList] = useState([]); 
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(6); 
  const [likedProperties, setLikedProperties] = useState(new Set());
  const [activeFilterTab, setActiveFilterTab] = useState('basics');
  useEffect(() => {
    // Only load searches if logged in
    if (user) {
      const fetchSearches = async () => {
        try {
          const searchesResponse = await authFetch('/api/searches');
          if (searchesResponse.ok) {
            const searchesData = await searchesResponse.json();
            setSavedSearches(searchesData);
          }
        } catch (err) { console.error("Failed to fetch searches:", err); }
      };
      fetchSearches();
    }
  }, [user]); // Re-run if user logs in

  // Fetch apartments AND user preferences
  useEffect(() => {
    const fetchData = async () => { 
       try {
        setLoading(true); setError('');
        
        const apartmentResponse = await fetch('/api/apartments'); 
        if (!apartmentResponse.ok) {
          const errorData = await apartmentResponse.json();
          throw new Error(errorData.message || 'Failed to fetch apartments');
        }
        const apartmentData = await apartmentResponse.json();
        setAllApartments(apartmentData);
        // Apply initial filters
        applyFilters(apartmentData, initialFilterState, setFilteredApartments); 

        // Only fetch preferences if logged in
        if (user) {
          const prefsResponse = await authFetch('/api/preferences/my-preferences');
          if (prefsResponse.ok) {
            const likedData = await prefsResponse.json();
            setLikedProperties(new Set(likedData.map(prop => prop._id)));
          }
        }
      } catch (err) { 
          setError(err.message); 
          setAllApartments([]); 
          setFilteredApartments([]); 
      } 
      finally { setLoading(false); }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-fetch all data if user logs in/out

  // Apply Filters when filters state changes
  useEffect(() => {
      applyFilters(allApartments, filters, setFilteredApartments);
  }, [filters, allApartments]); 


  const handleFilterChange = (e) => { 
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : (type === 'switch' ? checked : value)
    }));
    setDisplayLimit(6); 
  };
  
  const handleLikeToggle = async (propertyId) => {
    if (!user) {
      setShowLoginModal(true); // Show login modal if not logged in
      return;
    }
    
    const newLikedProperties = new Set(likedProperties);
    if (newLikedProperties.has(propertyId)) {
      newLikedProperties.delete(propertyId);
    } else {
      newLikedProperties.add(propertyId);
    }
    setLikedProperties(newLikedProperties);

    try {
      const response = await authFetch(`/api/preferences/like/${propertyId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        // Rollback on error
        const errorSet = new Set(likedProperties);
        if (errorSet.has(propertyId)) { errorSet.delete(propertyId); }
        else { errorSet.add(propertyId); }
        setLikedProperties(errorSet);
        toast.error("Failed to update preference. Please try again.");
      }
    } catch (err) {
      console.error(err);
      const errorSet = new Set(likedProperties);
      if (errorSet.has(propertyId)) { errorSet.delete(propertyId); }
      else { errorSet.add(propertyId); }
      setLikedProperties(errorSet);
      toast.error("An error occurred. Please try again.");
    }
  };

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

  const clearFilters = () => {
    setFilters(initialFilterState);
  };

  const [searchName, setSearchName] = useState("");

  const saveCurrentSearch = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!searchName.trim()) {
      toast.error("Please enter a name for your search");
      return;
    }

    try {
      const newSearch = { 
        name: searchName, 
        filters: { ...filters },
        createdAt: new Date().toISOString()
      };

      const response = await authFetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSearch)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save search");
      }

      setSavedSearches(prevSearches => [...prevSearches, data]);
      setSearchName(""); // Clear the input
      setShowSaveSuccess(true);
      toast.success("Search saved successfully!");
      
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error("Save search error:", err);
      toast.error(err.message || "Failed to save search");
    }
  };

  const applySavedSearch = (searchFilters) => {
    setFilters(searchFilters);
  };

   const deleteSavedSearch = async (searchIdToDelete) => {
    try {
      const response = await authFetch(`/api/searches/${searchIdToDelete}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete search");
      }
      setSavedSearches(prevSearches => 
        prevSearches.filter(search => search._id !== searchIdToDelete)
      );
    } catch (err) {
      setError(err.message);
    }
  };
// --- 4. RE-ADD THE ADMIN DELETE FUNCTION ---
  const handleDeleteListing = async (propertyId) => {
    if (!window.confirm("Admin: Are you sure you want to permanently delete this listing? This action cannot be undone.")) {
      return;
    }
    
    setError(''); // Clear previous errors
    try {
      const response = await authFetch(`/api/apartments/${propertyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete listing');
      }
      
      // Success: Remove from state to update the UI instantly
      setAllApartments(prev => prev.filter(apt => apt._id !== propertyId));
      setFilteredApartments(prev => prev.filter(apt => apt._id !== propertyId));
      
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message); // Show the error in the alert
    }
  };
  // --- END RE-ADD ---

  return (
    <> 
      {/* --- Header --- */}
      <div className="apartments-header" data-aos="fade-in">
         <div className="apartments-header-content">
            <h1>Explore Apartments</h1>
            <p>Find the perfect rental in Juja that fits your needs and budget.</p>
         </div>
      </div>

      <Container fluid className="apartments-content-area mt-4"> 
        <Row>
          {/* --- Filters Column --- */}
          <Col md={3}>
            <div className="filter-card-custom" data-aos="fade-right">
              <div className="d-flex justify-content-between align-items-center mb-2"> 
                <h4>Filters</h4>
              </div>
              
              {/* Mobile Filter Tabs */}
              <div className="mobile-filter-tabs d-md-none">
                <button 
                  className={`filter-tab ${activeFilterTab === 'basics' ? 'active' : ''}`}
                  onClick={() => setActiveFilterTab('basics')}
                >
                  Basics
                </button>
                <button 
                  className={`filter-tab ${activeFilterTab === 'features' ? 'active' : ''}`}
                  onClick={() => setActiveFilterTab('features')}
                >
                  Features
                </button>
                <button 
                  className={`filter-tab ${activeFilterTab === 'amenities' ? 'active' : ''}`}
                  onClick={() => setActiveFilterTab('amenities')}
                >
                  Amenities
                </button>
              </div>
              
              <Form>
                <div className={`filter-section basics-section ${activeFilterTab === 'basics' ? 'd-block' : 'd-none d-md-block'}`}>
                  <h5 className="filter-subheading">Basics</h5>
                  <div className="basics-filters">
                    <div className="form-group">
                      <Form.Check 
                        type="switch"
                        id="availability-switch"
                        label="Show only available"
                        name="showAvailableOnly"
                        checked={filters.showAvailableOnly}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="form-group">
                      <Form.Label>Location</Form.Label>
                      <Form.Select name="location" value={filters.location} onChange={handleFilterChange}>
                        <option value="">All Locations</option>
                        <option value="Gate A">Gate A</option>
                        <option value="Gate B">Gate B</option>
                        <option value="Gate C">Gate C</option>
                        <option value="Gate D">Gate D</option>
                        <option value="Gate E">Gate E</option>
                      </Form.Select>
                    </div>
                    
                    <div className="form-group">
                      <Form.Label>Price Range (KSH)</Form.Label>
                      <Form.Select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
                        <option value="">All Prices</option>
                        <option value="3000-4000">3,000 - 4,000</option>
                        <option value="4000-6000">4,000 - 6,000</option>
                        <option value="6000-8000">6,000 - 8,000</option>
                        <option value="8000-12000">8,000 - 12,000</option>
                        <option value="12000-20000">12,000 - 20,000</option>
                        <option value="20000-999999">20,000+</option>
                      </Form.Select>
                    </div>
                    
                    <div className="form-group">
                      <Form.Label>Room Type</Form.Label>
                      <Form.Select name="roomType" value={filters.roomType} onChange={handleFilterChange}>
                        <option value="">All Types</option>
                        <option value="Single Room">Single Room</option>
                        <option value="Bedsitter">Bedsitter</option>
                        <option value="One Bedroom">One Bedroom</option>
                        <option value="Two Bedroom">Two Bedroom</option>
                        <option value="Three Bedroom">Three Bedroom</option>
                      </Form.Select>
                    </div>
                  </div>
                </div>

                <div className={`filter-section features-section ${activeFilterTab === 'features' ? 'd-block' : 'd-none d-md-block'}`}>
                  <h5 className="filter-subheading">Features</h5>
                  <div className="features-filters">
                    <div className="form-group">
                      <Form.Label>Furnishing</Form.Label>
                      <Form.Select
                        name="furnishing"
                        value={filters.furnishing}
                        onChange={handleFilterChange}
                      >
                        <option value="">Any</option>
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </Form.Select>
                    </div>
                  
                    <div className="form-group">
                      <Form.Label>Water</Form.Label>
                      <Form.Select
                        name="water"
                        value={filters.water}
                        onChange={handleFilterChange}
                      >
                        <option value="">Any</option>
                        <option value="24/7">24/7</option>
                        <option value="Reliable">Reliable</option>
                        <option value="Limited">Limited</option>
                      </Form.Select>
                    </div>
                  
                    <div className="form-group">
                      <Form.Label>WiFi</Form.Label>
                      <Form.Select
                        name="wifi"
                        value={filters.wifi}
                        onChange={handleFilterChange}
                      >
                        <option value="">Any</option>
                        <option value="Included">Included</option>
                        <option value="Available">Available (Payable)</option>
                        <option value="Not Included">Not Available</option>
                      </Form.Select>
                    </div>
                  </div>
                </div>

                <div className={`filter-section amenities-section ${activeFilterTab === 'amenities' ? 'd-block' : 'd-none d-md-block'}`}>
                  <h5 className="filter-subheading">Amenities</h5>
                  <div className="amenities-filters">
                    <Form.Group className="mb-2"><Form.Check type="checkbox" label="Parking" name="parking" checked={filters.parking} onChange={handleFilterChange} /></Form.Group>
                    <Form.Group className="mb-2"><Form.Check type="checkbox" label="Balcony" name="balcony" checked={filters.balcony} onChange={handleFilterChange} /></Form.Group>
                    <Form.Group className="mb-2"><Form.Check type="checkbox" label="Biometric Access" name="biometric" checked={filters.biometric} onChange={handleFilterChange} /></Form.Group>
                    <Form.Group className="mb-2"><Form.Check type="checkbox" label="Hot Shower" name="hotShower" checked={filters.hotShower} onChange={handleFilterChange} /></Form.Group>
                  </div>
                </div>

                {/* The Save Search Section and Filters Actions */}
                {user && (
                  <div className="save-search-section">
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Give your search a name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </Form.Group>

                    <div className="filter-actions">
                      <Button variant="outline-danger" className="clear-all-btn" onClick={clearFilters}>
                        Clear All
                      </Button>

                      <Button 
                        variant="success" 
                        className="save-filters-btn"
                        onClick={saveCurrentSearch}
                        disabled={!searchName.trim()}
                      >
                        Save Filters
                      </Button>

                      <Dropdown className="saved-searches-dropdown">
                        <Dropdown.Toggle variant="primary">
                          Saved Searches {savedSearches.length > 0 && `(${savedSearches.length})`}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          {savedSearches.length === 0 ? (
                            <Dropdown.Item disabled>No saved searches</Dropdown.Item>
                          ) : (
                            savedSearches.map((search) => (
                              <Dropdown.Item 
                                key={search._id} 
                                className="d-flex justify-content-between align-items-center"
                                onClick={() => applySavedSearch(search.filters)}
                              >
                                <span className="text-truncate me-2">{search.name}</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSavedSearch(search._id);
                                  }}
                                  style={{ minWidth: 'auto' }}
                                >
                                  ×
                                </Button>
                              </Dropdown.Item>
                            ))
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    {showSaveSuccess && (
                      <Alert variant="success" className="save-success-alert mt-3">
                        Search saved successfully!
                      </Alert>
                    )}

                    {savedSearches.length > 0 && (
                      <div className="saved-searches-list">
                        {savedSearches.map((search) => (
                          <div key={search._id} className="saved-search-item">
                            <span className="search-name">{search.name}</span>
                            <div className="actions">
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="apply-btn"
                                onClick={() => applySavedSearch(search.filters)}
                              >
                                Apply
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="delete-btn"
                                onClick={() => deleteSavedSearch(search._id)}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {savedSearches.length === 0 && (
                      <p className="text-center text-muted mb-0">
                        No saved searches yet. Save your current filters to access them later!
                      </p>
                    )}
                  </div>
                )}
                
                {/* Non-logged in users only see Clear All */}
                {!user && (
                  <div className="filter-actions">
                    <Button variant="outline-danger" className="clear-all-btn" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                )}
              </Form>

              {/* --- Removed duplicate save search section --- */}
            </div>
          </Col>

          {/* --- Listings Column --- */}
          <Col md={9} data-aos="fade-left" data-aos-delay="100">
            {comparisonList.length > 0 && (
              <Button 
                variant="info" className="mb-3 position-fixed bottom-0 end-0 m-3 shadow compare-button" 
                style={{ zIndex: 1050 }} onClick={() => setShowCompareModal(true)} >
                Compare ({comparisonList.length} / 3) 
              </Button>
            )}

            <h3 className="results-heading">Available Listings ({loading ? '...' : filteredApartments.length})</h3> 
            
            {loading && <div className="text-center py-5"> <Spinner animation="border"/> <p className="mt-2">Loading listings...</p> </div>}
            {error && <Alert variant="danger">Error: {error}</Alert>}
            
            <Row xs={2} md={2} lg={3} className="g-4">
              {!loading && !error && filteredApartments.length > 0 && (
                filteredApartments.slice(0, displayLimit).map(apt => (
                  <Col key={apt._id} data-aos="fade-up"> 
                    <ApartmentCard 
                      apartment={apt} 
                      onCompareToggle={handleCompareToggle}
                      isSelectedForCompare={comparisonList.some(item => item._id === apt._id)}
                      onLikeToggle={handleLikeToggle}
                      isLiked={likedProperties.has(apt._id)}
                      // --- Pass new prop based on user role ---
                      showLikeButton={!user || user.role !== 'landlord'}
                      
                    />
                  </Col>
                ))
              )}
              {!loading && !error && filteredApartments.length === 0 && (
                <Col xs={12}> 
                  <Alert variant="info" className="text-center"> 
                    No apartments match your current filters. Try adjusting your search or clearing all filters!
                  </Alert> 
                </Col>
              )}
            </Row>

            {/* --- "VIEW MORE" BUTTON --- */}
            {!loading && !error && filteredApartments.length > displayLimit && (
              <Row>
                <Col className="text-center mt-4">
                  <Button variant="outline-success" size="lg" onClick={() => setDisplayLimit(Infinity)}>
                    View All {filteredApartments.length} Listings
                  </Button>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Container>

      {/* --- COMPARISON MODAL --- */}
      <ComparisonModal 
        show={showCompareModal}
        onHide={() => setShowCompareModal(false)}
        apartments={comparisonList}
      />
    </>
  );
}

export default Apartments;