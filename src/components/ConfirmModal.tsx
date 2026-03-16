import React, { ReactNode } from 'react';
import BaseModal from './BaseModal';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  children?: ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onConfirm, onCancel, title = 'Confirm', children }) => {
  const footerContent = (
    <>
      <button className="confirm-button" onClick={onConfirm}>Confirm</button>
      <button className="cancel-button" onClick={onCancel}>Cancel</button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={footerContent}
    >
      {children || <p style={{ textAlign: 'center', margin: 0 }}>Are you sure you want to end this Rep?</p>}
    </BaseModal>
  );
};

export default ConfirmModal;
