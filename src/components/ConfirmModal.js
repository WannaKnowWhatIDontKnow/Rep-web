import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h2>확인</h2>
        <p>정말 렙을 종료하시겠습니까?</p>
        <div className="confirm-modal-buttons">
          <button className="confirm-button" onClick={onConfirm}>확인</button>
          <button className="cancel-button" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
