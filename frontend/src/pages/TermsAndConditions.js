import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
// Import the shared CSS file from the LoginModal
import '../components/LoginModal.css'; 

function TermsAndConditions() {

  // Scroll to top when the page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={8}>
          <Card className="auth-card shadow-lg" data-aos="fade-up">
            <Card.Header as="h2" className="text-center auth-card-header">
              Terms and Conditions
            </Card.Header>
            <Card.Body>
              <Link to="/" className="forgot-password-link text-muted mb-3 d-block" style={{textdecoration: 'none'}}>
                <FaArrowLeft className="me-2" style={{color:'blue'}}/> Back to Home
              </Link>
              
              <p className="text-muted"><strong>Last Updated:</strong> November 3, 2025</p>
              
              <p>Welcome to Juja Home, a platform dedicated to helping users find apartments and roommates in Juja, Kenya. These Terms and Conditions ("Terms") govern your access to and use of our website and services (collectively, the "Service").</p>
              
              <p>By accessing, browsing, or using our Service, you ("User," "you") agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not access or use our Service.</p>

              <hr />

              <h3 className="h5 mt-4">1. User Accounts</h3>
              <p><strong>Age Requirement:</strong> You must be at least 18 years old to create an account and use our Service.</p>
              <p><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate. You are responsible for all activities that occur under your account.</p>
              <p><strong>Account Security:</strong> You are responsible for safeguarding your password. You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account, whether or not you have authorized such activities. You must notify us immediately of any unauthorized use of your account.</p>
              <p><strong>Account Roles:</strong> We offer three types of accounts:
                <ul>
                  <li><strong>Tenant:</strong> A User seeking to find an apartment or roommate.</li>
                  <li><strong>Landlord:</strong> A User seeking to list properties.</li>
                  <li><strong>Admin:</strong> A User with administrative privileges, managed solely by us.</li>
                </ul>
              </p>

              <h3 className="h5 mt-4">2. Landlord Verification</h3>
              <p>Users who register as "Landlord" must be manually verified by our Admin team to gain full access to listing features. We reserve the right, in our sole discretion, to grant, deny, or revoke "Verified" status at any time, especially in cases of fraudulent listings or breach of these Terms.</p>

              <h3 className="h5 mt-4">3. User-Generated Content (UGC)</h3>
              <p>Our Service allows you to post content, including property listings, roommate profiles, and other information ("User-Generated Content" or "UGC").</p>
              <p><strong>Your Responsibility:</strong> You are solely responsible for your UGC. You warrant that all information you provide, especially in property listings and personal profiles, is accurate, current, and not misleading. <strong>Fraudulent or intentionally misleading listings will result in immediate account termination.</strong></p>
              <p><strong>License to Us:</strong> By posting UGC, you grant Juja Home a non-exclusive, worldwide, royalty-free, perpetual, and transferable license to use, display, reproduce, modify, and distribute your UGC in connection with operating and promoting the Service.</p>

              <h3 className="h5 mt-4">4. Acceptable Use Policy</h3>
              <p>You agree not to do any of the following:</p>
              <ul>
                  <li>Post any content that is false, fraudulent, misleading, defamatory, obscene, or illegal.</li>
                  <li>Use the Service to harass, stalk, or harm another individual.</li>
                  <li>Post any user's private information without their explicit consent.</li>
                  <li>Use the Service for any commercial purpose other than its intended use (i.e., no spam or unrelated advertising).</li>
                  <li>Scrape, "data-mine," or otherwise attempt to collect information about other users.</li>
              </ul>

              <h3 className="h5 mt-4">5. Specific Service Disclaimers</h3>
              <p><strong>A. Roommate Finder Service:</strong> Our roommate feature is a neutral platform. We are **not** a brokerage or a background check service. We **do not** conduct background checks or verify user identities. You are solely responsible for your interactions with other users. We strongly recommend you take all necessary precautions when communicating or meeting with potential roommates.</p>
              <p><strong>B. "Resources" & Third-Party Partners:</strong> Our "Resources" page contains links and advertisements for third-party services. These links are provided for your convenience only. We do not endorse, control, or take responsibility for the content, products, or services offered by these third parties.</p>

              <h3 className="h5 mt-4">6. Disclaimer of Warranties</h3>
              <p>The Service is provided on an **"AS IS"** and **"AS AVAILABLE"** basis. Juja Home disclaims all warranties, express or implied, in connection with the Service and your use thereof. We make no warranties or representations about the accuracy or completeness of the Service's content or UGC.</p>

              <h3 className="h5 mt-4">7. Limitation of Liability</h3>
              <p>In no event shall Juja Home, its directors, or employees be liable to you for any direct, indirect, incidental, special, or consequential damages whatsoever resulting from: (a) any errors or inaccuracies of content; (b) personal injury or property damage resulting from your use of our Service; (c) any unauthorized access to our servers; (d) any disputes between you and another user.</p>
              
              <h3 className="h5 mt-4">8. Termination</h3>
              <p>We may, in our sole discretion, suspend or terminate your account and access to the Service at any time, without notice, for any reason, including for breach of these Terms.</p>

              <h3 className="h5 mt-4">9. Changes to These Terms</h3>
              <p>We reserve the right to modify these Terms at any time. By continuing to use the Service after changes are posted, you agree to be bound by the revised Terms.</p>
              
              <h3 className="h5 mt-4">10. Governing Law</h3>
              <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya.</p>
              
              <h3 className="h5 mt-4">11. Contact Us</h3>
              <p>If you have any questions about these Terms, please contact us at **jujahousehunt@gmail.com**.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TermsAndConditions;