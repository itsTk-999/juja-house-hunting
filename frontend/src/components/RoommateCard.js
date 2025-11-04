import React from 'react';
import { Card, Button, Image } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom'; 
import './RoommateCard.css'; 

function RoommateCard({ profile, score }) {
  if (!profile || !profile.user) {
    return null; 
  }
    
  const { user, budget, bio } = profile;
  
  return (
    <Card className="h-100 shadow-sm roommate-card">
      <Card.Body className="d-flex flex-column text-center">
        {user.profilePicture ? (
          <Image src={user.profilePicture} roundedCircle className="roommate-avatar" />
        ) : (
          <FaUserCircle size={80} className="text-muted roommate-avatar-placeholder" />
        )}
        
        <Card.Title className="mt-3 mb-1">{user.name || 'User'}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {user.occupation || 'N/A'} | {user.gender || 'N/A'}
        </Card.Subtitle>
        
        <div className="compatibility-score">
          <strong>{score}%</strong> Compatible
        </div>
        
        <div className="budget-range">
          Budget: <strong>KSH {budget.min} - {budget.max}</strong>
        </div>
        
        <Card.Text className="roommate-bio">
          {bio ? `"${bio.substring(0, 100)}..."` : "No bio provided."}
        </Card.Text>
        
        <div className="mt-auto">
          <Button as={Link} to={`/roommate/${profile._id}`} variant="primary" className="w-100 mb-2">
            View Profile
          </Button>
          <Button as={Link} to={`/messages/${user._id}`} variant="outline-success" className="w-100">
            Message
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

// --- THIS IS THE FIX ---
export default RoommateCard; // Changed from RoomMates to RoommateCard
// --- END FIX ---