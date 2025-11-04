import React from 'react';
import { Card, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap'; 
import { Link } from 'react-router-dom';
import { FaRegHeart, FaHeart, FaBalanceScale, FaTrash } from 'react-icons/fa'; 
import './ApartmentCard.css'; 

function ApartmentCard({ 
  apartment, 
  onCompareToggle, 
  isSelectedForCompare, 
  onLikeToggle, 
  isLiked, 
  showLikeButton = true,
  // --- 1. RE-ADD PROPS ---
  isAdmin = false,
  onDelete 
}) {

  const handleCompareClick = () => {
    onCompareToggle(apartment, !isSelectedForCompare); 
  };

  const renderTooltip = (props) => (
    <Tooltip id={`tooltip-${apartment._id}`} {...props}>
      {isSelectedForCompare ? "Remove from Compare" : "Add to Compare"}
    </Tooltip>
  );

  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    onLikeToggle(apartment._id); 
  };

  // --- 2. RE-ADD HANDLER ---
  const handleAdminDelete = (e) => {
    e.stopPropagation(); 
    onDelete(apartment._id);
  };

  return (
    <Card className="h-100 shadow-sm apartment-card">
      
      {/* --- 3. RE-ADD ADMIN BUTTON --- */}
      {isAdmin && (
        <Button 
          variant="danger" 
          className="admin-delete-button" 
          onClick={handleAdminDelete}
          title="Admin: Delete this listing"
        >
          <FaTrash size={16} />
        </Button>
      )}
      
      {/* Like Button */}
      {showLikeButton && (
        <Button variant="light" className="like-button" onClick={handleLikeClick}>
          {isLiked ? (
            <FaHeart color="red" size={20} /> 
          ) : (
            <FaRegHeart color="#333" size={20} /> 
          )}
        </Button>
      )}

      {/* Compare Button */}
      <OverlayTrigger
        placement="top"
        delay={{ show: 250, hide: 100 }}
        overlay={renderTooltip}
      >
        <Button 
          variant={isSelectedForCompare ? "success" : "light"} 
          className="compare-icon-button" 
          onClick={handleCompareClick}
          onMouseLeave={(e) => e.currentTarget.blur()} 
        >
          <FaBalanceScale size={20} />
        </Button>
      </OverlayTrigger>

      <Card.Img 
        variant="top" 
        src={apartment.images && apartment.images.length > 0 ? apartment.images[0] : 'https://picsum.photos/seed/placeholder/300/200'}
        style={{ height: '200px', objectFit: 'cover' }} 
      />

      <Card.Body className="d-flex flex-column"> 
        <div> 
            <Card.Title>{apartment.title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {apartment.location} | {apartment.type}
            </Card.Subtitle>
            
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Card.Text as="h5" className="text-success mb-0">
                KSH {apartment.price ? apartment.price.toLocaleString() : 'N/A'}/mo
              </Card.Text>
              {apartment.vacancies > 0 && (
                <Badge pill bg="info" text="dark">
                  {apartment.vacancies} {apartment.vacancies > 1 ? 'Vacancies' : 'Vacancy'}
                </Badge>
              )}
            </div>

            <Card.Text>
              {apartment.description ? apartment.description.substring(0, 100) + '...' : 'No description available.'}
            </Card.Text>
        </div>
        <Button 
          as={Link} 
          to={`/apartment/${apartment._id}`} 
          variant="primary"
          className="mt-auto"
        >
          View Details
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ApartmentCard;