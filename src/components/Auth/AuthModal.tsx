// src/components/Auth/AuthModal.tsx
import React, { useState } from 'react';
import BaseModal from '../BaseModal'; // 경로 주의
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login'); // 'login' 또는 'signup'

  const toggleMode = (): void => {
    setMode(prevMode => (prevMode === 'login' ? 'signup' : 'login'));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? '로그인' : '회원가입'}
    >
      {/* BaseModal의 children으로 Login 또는 Signup 컴포넌트를 전달 */}
      {mode === 'login' ? (
        <Login onToggleMode={toggleMode} onClose={onClose} />
      ) : (
        <Signup onToggleMode={toggleMode} />
      )}
    </BaseModal>
  );
}

export default AuthModal;
