import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
// Removed ApartmentCard import
import './Home.css'; 

// Removed Mapbox imports

// Removed MAPBOX_TOKEN constant

function Home() {
  
  const [stats, setStats] = useState({ propertyCount: 0, userCount: 0, landlordCount: 0 });
  // Removed states for listings and map pins

  useEffect(() => {
    // --- Fetch Stats ---
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Could not fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) { console.error(err.message); }
    };
    
    fetchStats();
    // Removed fetchNewListings() and fetchFeaturedListings()
  }, []);

  return (
    <>
      {/* --- Main Hero Section --- */}
      <div className="home-hero">
        <div className="video-overlay"></div>
        <video 
          className="home-hero-video"
          src="/videos/hero-video.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          Your browser does not support the video tag.
        </video>
        
        <Container className="home-hero-content" data-aos="fade-in">
          <h1 className="display-4">Find Your Perfect Home in Juja</h1>
          <p className="lead">
            Browse hundreds of listings for bedsitters, one-bedrooms, and more.
          </p>
          <Button as={Link} to="/apartments" variant="success" size="lg">
            Start Searching
          </Button>
        </Container>
      </div>

      

      {/* --- Stats Section --- */}
      <Container className="mt-5 stats-section" data-aos="fade-up">
        
        {/* --- Stats Row --- */}
        <Row className="text-center stats-row" data-aos="fade-up">
          <Col md={4} className="stat-item">
            <h4 className="stat-number">
              <CountUp end={stats.propertyCount} duration={2} />+
            </h4>
            <p className="stat-label">Properties Listed</p>
          </Col>
          <Col md={4} className="stat-item">
            <h4 className="stat-number">
              <CountUp end={stats.userCount} duration={2} />+
            </h4>
            <p className="stat-label">Users Registered</p>
          </Col>
          <Col md={4} className="stat-item">
            <h4 className="stat-number">
              <CountUp end={stats.landlordCount} duration={2} />+
            </h4>
            <p className="stat-label">Landlords</p>
          </Col>
        </Row>

        
      </Container>
    </>
  );
}

export default Home;