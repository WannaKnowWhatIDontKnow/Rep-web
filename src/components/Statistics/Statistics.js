import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../supabaseClient';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import './Statistics.css';

// 색상 팔레트 정의
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Statistics({ setActiveTab }) {
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [repData, setRepData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // 날짜 관련 함수들
  const getStartDate = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === 'week') {
      // 일주일 전
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      // 한 달 전
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'year') {
      // 일년 전
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return startDate;
  };

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    if (timeRange === 'week') {
      // 요일 표시
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()];
    } else if (timeRange === 'month') {
      // 일 표시
      return `${date.getDate()}일`;
    } else if (timeRange === 'year') {
      // 월 표시
      return `${date.getMonth() + 1}월`;
    }
  };

  // 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const startDate = getStartDate();
        let data = [];
        
        if (isAuthenticated) {
          // 로그인 상태: Supabase에서 데이터 가져오기
          const { data: repData, error } = await supabase
            .from('reps')
            .select('*')
            .eq('user_id', user.id)
            .gte('completed_at', startDate.toISOString())
            .order('completed_at', { ascending: true });
            
          if (error) {
            throw new Error('데이터를 가져오는 중 오류가 발생했습니다.');
          }
          
          data = repData;
        } else {
          // 비로그인 상태: localStorage에서 데이터 가져오기
          const savedReps = localStorage.getItem('repList');
          if (savedReps) {
            const allReps = JSON.parse(savedReps);
            data = allReps.filter(rep => {
              const completionDate = rep.completedAt || rep.completed_at;
              if (!completionDate) return false;
              const repDate = new Date(completionDate);
              return repDate >= startDate;
            });
          }
        }
        
        // 데이터 처리 및 그룹화
        const processedData = processData(data);
        setRepData(processedData);
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [timeRange, isAuthenticated, user]);

  // 데이터 처리 및 그룹화 함수
  const processData = (data) => {
    // 시간 범위에 따라 데이터 그룹화
    const groupedData = {};
    const now = new Date();
    
    // 빈 데이터 초기화 (모든 날짜/월에 대한 기본 데이터 생성)
    if (timeRange === 'week') {
      // 일주일 데이터 초기화
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const key = formatDate(date);
        groupedData[key] = { 
          name: key, 
          totalReps: 0, 
          totalTime: 0, 
          successRatio: 0,
          successCount: 0,
          failCount: 0
        };
      }
    } else if (timeRange === 'month') {
      // 한 달 데이터 초기화
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const key = formatDate(date);
        groupedData[key] = { 
          name: key, 
          totalReps: 0, 
          totalTime: 0, 
          successRatio: 0,
          successCount: 0,
          failCount: 0
        };
      }
    } else if (timeRange === 'year') {
      // 일년 데이터 초기화
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const key = formatDate(date);
        groupedData[key] = { 
          name: key, 
          totalReps: 0, 
          totalTime: 0, 
          successRatio: 0,
          successCount: 0,
          failCount: 0
        };
      }
    }
    
    // 실제 데이터로 채우기
    data.forEach(rep => {
      const completionDate = rep.completedAt || rep.completed_at;
      if (!completionDate) return;
      
      const repDate = new Date(completionDate);
      const key = formatDate(repDate);
      
      if (groupedData[key]) {
        groupedData[key].totalReps += 1;
        // 시간 계산 시 NaN 처리 및 데이터 형식 불일치 해결
        const seconds = rep.initial_seconds || rep.initialSeconds;
        groupedData[key].totalTime += (typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0);
        
        if (rep.status === 'success') {
          groupedData[key].successCount += 1;
        } else {
          groupedData[key].failCount += 1;
        }
      }
    });
    
    // 성공률 계산
    Object.keys(groupedData).forEach(key => {
      const total = groupedData[key].successCount + groupedData[key].failCount;
      if (total > 0) {
        groupedData[key].successRatio = Math.round((groupedData[key].successCount / total) * 100);
      }
    });
    
    // 객체를 배열로 변환
    return Object.values(groupedData);
  };

  // 시간 형식 변환 (초 -> 분:초)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 총계 계산
  const calculateTotals = () => {
    let totalReps = 0;
    let totalTime = 0;
    let totalSuccess = 0;
    let totalFail = 0;
    
    repData.forEach(data => {
      totalReps += data.totalReps;
      totalTime += data.totalTime;
      totalSuccess += data.successCount;
      totalFail += data.failCount;
    });
    
    const successRatio = totalSuccess + totalFail > 0 
      ? Math.round((totalSuccess / (totalSuccess + totalFail)) * 100) 
      : 0;
    
    return {
      totalReps,
      totalTime: formatTime(totalTime),
      successRatio
    };
  };

  const totals = calculateTotals();
  
  // 파이 차트 데이터
  const pieData = [
    { name: '성공', value: repData.reduce((sum, data) => sum + data.successCount, 0) },
    { name: '실패', value: repData.reduce((sum, data) => sum + data.failCount, 0) }
  ].filter(item => item.value > 0);

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h2>대시보드</h2>
        <div className="dashboard-actions">
          <button 
            className="back-to-daily" 
            onClick={() => setActiveTab('daily')}
          >
            오늘 대시보드로 돌아가기
          </button>
        </div>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            주간
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            월간
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''} 
            onClick={() => setTimeRange('year')}
          >
            연간
          </button>
        </div>
      </div>
      
      {!isAuthenticated ? (
        <div className="auth-required-message">
          <p>회원가입 시 주간/월간/연간 통계 데이터를 확인할 수 있습니다.</p>
          <button 
            className="auth-button" 
            onClick={() => {
              setActiveTab('daily');
              // 여기에 로그인 모달을 열 수 있는 함수를 추가할 수 있음
            }}
          >
            오늘 대시보드로 돌아가기
          </button>
        </div>
      ) : loading ? (
        <div className="loading">데이터를 불러오는 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="statistics-summary">
            <div className="summary-card">
              <h3>총 렙 횟수</h3>
              <p className="summary-value">{totals.totalReps}</p>
            </div>
            <div className="summary-card">
              <h3>총 시간</h3>
              <p className="summary-value">{totals.totalTime}</p>
            </div>
            <div className="summary-card">
              <h3>성공률</h3>
              <p className="summary-value">{totals.successRatio}%</p>
            </div>
          </div>
          
          <div className="statistics-charts">
            <div className="chart-container">
              <h3>렙 횟수</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={repData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalReps" fill="#8884d8" name="렙 횟수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>총 시간 (초)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={repData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalTime" 
                    stroke="#82ca9d" 
                    name="총 시간 (초)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>성공률 (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={repData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successRatio" 
                    stroke="#ff7300" 
                    name="성공률 (%)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>성공/실패 비율</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
