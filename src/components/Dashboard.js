import React from 'react';
import './Dashboard.css';
import { TbRepeat } from 'react-icons/tb';
import { IoTimeOutline } from 'react-icons/io5';
import { RiPieChartLine } from 'react-icons/ri';

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

function Dashboard({ reps }) {
  const totalReps = reps.length;
  const achievedReps = reps.filter(rep => rep.status === 'Achieved').length;
  const failedReps = reps.filter(rep => rep.status === 'Failed').length;
  const changedCount = 0; // 'changed'는 0으로 고정합니다.
  const totalTime = reps.reduce((sum, rep) => sum + rep.initialSeconds, 0);

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

      {/* Ratio 섹션 */}
      <div className="dash-section">
        <div className="dash-section-header">
          <RiPieChartLine className="header-icon ratio-icon" />
          <h2>Ratio</h2>
        </div>
        <div className="ratio-wrapper">
          <div className="ratio-card success">
            <DigitalDisplay value={String(achievedReps).padStart(2, '0')} />
            <span>Success</span>
          </div>
          <div className="ratio-card fail">
            <DigitalDisplay value={String(failedReps).padStart(2, '0')} />
            <span>Fail</span>
          </div>
          <div className="ratio-card changed">
            <DigitalDisplay value={String(changedCount).padStart(2, '0')} />
            <span>Changed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;