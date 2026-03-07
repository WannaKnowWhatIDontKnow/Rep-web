import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './Statistics.css';
import { Rep } from '../../types/index';

interface StatisticsProps {
  setActiveTab: (tab: 'daily' | 'dashboard') => void;
}

interface ChartData {
  name: string;
  totalReps: number;
  totalTime: number;
}

interface Totals {
  totalReps: number;
  totalTime: string;
}

const Statistics: React.FC<StatisticsProps> = ({ setActiveTab }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [chartMetric, setChartMetric] = useState<'time' | 'reps'>('time');
  const [repData, setRepData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Returns the start of the current period (Monday / 1st of month / Jan 1st)
  const getStartDate = (): Date => {
    const now = new Date();
    if (timeRange === 'week') {
      const monday = new Date(now);
      const day = now.getDay();
      monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
      monday.setHours(0, 0, 0, 0);
      return monday;
    } else if (timeRange === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return new Date(now.getFullYear(), 0, 1);
    }
  };

  const formatDate = (date: Date): string => {
    if (timeRange === 'week') {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()];
    } else if (timeRange === 'month') {
      return `${date.getDate()}일`;
    } else {
      return `${date.getMonth() + 1}월`;
    }
  };

  useEffect(() => {
    async function fetchData(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const startDate = getStartDate();
        let data = [];
        if (isAuthenticated) {
          const { data: repData, error } = await supabase
            .from('reps')
            .select('*')
            .eq('user_id', user?.id || '')
            .gte('completed_at', startDate.toISOString())
            .order('completed_at', { ascending: true });
          if (error) throw new Error('데이터를 가져오는 중 오류가 발생했습니다.');
          data = repData;
        } else {
          const savedReps = localStorage.getItem('repList');
          if (savedReps) {
            const allReps = JSON.parse(savedReps);
            data = allReps.filter((rep: Rep) => {
              if (!rep.completed_at) return false;
              return new Date(rep.completed_at) >= startDate;
            });
          }
        }
        setRepData(processData(data));
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeRange, isAuthenticated, user]);

  const processData = (data: Rep[]): ChartData[] => {
    const groupedData: Record<string, ChartData> = {};
    const now = new Date();

    if (timeRange === 'week') {
      // Monday to Sunday of current week
      const monday = new Date(now);
      const day = now.getDay();
      monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
      monday.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const key = formatDate(date);
        groupedData[key] = { name: key, totalReps: 0, totalTime: 0 };
      }
    } else if (timeRange === 'month') {
      // 1st to last day of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const key = formatDate(date);
        groupedData[key] = { name: key, totalReps: 0, totalTime: 0 };
      }
    } else {
      // January to December of current year
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const key = formatDate(date);
        groupedData[key] = { name: key, totalReps: 0, totalTime: 0 };
      }
    }

    data.forEach((rep: Rep) => {
      if (!rep.completed_at) return;
      const key = formatDate(new Date(rep.completed_at));
      if (groupedData[key]) {
        groupedData[key].totalReps += 1;
        groupedData[key].totalTime += rep.initial_seconds || 0;
      }
    });

    return Object.values(groupedData);
  };

  const calculateTotals = (): Totals => {
    let totalReps = 0;
    let totalSeconds = 0;
    repData.forEach(d => {
      totalReps += d.totalReps;
      totalSeconds += d.totalTime;
    });
    return { totalReps, totalTime: String(Math.floor(totalSeconds / 60)) };
  };

  const totals = calculateTotals();

  // Transform data for chart display
  const displayData = repData.map(d => ({
    ...d,
    displayValue: chartMetric === 'time' ? Math.floor(d.totalTime / 60) : d.totalReps,
  }));

  const barSize = timeRange === 'month' ? 7 : 22;
  const xAxisInterval = timeRange === 'month' ? 4 : 0;

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <button className="back-to-daily" onClick={() => setActiveTab('daily')}>
          ← 돌아가기
        </button>
        <div className="time-range-selector">
          <button className={timeRange === 'week' ? 'active' : ''} onClick={() => setTimeRange('week')}>주간</button>
          <button className={timeRange === 'month' ? 'active' : ''} onClick={() => setTimeRange('month')}>월간</button>
          <button className={timeRange === 'year' ? 'active' : ''} onClick={() => setTimeRange('year')}>연간</button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="auth-required-message">
          <p>로그인하면 통계 데이터를 확인할 수 있습니다.</p>
          <button className="back-to-daily" onClick={() => setActiveTab('daily')}>돌아가기</button>
        </div>
      ) : loading ? (
        <div className="loading">불러오는 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="statistics-summary">
            <div className="summary-card">
              <p className="summary-label">총 렙</p>
              <p className="summary-value">{totals.totalReps}</p>
              <p className="summary-unit">reps</p>
            </div>
            <div className="summary-card">
              <p className="summary-label">총 시간</p>
              <p className="summary-value">{totals.totalTime}</p>
              <p className="summary-unit">min</p>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <p className="chart-label">{chartMetric === 'time' ? '시간 (분)' : '렙 횟수'}</p>
              <div className="metric-toggle">
                <button className={chartMetric === 'time' ? 'active' : ''} onClick={() => setChartMetric('time')}>분</button>
                <button className={chartMetric === 'reps' ? 'active' : ''} onClick={() => setChartMetric('reps')}>렙</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={displayData} barSize={barSize}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#868e96', fontSize: 12 }}
                  interval={xAxisInterval}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(110, 102, 255, 0.06)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [value, chartMetric === 'time' ? '분' : '렙']}
                />
                <Bar dataKey="displayValue" fill="#6E66FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
