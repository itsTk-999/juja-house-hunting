import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Accordion, Spinner, Alert, Image } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import './Resources.css'; 

function Resources() {
  
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/partners');
        if (!res.ok) throw new Error("Failed to load resources");
        const data = await res.json();
        setPartners(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);


  return (
    <>
      {/* --- Page Header --- */}
      <div className="resources-header" data-aos="fade-in">
        <div className="resources-header-content">
          <h1>Mover's Hub</h1>
          <p>Your guide to a smooth and easy transition into your new home.</p>
        </div>
      </div>

      <Container>
        {/* --- Section 1: Partner Deals --- */}
        <section className="my-5" data-aos="fade-up">
          <h2 className="section-heading">Our Trusted Partners</h2>
          
          {loading && <div className="text-center"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row className="g-4">
            {!loading && !error && partners.map((partner) => (
              <Col md={6} lg={4} key={partner._id}>
                <Card className="partner-card h-100">
                  <Card.Body className="text-center d-flex flex-column">
                    <div className="partner-icon">
                      <Image src={partner.logoUrl} alt={partner.name} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <Card.Title className="mt-3">{partner.name}</Card.Title>
                    <Card.Text>{partner.description.substring(0, 100)}...</Card.Text>
                    {/* --- FIX: Link to new detail page --- */}
                    <Button 
                      variant="primary" 
                      as={Link}
                      to={`/resources/partner/${partner._id}`}
                      className="mt-auto"
                    >
                      View Details
                    </Button>
                    {/* --- END FIX --- */}
                  </Card.Body>
                </Card>
              </Col>
            ))}
            
            <Col md={6} lg={4}>
                 <Card className="partner-card h-100 bg-light-subtle">
                   <Card.Body className="text-center d-flex flex-column justify-content-center">
                     <Card.Title>Your Business Here?</Card.Title>
                     <Card.Text>Partner with us to reach new movers in Juja.</Card.Text>
                     <Button variant="primary" as={Link} to="/contact" className="mt-auto">Contact Us</Button>
                   </Card.Body>
                 </Card>
            </Col>
          </Row>
        </section>

        {/* --- Section 2: Moving Guides --- */}
        <section className="my-5" data-aos="fade-up">
          <h2 className="section-heading">Moving Guides & Tips</h2>
          <Accordion className="guide-accordion">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Step 1: How to Plan a Smooth Move</Accordion.Header>
              <Accordion.Body>
                Moving doesn't have to be stressful. Start by decluttering 4 weeks before your move. Create a "moving binder" with all your documents. Get quotes from at least three different moving companies.
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Step 2: Setting Up Utilities</Accordion.Header>
              <Accordion.Body>
                Contact these providers at least two weeks before your move-in date:
                <ul>
                  <li><strong>Internet:</strong> Choose your ISP (like Safaricom, Zuku, Faiba) and schedule an installation.</li>
                  <li><strong>Cooking Gas:</strong> Ensure you have a full cylinder or have one delivered.</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2">
              <Accordion.Header>Step 3: Budgeting for Your New Apartment</Accordion.Header>
              <Accordion.Body>
                Your rent is just one part of the cost. Don't forget to budget for:
                <ul>
                  <li>Deposit (usually 1-2 months' rent)</li>
                  <li>Utility deposits (for water/electricity)</li>
                  <li>Moving costs (truck rental, movers)</li>
                  <li>New furniture or essentials</li>
                  <li>First-week groceries</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              <Accordion.Header>Step 4: The Essential Move-In Checklist</Accordion.Header>
              <Accordion.Body>
                On day one, before you unpack, make sure to:
                <ol>
                  <li>Take photos of the empty apartment to document its condition.</li>
                  <li>Test all light switches and power outlets.</li>
                  <li>Check all taps and toilets for leaks.</li>
                  <li>Locate the main water valve and circuit breaker box.</li>
                  <li>Clean high-touch surfaces (doorknobs, counters) one more time.</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </section>

        {/* --- Section 3: Community Recommendations --- */}
        <section className="my-5" data-aos="fade-up">
          <h2 className="section-heading">What Other Movers Say</h2>
          <Row className="g-4">
            <Col md={6}>
              <Card className="testimonial-card">
                <Card.Body>
                  <blockquote className="testimonial-quote">
                    Using the checklist from this page saved me! I totally forgot about scheduling my internet, and this reminded me a week before I moved.
                  </blockquote>
                  <footer className="testimonial-user">
                    <FaUserCircle size={40} className="avatar-placeholder" />
                    <span className="testimonial-user-name">Sarah K., Student</span>
                  </footer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="testimonial-card">
                <Card.Body>
                  <blockquote className="testimonial-quote">
                    I found my apartment and my moving company all through this site. It made moving to Juja for my new job so much less stressful.
                  </blockquote>
                  <footer className="testimonial-user">
                    <FaUserCircle size={40} className="avatar-placeholder" />
                    <span className="testimonial-user-name">James M., Professional</span>
                  </footer>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      </Container>
    </>
  );
}

export default Resources;