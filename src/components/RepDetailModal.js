// src/components/RepDetailModal.js
import React from 'react';
import BaseModal from './BaseModal';
import './RepDetailModal.css';
// 아이콘 임포트
import { FaRegStickyNote, FaRegClock, FaStopwatch } from 'react-icons/fa';

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
  
  const footerContent = (
    <button onClick={onClose} className="detail-close-button">닫기</button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={rep?.goal || 'Rep 정보'}
      footer={footerContent}
    >
      {/* 새로운 본문 구조 */}
      <div className="detail-modal-body">
        {/* 회고 노트 섹션 (주인공) */}
        <div className="notes-section">
          <FaRegStickyNote className="section-icon" />
          <div className="notes-content">
            <h3>회고 노트</h3>
            <p>{rep?.notes || '작성된 노트가 없습니다.'}</p>
          </div>
        </div>

        {/* 하단 정보 섹션 (조연) */}
        <div className="info-footer">
          <div className="info-item">
            <FaRegClock />
            <span>{formatCompletionTime(rep?.completed_at)}</span>
          </div>
          <div className="info-item">
            <FaStopwatch />
            <span>{formatDuration(rep?.initial_seconds)}</span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default RepDetailModal;
