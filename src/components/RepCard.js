import React from 'react';
import './RepCard.css';

function RepCard({ rep }) {

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Achieved': return 'achieved';
      case 'Failed': return 'failed';
      case 'Goal Changed': return 'changed';
      default: return 'pending';
    }
  };

  const formatInitialTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}min`;
  };

  return (
    <div className="rep-card">
      <div className={`status-indicator ${getStatusClassName(rep.status)}`}></div>
      <span className="rep-card-goal">{rep.goal}</span>
      <span className="rep-card-time">{formatInitialTime(rep.initialSeconds)}</span>
    </div>
  );
}

export default RepCard;
