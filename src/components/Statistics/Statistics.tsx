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
  const [repData, setRepData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const getStartDate = (): Date => {
    const now = new Date();
    const startDate = new Date();
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    return startDate;
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
              const completionDate = rep.completed_at;
              if (!completionDate) return false;
              return new Date(completionDate) >= startDate;
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
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const key = formatDate(date);
        groupedData[key] = { name: key, totalReps: 0, totalTime: 0 };
      }
    } else if (timeRange === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const key = formatDate(date);
        groupedData[key] = { name: key, totalReps: 0, totalTime: 0 };
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
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
    repData.forEach(data => {
      totalReps += data.totalReps;
      totalSeconds += data.totalTime;
    });
    return { totalReps, totalTime: String(Math.floor(totalSeconds / 60)) };
  };

  const totals = calculateTotals();

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
            <p className="chart-label">렙 횟수</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repData} barSize={timeRange === 'month' ? 8 : 20}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#868e96', fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(110, 102, 255, 0.06)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [value, '렙']}
                />
                <Bar dataKey="totalReps" fill="#6E66FF" name="렙" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
