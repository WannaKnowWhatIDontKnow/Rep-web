import React from 'react';
import './RepCard.css';
import logger from '../utils/logger'; // logger 임포트
import { Rep } from '../types'; // 타입 임포트

interface RepCardProps {
  rep: Rep;
  onClick: () => void;
}

const RepCard: React.FC<RepCardProps> = React.memo(({ rep, onClick }) => { // React.memo로 감싸고 onClick prop 추가

  // 프로그레스 바의 너비를 계산하는 로직
  const maxMinutes = 30; // 30분을 100% 기준으로 설정 (조정 가능)
  const repMinutes = (rep.initialSeconds ?? rep.initial_seconds ?? 0) / 60;
  const progressWidth = Math.min((repMinutes / maxMinutes) * 100, 100);
  
  // 🔥 여기에 디버깅 코드 추가
  logger.info('RepCard 렌더링:', { 
    id: rep.id, 
    goal: rep.goal,
    initialSeconds: rep.initialSeconds,
    initial_seconds: rep.initial_seconds 
  });

  return (
    <div className="rep-card" onClick={onClick}> {/* 최상위 div에 onClick 이벤트 연결 */}
      <div className="rep-color-tag"></div> {/* 1. 컬러 태그 */}
      
      <div className="rep-card-content"> {/* 2. 기존 콘텐츠를 감싸는 div */}
        <span className="rep-card-goal">{rep.goal}</span>
      </div>

      <div className="rep-card-progress-bar-container"> {/* 3. 프로그레스 바 컨테이너 */}
        <div 
          className="rep-card-progress-bar" 
          style={{ width: `${progressWidth}%` }}
        ></div>
      </div>
    </div>
  );
});

// PropTypes는 TypeScript로 대체되어 삭제됨

export default RepCard;
