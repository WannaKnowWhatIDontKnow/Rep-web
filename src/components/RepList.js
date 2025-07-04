import React from 'react';
import { motion } from 'framer-motion'; // Framer Motion 임포트 확인
import RepCard from './RepCard';
import './RepList.css';
import logger from '../utils/logger'; // logger 임포트

function RepList({ reps, onRepCardClick }) {
  // 리스트 영역 클래스 이름
  const listClassName = 'list-area';
  
  // 핵심 수정 부분: reps 길이에 따라 클래스 이름을 동적으로 결정
  const cardListClassName = `rep-card-list ${reps.length === 0 ? 'empty' : ''}`;
  
  // 🔥 여기에 디버깅 코드 추가
  logger.info(`[RepList 렌더링] reps 개수: ${reps.length}, className: "${cardListClassName}"`);

  return (
    // 리스트 영역
    <div className={listClassName}>
      {/* 이 motion.div가 자식들의 레이아웃 변경을 감지하고 애니메이션을 적용합니다. */}
      <motion.div layout className={cardListClassName}>
        {reps.map(rep => (
          // 각 카드에도 layout을 적용해줄야 부드럽게 움직입니다.
          <motion.div key={rep.id} layout>
            <RepCard rep={rep} onClick={() => onRepCardClick(rep)} />
          </motion.div>
        ))}
        {reps.length === 0 && (
          <p className="empty-list-message">완료된 Rep이 없습니다.</p>
        )}
      </motion.div>
    </div>
  );
}

export default RepList;
