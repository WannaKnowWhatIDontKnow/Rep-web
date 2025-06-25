import React from 'react';
import './CurrentRep.css';

function CurrentRep({ rep, remainingSeconds, isPaused, onTogglePause, onStartNew, onDelete, onEdit }) {

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const renderInitialState = () => (
    <div className="current-rep-area initial" onClick={onStartNew}>
      <div className="plus-icon">+</div>
    </div>
  );

  const renderActiveState = () => (
    <div className="current-rep-area active">
      <div className="rep-goal">
        <span>{rep.goal}</span>
      </div>
      <div className="rep-timer">
        {formatTime(remainingSeconds)}
      </div>
      <div className="rep-controls">
        <button onClick={onTogglePause}>{isPaused ? '▶' : 'II'}</button>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );

  return rep ? renderActiveState() : renderInitialState();
}

export default CurrentRep;
