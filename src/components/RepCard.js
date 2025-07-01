import React from 'react';
import PropTypes from 'prop-types'; // PropTypes 임포트
import './RepCard.css';
import logger from '../utils/logger'; // logger 임포트

const RepCard = React.memo(({ rep, onClick }) => { // React.memo로 감싸고 onClick prop 추가

  // 프로그레스 바의 너비를 계산하는 로직
  const maxMinutes = 30; // 30분을 100% 기준으로 설정 (조정 가능)
  const repMinutes = rep.initialSeconds / 60;
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

// 컴포넌트 아래에 타입 정의 추가
RepCard.propTypes = {
  // 'rep' prop은 객체(object)여야 하며, 반드시 필요(isRequired)합니다.
  rep: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    goal: PropTypes.string.isRequired,
    // initialSeconds 또는 initial_seconds 둘 중 하나는 있어야 합니다.
    initialSeconds: PropTypes.number,
    initial_seconds: PropTypes.number,
  }).isRequired,
  // 'onClick' prop은 함수(func)여야 하며, 반드시 필요(isRequired)합니다.
  onClick: PropTypes.func.isRequired,
};

// 기본값 설정은 이런 방식으로 하면 오류가 발생할 수 있으므로 삭제합니다.

export default RepCard;
