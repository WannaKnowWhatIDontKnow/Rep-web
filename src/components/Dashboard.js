import React from 'react';
import './Dashboard.css';
import { TbRepeat } from 'react-icons/tb';
import { IoTimeOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';

// 각 문자를 개별 박스에 렌더링하는 컴포넌트입니다.
const DigitalDisplay = ({ value, className }) => {
  const characters = String(value).split('');
  return (
    <div className={`digital-display-container ${className || ''}`}>
      {characters.map((char, index) => (
        <span key={index} className={`digit-box ${char === ':' ? 'colon' : ''}`}>
          {char}
        </span>
      ))}
    </div>
  );
};

// 초를 HH:MM:SS 형식으로 변환하는 함수입니다.
const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function Dashboard({ reps, setActiveTab }) {
  const totalReps = reps.length;
  
  // 시간 계산 시 NaN 처리 및 데이터 형식 불일치 해결
  const totalTime = reps.reduce((sum, rep) => {
    // initial_seconds 또는 initialSeconds 필드 사용, 둘 다 없거나 NaN이면 0 사용
    const seconds = rep.initial_seconds || rep.initialSeconds;
    // 숫자가 아니거나 NaN인 경우 0으로 처리
    return sum + (typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0);
  }, 0);
  
  console.log('대시보드 총 시간 계산:', totalTime, '초');
  
  const { isAuthenticated } = useAuth();

  return (
    <div className="dashboard-final">
      {/* Reps 섹션 */}
      <div className="dash-section">
        <div className="dash-section-header">
          <TbRepeat className="header-icon reps-icon" />
          <h2>Reps</h2>
        </div>
        <DigitalDisplay value={String(totalReps).padStart(2, '0')} className="reps-display" />
      </div>

      {/* Total time 섹션 */}
      <div className="dash-section">
        <div className="dash-section-header">
          <IoTimeOutline className="header-icon time-icon" />
          <h2>Total time</h2>
        </div>
        <div className="time-display-wrapper">
            <DigitalDisplay value={formatTime(totalTime)} className="time-display" />
        </div>
      </div>


      
      {/* 통계 대시보드로 이동하는 버튼 */}
      <div className="dash-section stats-navigation">
        {isAuthenticated ? (
          <button 
            className="stats-button" 
            onClick={() => setActiveTab('dashboard')}
          >
            주간/월간/연간 대시보드 보기
          </button>
        ) : (
          <div className="stats-disabled">
            <button className="stats-button disabled" disabled>
              주간/월간/연간 대시보드 보기
            </button>
            <p className="stats-message">회원가입 시 이용 가능한 기능입니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;