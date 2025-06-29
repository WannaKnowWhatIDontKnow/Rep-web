import React, { useState } from 'react';
import './RetrospectiveModal.css';

function RetrospectiveModal({ isOpen, onSubmit }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit(notes);
    setNotes('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => onSubmit('')}>
      <div className="modal-content retro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rep Complete!</h2>
          <button className="close-button" onClick={() => onSubmit('')}>X</button>
        </div>
        <div className="modal-body">

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
