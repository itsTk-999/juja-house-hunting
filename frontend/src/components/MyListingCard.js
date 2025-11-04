import React, { useState } from 'react';
import { Card, Button, Badge, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';

// This component takes the listing and the two handler functions as props
function MyListingCard({ listing, onStatusChange, onDelete }) {
  const [isAvailable, setIsAvailable] = useState(listing.isAvailable);
  const [loading, setLoading] = useState(false);

  // Handle the "Available" toggle switch
  const handleToggle = async (e) => {
    const newStatus = e.target.checked;
    setLoading(true);
    // Call the function passed down from MyListings.js
    await onStatusChange(listing._id, newStatus);
    setIsAvailable(newStatus);
    setLoading(false);
  };

  // Handle the delete button click
  const handleDeleteClick = () => {
    // Ask for confirmation before deleting
    if (window.confirm(`Are you sure you want to delete "${listing.title}"? This action cannot be undone.`)) {
      // Call the function passed down from MyListings.js
      onDelete(listing._id);
    }
  };

  return (
    <Card className="listing-card-admin h-100">
      <div className="card-img-wrapper">
        <Badge 
          bg={isAvailable ? "success" : "danger"} 
          className="status-badge"
        >
          {isAvailable ? "Available" : "Unavailable"}
        </Badge>
        <Card.Img 
          variant="top" 
          src={listing.images[0] || 'https://picsum.photos/seed/placeholder/300/200'}
        />
      </div>
      <Card.Body>
        <Card.Title>{listing.title}</Card.Title>
        <Card.Text>
          <strong>Price:</strong> KSH {listing.price.toLocaleString()}<br/>
          <strong>Location:</strong> {listing.location}<br/>
          <strong>Type:</strong> {listing.type}
        </Card.Text>
      </Card.Body>
      <Card.Footer className="card-admin-footer">
        <div className="card-admin-actions">
          <Button 
            as={Link} 
            to={`/my-listings/edit/${listing._id}`} 
            variant="primary" 
            size="sm"
            title="Edit Listing"
          >
            <FaEdit /> Edit
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleDeleteClick} 
            disabled={loading}
            title="Delete Listing"
          >
            <FaTrash />
          </Button>
        </div>
        <Form.Check 
          type="switch"
          id={`switch-${listing._id}`}
          label={isAvailable ? "Public" : "Private"}
          checked={isAvailable}
          onChange={handleToggle}
          disabled={loading}
          title={isAvailable ? "Mark as unavailable" : "Mark as available"}
        />
      </Card.Footer>
    </Card>
  );
}

export default MyListingCard;