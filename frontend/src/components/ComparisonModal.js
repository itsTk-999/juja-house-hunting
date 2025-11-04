import React from 'react';
import { Modal, Button, Table, Image } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; 
import './ComparisonModal.css'; // Import the custom CSS

function ComparisonModal({ show, onHide, apartments }) {
  if (!apartments || apartments.length === 0) {
    return null; 
  }

  // Helper to display boolean features nicely
  const renderFeature = (value) => {
    return value ? 
      <FaCheckCircle className="feature-icon-yes" /> : 
      <FaTimesCircle className="feature-icon-no" />;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Compare Apartments ({apartments.length} items)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table bordered hover responsive className="comparison-table">
          <thead>
            <tr>
              <th className="feature-header">Feature</th>
              
              {/* --- FIX: Only map selected apartments --- */}
              {apartments.map(apt => (
                <th key={apt._id} className="text-center apartment-header">
                  <Image 
                    src={apt.images[0] || 'https://picsum.photos/seed/placeholder/100/60'} 
                    thumbnail 
                  /><br/>
                  {apt.title}
                </th>
              ))}
              {/* --- REMOVED empty column logic --- */}
            </tr>
          </thead>
          <tbody>
            {/* --- All rows updated to remove empty column logic --- */}
            <tr className="price-row">
              <th>Price (KSH/mo)</th>
              {apartments.map(apt => <td key={apt._id}>{apt.price.toLocaleString()}</td>)}
            </tr>
            <tr>
              <th>Location</th>
              {apartments.map(apt => <td key={apt._id}>{apt.location}</td>)}
            </tr>
            <tr>
              <th>Type</th>
              {apartments.map(apt => <td key={apt._id}>{apt.type}</td>)}
            </tr>
            <tr className="description-row">
              <th>Description</th>
              {apartments.map(apt => <td key={apt._id}>{apt.description}</td>)}
            </tr>
            <tr>
              <th>Vacancies</th>
              {apartments.map(apt => <td key={apt._id}>{apt.vacancies}</td>)}
            </tr>
            
            {/* --- Features --- */}
            <tr>
              <th>Furnishing</th>
              {apartments.map(apt => <td key={apt._id}>{apt.features?.furnishing || 'N/A'}</td>)}
            </tr>
            <tr>
              <th>Water</th>
              {apartments.map(apt => <td key={apt._id}>{apt.features?.water || 'N/A'}</td>)}
            </tr>
            <tr>
              <th>Wi-Fi</th>
              {apartments.map(apt => <td key={apt._id}>{apt.features?.wifi || 'N/A'}</td>)}
            </tr>
            
            {/* --- Amenities (Booleans) --- */}
            <tr>
              <th>Parking</th>
              {apartments.map(apt => <td key={apt._id}>{renderFeature(apt.features?.parking)}</td>)}
            </tr>
            <tr>
              <th>Balcony</th>
              {apartments.map(apt => <td key={apt._id}>{renderFeature(apt.features?.balcony)}</td>)}
            </tr>
            <tr>
              <th>Biometric Access</th>
              {apartments.map(apt => <td key={apt._id}>{renderFeature(apt.features?.biometric)}</td>)}
            </tr>
            <tr>
              <th>Hot Shower</th>
              {apartments.map(apt => <td key={apt._id}>{renderFeature(apt.features?.hotShower)}</td>)}
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ComparisonModal;