// src/components/RetrospectiveModal.js
import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import './RetrospectiveModal.css';
// 1. 아이콘 임포트
import { FaFeatherAlt } from 'react-icons/fa';

function RetrospectiveModal({ isOpen, onSubmit, repToReview }) {
  const [notes, setNotes] = useState('');

  // 모달이 열릴 때, 이전 rep의 노트를 불러올 수 있도록 처리 (선택사항)
  useEffect(() => {
    if (isOpen && repToReview && repToReview.notes) {
      setNotes(repToReview.notes);
    } else {
      setNotes(''); // 모달이 닫히거나 새 rep일 경우 초기화
    }
  }, [isOpen, repToReview]);

  const handleSubmit = () => {
    onSubmit(notes); // <-- 먼저 실행하여 모달부터 닫게 함
    setNotes('');   // <-- 모달이 닫힌 후에 실행되어 사용자는 못 느낌
  };
  
  // 모달의 X 버튼이나 외부 클릭으로 닫힐 때도 notes 없이 onSubmit 호출
  const handleClose = () => {
    onSubmit(notes || ''); // <-- 먼저 실행
    setNotes('');          // <-- 나중에 실행
  }

  if (!isOpen) return null;

  // 5. 버튼 텍스트 및 클래스 이름 변경
  const footerContent = (
    <button className="retro-submit-button" onClick={handleSubmit}>
      기록하기
    </button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rep을 완료했습니다!" // 2. 제목 변경
      footer={footerContent}
    >
      {/* 3. 새로운 본문 구조 */}
      <div className="retro-modal-body">
        <div className="notes-input-section">
          <FaFeatherAlt className="section-icon" />
          <div className="notes-input-content">
            {/* 4. 라벨 텍스트 변경 */}
            <label htmlFor="notes-input">회고 노트</label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              // 4. 플레이스홀더 텍스트 변경
              placeholder="다음 Rep을 위해 간단한 메모를 남겨보세요. (선택사항)"
              rows="4"
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default RetrospectiveModal;
