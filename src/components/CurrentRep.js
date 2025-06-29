import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import './CurrentRep.css';

function CurrentRep({ rep, remainingSeconds, isPaused, onTogglePause, onStart, onDelete, defaultMinutes = 15 }) {
  const [goal, setGoal] = useState('');
  const [minutes, setMinutes] = useState(defaultMinutes); // 마지막으로 성공한 렙의 타이머 길이를 기본값으로 사용
  const [showForm, setShowForm] = useState(false);
  const [charCount, setCharCount] = useState(0); // 글자수 카운트 상태 추가
  
  // useDrag 훈을 컴포넌트 최상위 레벨로 이동
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REP_CARD', // 드래그 아이템의 종류를 정의
    item: () => ({ rep }), // 드래그할 때 함께 전달할 데이터
    canDrag: !!rep, // rep이 있을 때만 드래그 가능
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [rep]); // rep이 변경될 때마다 훈 재실행

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const handleStartClick = () => {
    if (goal.trim()) {
      onStart(goal, minutes);
      setShowForm(false); // Rep 생성 후 폼 숨기기
    } else {
      alert('Rep 목표를 입력해주세요!');
    }
  };

  const handleSliderChange = (e) => {
    setMinutes(Number(e.target.value));
  };
  

  
  const sliderFillPercent = ((minutes - 1) / (30 - 1)) * 100;

  const renderCreationForm = () => (
    <div className="current-rep-area initial">
      <div className="initial-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="initial-form-label" htmlFor="goal-input">
            이번 Rep의 목표는 무엇인가요?
          </label>
          <span style={{ 
            fontSize: '12px', 
            color: charCount >= 30 ? '#ff3b30' : '#777',
            fontWeight: charCount >= 30 ? 'bold' : 'normal'
          }}>
            {charCount}/30
          </span>
        </div>
        <input
          id="goal-input"
          type="text"
          value={goal}
          onChange={(e) => {
            const newValue = e.target.value.slice(0, 30);
            setGoal(newValue);
            setCharCount(newValue.length);
          }}
          placeholder="Setting a goal (최대 30자)"
          className="initial-goal-input"
          autoFocus
          maxLength={30} // HTML 제한도 추가
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
      
      <div className="form-buttons">
        <button 
          className="start-rep-button" 
          onClick={handleStartClick} 
          disabled={!goal.trim()}
        >
          시작하기
        </button>
        <button 
          className="cancel-button" 
          onClick={() => setShowForm(false)}
        >
          취소
        </button>
      </div>
    </div>
  );

  const renderActiveState = () => {
    return (
      <div 
        className="current-rep-area active" 
        ref={drag} 
        style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      >
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
  };

  const renderPlusButton = () => (
    <div className="current-rep-area plus-button-container">
      <button className="plus-icon" onClick={() => setShowForm(true)}>+</button>
    </div>
  );

  return rep ? renderActiveState() : (showForm ? renderCreationForm() : renderPlusButton());
}

export default CurrentRep;
