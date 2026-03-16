import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface LoginProps {
  onToggleMode: () => void;
  onClose?: () => void;
}

function Login({ onToggleMode, onClose }: LoginProps): React.ReactElement {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error || 'An error occurred during sign in.');
    } else {
      // 로그인 성공 시 모달 닫기
      if (onClose) onClose();
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>Don't have an account? <button onClick={onToggleMode} className="auth-link">Sign up</button></p>
      </div>
    </div>
  );
}

export default Login;
