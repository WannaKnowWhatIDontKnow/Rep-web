import React from 'react';
import './RepCard.css';

function RepCard({ rep, onClick }) { // onClick prop 추가

  // 프로그레스 바의 너비를 계산하는 로직
  const maxMinutes = 30; // 30분을 100% 기준으로 설정 (조정 가능)
  const repMinutes = rep.initialSeconds / 60;
  const progressWidth = Math.min((repMinutes / maxMinutes) * 100, 100);
  
  // 🔥 여기에 디버깅 코드 추가
  console.log('RepCard 렌더링:', { 
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
}

export default RepCard;
