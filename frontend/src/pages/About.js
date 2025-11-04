import React from 'react';
import { Container, Row, Col} from 'react-bootstrap';
// --- 1. Import Icons ---
import { FaBullseye, FaHistory, FaHandsHelping, FaCheckCircle, FaSearchLocation } from 'react-icons/fa';
// --- 2. Import CSS ---
import './About.css'; 

function About() {
  return (
    <Container fluid="lg" className="about-page"> {/* Use fluid for full-width header potential */}

      {/* --- Header Section --- */}
      <div className="about-header" data-aos="fade-in">
        <div className="about-header-overlay"></div>
        <div className="about-header-content">
          <h1>About Juja Home</h1>
          <p>Connecting renters and landlords in Juja with ease and trust.</p>
        </div>
      </div>

      <Container> {/* Inner container for content padding */}
        {/* --- Mission & Story Section --- */}
        <Row className="mb-5">
          <Col md={6} data-aos="fade-right">
            <div className="about-section">
              <h3><FaBullseye className="me-2" /> Our Mission</h3>
              <p>
                To simplify the house hunting process in Juja by providing a comprehensive, reliable, and user-friendly platform. We aim to bridge the gap between property owners and potential tenants, fostering a transparent and efficient rental market.
              </p>
            </div>
          </Col>
          <Col md={6} data-aos="fade-left" data-aos-delay="100">
            <div className="about-section">
              <h3><FaHistory className="me-2" /> Our Story</h3>
              <p>
                Founded by individuals familiar with the challenges of finding accommodation in Juja, Juja Home started as a solution to a common problem. We saw the need for a centralized platform offering verified listings and clear information, making the search for a new home less stressful and more successful.
              </p>
            </div>
          </Col>
        </Row>

        {/* --- Our Values Section --- */}
        <div className="about-section mb-5" data-aos="fade-up">
          <h3 className="text-center">Our Values</h3>
          <Row>
            <Col md={4} className="value-item">
              <div className="value-icon"><FaHandsHelping /></div>
              <h5>Community</h5>
              <p>Building connections between tenants, landlords, and future roommates.</p>
            </Col>
            <Col md={4} className="value-item">
              <div className="value-icon"><FaCheckCircle /></div>
              <h5>Trust</h5>
              <p>Prioritizing verified listings and transparent communication.</p>
            </Col>
            <Col md={4} className="value-item">
              <div className="value-icon"><FaSearchLocation /></div>
              <h5>Ease of Use</h5>
              <p>Creating an intuitive platform that makes finding a home simple.</p>
            </Col>
          </Row>
        </div>
        
        {/* You can add more sections here like "Meet the Team" later */}
        
      </Container>
    </Container>
  );
}

export default About;