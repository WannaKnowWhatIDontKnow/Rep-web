import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

function Login({ onToggleMode, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error || '로그인 중 오류가 발생했습니다.');
    } else {
      // 로그인 성공 시 모달 닫기
      if (onClose) onClose();
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2>로그인</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
          />
        </div>
        
        <div className="form-group">
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>계정이 없으신가요? <button onClick={onToggleMode} className="auth-link">회원가입</button></p>
      </div>
    </div>
  );
}

export default Login;
