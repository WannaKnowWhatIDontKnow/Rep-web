import React, { useState, useEffect } from 'react';
import './CurrentRep.css';

function CurrentRep({ rep, remainingSeconds, isPaused, onTogglePause, onStart, onDelete, defaultMinutes = 15 }) {
  const [goal, setGoal] = useState('');
  const [minutes, setMinutes] = useState(defaultMinutes); // 마지막으로 성공한 렙의 타이머 길이를 기본값으로 사용

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const handleStartClick = () => {
    if (goal.trim()) {
      onStart(goal, minutes);
    } else {
      alert('Rep 목표를 입력해주세요!');
    }
  };

  const handleSliderChange = (e) => {
    setMinutes(Number(e.target.value));
  };
  

  
  const sliderFillPercent = ((minutes - 1) / (30 - 1)) * 100;

  const renderInitialState = () => (
    <div className="current-rep-area initial">
      <div className="initial-form-group">
        <label className="initial-form-label" htmlFor="goal-input">
          이번 Rep의 목표는 무엇인가요?
        </label>
        <input
          id="goal-input"
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Setting a goal"
          className="initial-goal-input"
          autoFocus
        />
      </div>

      <div className="initial-form-group">
        <div className="time-setter-header">
            <label className="initial-form-label">시간 설정</label>
            <div className="time-slider-value">{minutes}<span>분</span></div>
        </div>
        <input
            type="range"
            min="1"
            max="30"
            value={minutes}
            onChange={handleSliderChange}
            className="time-slider"
            style={{'--fill-percent': `${sliderFillPercent}%`}}
        />
        <div className="time-slider-labels">
            <span>1분</span>
            <span>30분</span>
        </div>
      </div>
      
      <button 
        className="start-rep-button" 
        onClick={handleStartClick} 
        disabled={!goal.trim()}
      >
        시작하기
      </button>
    </div>
  );

  const renderActiveState = () => (
    <div className="current-rep-area active">
      <div className="rep-goal">
        <span>{rep.goal}</span>
      </div>
      <div className="rep-timer">
        {formatTime(remainingSeconds)}
      </div>
      <div className="rep-controls">
        <button onClick={onTogglePause}>{isPaused ? '▶' : 'II'}</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );

  return rep ? renderActiveState() : renderInitialState();
}

export default CurrentRep;
