import React from 'react';
import BaseModal from './BaseModal';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onConfirm, onCancel, title = '확인', children }) {
  const footerContent = (
    <>
      <button className="confirm-button" onClick={onConfirm}>확인</button>
      <button className="cancel-button" onClick={onCancel}>취소</button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={footerContent}
    >
      {children || <p style={{ textAlign: 'center', margin: 0 }}>정말 렙을 종료하시겠습니까?</p>}
    </BaseModal>
  );
};

export default ConfirmModal;
