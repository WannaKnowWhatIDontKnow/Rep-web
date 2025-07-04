import React from 'react';
import './Dashboard.css';
import { IoTimeOutline, IoRepeat, IoBarChartSharp, IoLockClosedOutline } from 'react-icons/io5'; // 아이콘 임포트
import { useAuth } from '../contexts/AuthContext';



// MM:SS 또는 HH:MM:SS 형식으로 유연하게 변환하는 함수
const formatTime = (totalSeconds, forceHours = false) => {
    if (isNaN(totalSeconds) || totalSeconds === 0) {
        return forceHours ? '00:00:00' : '00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0 || forceHours) {
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
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
  
  // 1. 새로운 지표 계산 (0으로 나누기 방지)
  const averageTimeInSeconds = totalReps > 0 ? totalTime / totalReps : 0;
  
  const { isAuthenticated } = useAuth();

  return (
    // 3. 새로운 JSX 구조
    <div className="new-dashboard">
      <div className="main-metric">
        <div className="metric-header">
          <IoTimeOutline />
          <span>총 학습 시간</span>
        </div>
        <div className="metric-value-large">{formatTime(totalTime, true)}</div>
      </div>

      <div className="sub-metrics">
        <div className="metric-card">
          <div className="metric-header">
            <IoRepeat />
            <span>Reps</span>
          </div>
          <div className="metric-value-small">{totalReps}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <IoBarChartSharp />
            <span>평균 시간</span>
          </div>
          <div className="metric-value-small">{formatTime(averageTimeInSeconds)}</div>
        </div>
      </div>

      <div className="dashboard-cta">
        {isAuthenticated ? (
          <button className="stats-button" onClick={() => setActiveTab('dashboard')}>
            주간/월간 통계 보기
          </button>
        ) : (
          <div className="stats-locked-wrapper">
            <button className="stats-button disabled" disabled>
              <IoLockClosedOutline />
              주간/월간 통계 보기
            </button>
            <p className="stats-message">회원가입 시 이용 가능한 기능입니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;