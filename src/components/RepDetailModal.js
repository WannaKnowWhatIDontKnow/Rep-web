import React from 'react';
import './RepDetailModal.css';

function RepDetailModal({ isOpen, onClose, rep }) {
  // 모달이 열려있지 않거나 rep 데이터가 없으면 렌더링하지 않음
  if (!isOpen || !rep) {
    return null;
  }

  // 시간 포맷팅 함수
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  };

  // 총 진행 시간 계산 (밀리초 -> 분:초 형식)
  const calculateDuration = () => {
    if (!rep.startTime || !rep.endTime) return 'N/A';
    
    const durationMs = new Date(rep.endTime) - new Date(rep.startTime);
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}분 ${seconds}초`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content rep-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rep 상세 정보</h2>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <h3>목표</h3>
            <p className="detail-content goal-content">{rep.goal}</p>
          </div>
          
          {rep.notes && (
            <div className="detail-section">
              <h3>회고 노트</h3>
              <p className="detail-content">{rep.notes}</p>
            </div>
          )}
          
          <div className="detail-section time-details">
            <div className="time-item">
              <span className="time-label">시작 시간</span>
              <span className="time-value">{formatTime(rep.startTime)}</span>
            </div>
            
            <div className="time-item">
              <span className="time-label">종료 시간</span>
              <span className="time-value">{formatTime(rep.endTime)}</span>
            </div>
            
            <div className="time-item">
              <span className="time-label">총 진행 시간</span>
              <span className="time-value duration-value">{calculateDuration()}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default RepDetailModal;
