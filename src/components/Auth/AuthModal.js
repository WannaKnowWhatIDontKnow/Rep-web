import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' 또는 'signup'
  
  if (!isOpen) return null;
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
          <button className="auth-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="auth-modal-body">
          {mode === 'login' ? (
            <Login onToggleMode={toggleMode} onClose={onClose} />
          ) : (
            <Signup onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
