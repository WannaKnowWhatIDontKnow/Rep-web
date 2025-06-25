import React from 'react';
import RepCard from './RepCard';
import './RepList.css';

function RepList({ reps }) {
  return (
    <div className="list-area">
      <h3 className="list-title">History</h3>
      <div className="rep-card-list">
        {reps.length === 0 ? (
          <p className="empty-list-message">No completed Reps yet.</p>
        ) : (
          reps.map(rep => <RepCard key={rep.id} rep={rep} />)
        )}
      </div>
    </div>
  );
}

export default RepList;
