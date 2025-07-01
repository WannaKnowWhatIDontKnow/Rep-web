// src/components/RetrospectiveModal.js
import React, { useState } from 'react';
import BaseModal from './BaseModal';
import './RetrospectiveModal.css';

function RetrospectiveModal({ isOpen, onSubmit }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit(notes);
    setNotes('');
  };

  if (!isOpen) return null;

  const footerContent = (
    <button className="submit-button" onClick={handleSubmit}>Submit</button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => onSubmit('')}
      title="Rep Complete!"
      footer={footerContent}
    >
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
    </BaseModal>
  );
}

export default RetrospectiveModal;
