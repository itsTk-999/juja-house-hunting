import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import { FaBuilding, FaUsers, FaKey, FaSearch, FaHandshake, FaMobileAlt } from 'react-icons/fa';
import './Home.css';

function Home() {
  const [stats, setStats] = useState({ propertyCount: 0, userCount: 0, landlordCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Could not fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) { console.error(err.message); }
    };
    
    fetchStats();
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
      <Container className="stats-section" data-aos="fade-up">
        <Row className="justify-content-center">
          <Col xs={4} className="stats-card">
            <FaBuilding className="stats-icon" />
            <CountUp
              className="stats-number"
              end={stats.propertyCount}
              duration={2}
            />
            <p className="stats-label">Properties Listed</p>
          </Col>
          <Col xs={4} className="stats-card">
            <FaUsers className="stats-icon" />
            <CountUp 
              className="stats-number"
              end={stats.userCount}
              duration={2}
            />
            <p className="stats-label">Active Users</p>
          </Col>
          <Col xs={4} className="stats-card">
            <FaKey className="stats-icon" />
            <CountUp 
              className="stats-number"
              end={stats.landlordCount}
              duration={2}
            />
            <p className="stats-label">Verified Landlords</p>
          </Col>
        </Row>
      </Container>

      {/* --- Key Features Section --- */}
      <div className="features-section" data-aos="fade-up">
        <Container>
          <h2 className="section-title text-center">Why Choose Us?</h2>
          <div className="features-grid">
            <Row className="justify-content-center g-4">
              <Col lg={4} md={6} className="d-flex" data-aos="fade-up" data-aos-delay="100">
                <div className="feature-item w-100">
                  <FaSearch className="feature-icon" />
                  <h3>Advanced Search</h3>
                  <p>Find exactly what you're looking for with our detailed search filters</p>
                </div>
              </Col>
              <Col lg={4} md={6} className="d-flex" data-aos="fade-up" data-aos-delay="200">
                <div className="feature-item w-100">
                  <FaHandshake className="feature-icon" />
                  <h3>Direct Contact</h3>
                  <p>Connect directly with landlords and property managers</p>
                </div>
              </Col>
              <Col lg={4} md={6} className="d-flex" data-aos="fade-up" data-aos-delay="300">
                <div className="feature-item w-100">
                  <FaMobileAlt className="feature-icon" />
                  <h3>Mobile First</h3>
                  <p>Access our platform seamlessly from any device</p>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      {/* --- Getting Started Section --- */}
      <div className="getting-started-section" data-aos="fade-up">
        <Container fluid>
          <div className="getting-started-wrapper">
            <div className="getting-started-content">
              <h2>Ready to Find Your New Home?</h2>
              <p>Follow these simple steps to get started:</p>
              <ol>
                <li>Create your free account</li>
                <li>Browse available properties</li>
                <li>Contact landlords directly</li>
                <li>Schedule viewings</li>
              </ol>
              <Button as={Link} to="/apartments" variant="success" size="lg">
                Browse Listings
              </Button>
            </div>
            <div className="juja-image-container" data-aos="fade-left">
              <img 
                src={process.env.PUBLIC_URL + "/images/juja-town.jpg"}
                alt="Beautiful Juja Town" 
                className="juja-image"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600?text=Juja+Town";
                }}
              />
              <div className="juja-image-overlay"></div>
              <div className="scroll-indicator d-md-none">
                <div className="scroll-dot active"></div>
                <div className="scroll-dot"></div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

export default Home;