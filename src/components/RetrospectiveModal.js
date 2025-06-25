import React, { useState } from 'react';
import './RetrospectiveModal.css';

function RetrospectiveModal({ isOpen, onClose, onSubmit }) {
  const [status, setStatus] = useState(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!status) {
      alert('Please select a status for the Rep!');
      return;
    }
    onSubmit(status, notes);
    setStatus(null);
    setNotes('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content retro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rep Complete!</h2>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>How was this Rep? (Required)</label>
            <div className="status-buttons">
              <button 
                className={`status-btn ${status === 'Achieved' ? 'selected' : ''}`}
                onClick={() => setStatus('Achieved')}
              >Achieved</button>
              <button 
                className={`status-btn ${status === 'Failed' ? 'selected' : ''}`}
                onClick={() => setStatus('Failed')}
              >Failed</button>
              <button 
                className={`status-btn ${status === 'Goal Changed' ? 'selected' : ''}`}
                onClick={() => setStatus('Goal Changed')}
              >Goal Changed</button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes-input">What's next? (Optional)</label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave a short note for your future self (optional)"
              rows="4"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="submit-button" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default RetrospectiveModal;
