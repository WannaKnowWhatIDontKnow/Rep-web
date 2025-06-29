import React from 'react';
import './RepDetailModal.css';

// '종료 시간' 포맷팅 함수
const formatCompletionTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// '총 진행 시간' 포맷팅 함수
const formatDuration = (totalSeconds) => {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return 'N/A';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function RepDetailModal({ isOpen, onClose, rep }) {
  if (!isOpen || !rep) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rep 상세 정보</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="modal-body">
          <div className="detail-item">
            <label>목표</label>
            <span>{rep?.goal || '-'}</span>
          </div>
          <div className="detail-item">
            <label>회고 노트</label>
            <span>{rep?.notes || '-'}</span>
          </div>
          <div className="detail-item">
            <label>종료 시간</label>
            <span>{formatCompletionTime(rep?.completed_at)}</span>
          </div>
          <div className="detail-item">
            <label>총 진행 시간</label>
            <span>{formatDuration(rep?.initial_seconds)}</span>
          </div>
        </div>
        <div className="modal-footer">
            <button onClick={onClose} className="submit-button">닫기</button>
        </div>
      </div>
    </div>
  );
}

export default RepDetailModal;
