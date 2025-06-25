import React, { useState, useEffect } from 'react';
import './CreateRepModal.css';

function CreateRepModal({ isOpen, onClose, onStart, repToEdit }) {
  const [goal, setGoal] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (repToEdit) {
        // 편집 모드: 기존 데이터로 상태 설정
        setGoal(repToEdit.goal);
        setMinutes(Math.floor(repToEdit.initialSeconds / 60));
        setSeconds(repToEdit.initialSeconds % 60);
      } else {
        // 생성 모드: 상태 초기화
        setGoal('');
        setMinutes(25);
        setSeconds(0);
      }
    }
  }, [isOpen, repToEdit]);

  const handleStartClick = () => {
    if (goal.trim()) {
      onStart(goal, minutes, seconds);
      setGoal('');
      setMinutes(25);
      setSeconds(0);
    } else {
      alert('Rep 목표를 입력해주세요!');
    }
  };

  if (!isOpen) {
    return null;
  }

  const renderTimeOptions = (limit) => {
    const options = [];
    for (let i = 0; i < limit; i++) {
      options.push(<option key={i} value={i}>{String(i).padStart(2, '0')}</option>);
    }
    return options;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{repToEdit ? 'Rep 편집하기' : '새로운 Rep 시작하기'}</h2>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="goal-input">이번 Rep의 목표는 무엇인가요?</label>
            <input
              id="goal-input"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="예: 기획서 초안 작성 완료"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>시간 설정</label>
            <div className="time-inputs">
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {renderTimeOptions(61)}
              </select>
              <span>분</span>
              <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
                {renderTimeOptions(60)}
              </select>
              <span>초</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="start-button" 
            onClick={handleStartClick} 
            disabled={!goal.trim()}
          >
            {repToEdit ? '변경사항 저장' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRepModal;
