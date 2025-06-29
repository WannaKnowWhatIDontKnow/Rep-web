import React from 'react';
import './RepCard.css';

function RepCard({ rep, onClick }) {



  const formatInitialTime = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) {
      return '0min'; // 유효하지 않은 값일 경우 기본값 반환
    }
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}min`;
  };

  return (
    <div className="rep-card" onClick={onClick}>
      <span className="rep-card-goal">{rep.goal}</span>
      <span className="rep-card-time">{formatInitialTime(rep.initialSeconds)}</span>
    </div>
  );
}

export default RepCard;
