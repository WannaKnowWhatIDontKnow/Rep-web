// src/components/BaseModal.tsx
import React, { ReactNode } from 'react';
import './BaseModal.css';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title = '', children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// PropTypes는 TypeScript로 대체되었습니다.
// defaultProps 대신 함수 매개변수에 기본값을 지정했습니다.

export default BaseModal;
