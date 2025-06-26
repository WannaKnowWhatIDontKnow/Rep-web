import React from 'react';
import './Dashboard.css';

function Dashboard({ reps }) {
  // 운동 기록(reps) 데이터를 바탕으로 통계를 계산하는 부분입니다.
  const totalReps = reps.length;
  const achievedReps = reps.filter(rep => rep.status === 'Achieved').length;
  const failedReps = reps.filter(rep => rep.status === 'Failed').length;
  
  // 0으로 나누는 실수를 방지하기 위한 코드입니다.
  const totalCompleted = achievedReps + failedReps;
  const successRate = totalCompleted > 0 ? Math.round((achievedReps / totalCompleted) * 100) : 0;

  // 계산된 통계를 화면에 보여주는 부분입니다.
  return (
    <div className="dashboard">
      <h2 className="dashboard-title">My Dashboard</h2>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-value">{totalReps}</span>
          <span className="stat-label">Total Reps</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{successRate}%</span>
          <span className="stat-label">Success Rate</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{achievedReps}</span>
          <span className="stat-label">Achieved</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;