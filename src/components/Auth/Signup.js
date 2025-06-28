import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

function Signup({ onToggleMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // 입력값 검증
    if (!email || !password || !confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    // 회원가입 시도
    const result = await signUp(email, password);
    
    if (!result.success) {
      setError(result.error || '회원가입 중 오류가 발생했습니다.');
    } else {
      setSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2>회원가입</h2>
      
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">회원가입이 완료되었습니다! 이메일 확인 후 로그인해주세요.</div>}
      
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
            placeholder="비밀번호 (6자 이상)"
            required
          />
        </div>
        
        <div className="form-group">
          <label>비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 확인"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>이미 계정이 있으신가요? <button onClick={onToggleMode} className="auth-link">로그인</button></p>
      </div>
    </div>
  );
}

export default Signup;
