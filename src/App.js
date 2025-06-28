import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import "react-datepicker/dist/react-datepicker.css"; // Datepicker CSS
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import CreateRepModal from './components/CreateRepModal';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection'; // Import CalendarSection
import Statistics from './components/Statistics/Statistics'; // 대시보드(주간/월간/연간) 컴포넌트 추가
import supabase from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';

// App component (the overall structure of our website) is defined here.
function App() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for the selected date
  const [currentRep, setCurrentRep] = useState(null);
  const [repList, setRepList] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isRetroModalOpen, setRetroModalOpen] = useState(false);
  const [repToReview, setRepToReview] = useState(null);
  const [repToEdit, setRepToEdit] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' 또는 'dashboard'
  
  const { user, isAuthenticated } = useAuth();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start as paused
  const [endTime, setEndTime] = useState(null); // State to store the target end time

  // 앱이 시작될 때 데이터를 가져옵니다 (로그인 상태에 따라 다른 소스에서 가져옴)
  const fetchReps = async () => {
    try {
      if (isAuthenticated && user) {
        console.log('데이터 가져오기 시도 - 사용자 ID:', user.id);
        
        // 로그인 상태: 데이터베이스에서 가져오기
        const { data, error } = await supabase
          .from('reps')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
          
        if (error) {
          console.error('데이터베이스에서 목표 가져오기 실패:', error);
          
          // 인증 오류인 경우 사용자에게 알림
          if (error.code === '403' || error.message.includes('JWT')) {
            console.log('인증 오류 발생, 세션 만료 가능성');
            
            try {
              // AuthContext의 refreshSession 함수를 호출하는 것이 좋지만, 여기서는 직접 구현
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshData && refreshData.session) {
                console.log('세션 새로고침 성공, 데이터 다시 가져오기 시도');
                
                // 세션 새로고침 성공, 다시 시도
                const { data: retryData, error: retryError } = await supabase
                  .from('reps')
                  .select('*')
                  .eq('user_id', refreshData.session.user.id)
                  .order('completed_at', { ascending: false });
                  
                if (!retryError && retryData) {
                  console.log('세션 새로고침 후 데이터 가져오기 성공:', retryData.length, '개 항목');
                  setRepList(retryData);
                  return;
                } else if (retryError) {
                  console.error('새로고침 후 데이터 가져오기 실패:', retryError);
                }
              }
            } catch (refreshException) {
              console.error('세션 새로고침 중 예외 발생:', refreshException);
            }
            
            // 자동 새로고침 실패 시 사용자에게 알림
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          } else if (error.code === 'PGRST301' || error.message.includes('policy')) {
            alert('RLS 정책 오류: ' + error.message);
          }
          return;
        }
        
        if (data) {
          console.log('가져온 데이터:', data.length, '개 항목');
          // 데이터가 0개인 경우 추가 로그
          if (data.length === 0) {
            console.log('데이터가 없습니다. RLS 정책이 올바른지 확인해주세요.');
          }
          setRepList(data);
        }
      } else if (!isAuthenticated) {
        // 비로그인 상태: 로컬스토리지에서 가져오기
        try {
          const savedReps = localStorage.getItem('repList');
          if (savedReps) {
            setRepList(JSON.parse(savedReps));
          }
        } catch (error) {
          console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
        }
      } else {
        console.log('사용자 정보가 없어 데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('데이터 가져오기 중 오류 발생:', error);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReps();
    } else if (!isAuthenticated) {
      // 비로그인 상태일 때 로컬스토리지에서 가져오기
      try {
        const savedReps = localStorage.getItem('repList');
        if (savedReps) {
          setRepList(JSON.parse(savedReps));
        }
      } catch (error) {
        console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
      }
    }
  }, [isAuthenticated, user]);
  
  // 비로그인 상태일 때만 로컬스토리지에 저장
  useEffect(() => {
    if (!isAuthenticated && repList.length > 0) {
      try {
        localStorage.setItem('repList', JSON.stringify(repList));
      } catch (error) {
        console.error('로컬스토리지에 저장 실패:', error);
      }
    }
  }, [repList, isAuthenticated]);

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  const handleOpenCreateModal = () => {
    // 렙 생성은 오늘 날짜에서만 가능
    if (!isToday(selectedDate)) {
      alert("렙 생성은 오늘 날짜에서만 가능합니다.");
      return;
    }
    setRepToEdit(null); 
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setIsPaused(true); // Pause timer when opening edit modal
    setRepToEdit(currentRep);
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setRepToEdit(null); // Clean up after modal closes
  };

  const handleCompleteRep = useCallback((completedRep) => {
    new Audio('/alert.mp3').play().catch(() => console.log('Failed to play alert sound'));
    setCurrentRep(null);
    setRepToReview(completedRep);
    setRetroModalOpen(true);
  }, []);

  // More robust timer logic
  useEffect(() => {
    if (!currentRep || isPaused) {
      return;
    }

    const timerId = setInterval(() => {
      const newRemaining = Math.round((endTime - Date.now()) / 1000);

      if (newRemaining <= 0) {
        setRemainingSeconds(0);
        handleCompleteRep(currentRep);
      } else {
        setRemainingSeconds(newRemaining);
      }
    }, 500); // Check more frequently for better accuracy

    return () => clearInterval(timerId);
  }, [isPaused, currentRep, endTime, handleCompleteRep]);

  const handleSaveRep = (goal, minutes, seconds) => {
    const newInitialSeconds = minutes * 60 + seconds;

    if (repToEdit) {
      const elapsedSeconds = currentRep.initialSeconds - remainingSeconds;
      const newRemainingSeconds = newInitialSeconds > elapsedSeconds ? newInitialSeconds - elapsedSeconds : 0;

      setCurrentRep({
        ...currentRep,
        goal: goal,
        initialSeconds: newInitialSeconds,
      });
      setRemainingSeconds(newRemainingSeconds);
      setEndTime(Date.now() + newRemainingSeconds * 1000);
      setIsPaused(false); // Resume after editing

    } else {
      const newRep = {
        id: Date.now(),
        goal: goal,
        initialSeconds: newInitialSeconds,
        status: 'pending',
      };
      setCurrentRep(newRep);
      setRemainingSeconds(newInitialSeconds);
      setEndTime(Date.now() + newInitialSeconds * 1000);
      setIsPaused(false);
    }

    handleCloseCreateModal();
  };

  const handleDeleteRep = () => {
    if (window.confirm('Are you sure you want to delete this Rep?')) {
      setCurrentRep(null);
    }
  };

  const handleTogglePause = () => {
    setIsPaused(prevIsPaused => {
      const nowPaused = !prevIsPaused;
      if (!nowPaused) {
        // Resuming
        setEndTime(Date.now() + remainingSeconds * 1000);
      }
      return nowPaused;
    });
  };

  const handleRetroSubmit = async (status, notes) => {
    if (!repToReview) {
      console.error('repToReview가 없습니다.');
      return;
    }
    
    const reviewedRep = {
      goal: repToReview.goal,
      initial_seconds: repToReview.initialSeconds,
      status: status,
      notes: notes,
      completed_at: new Date().toISOString(), // 렙 종료 시각 기록
    };
    
    if (isAuthenticated && user) {
      // 로그인 상태: 데이터베이스에 저장
      try {
        // 세션 확인 - 현재 세션이 유효한지 확인
        console.log('현재 세션 확인 중');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('세션 확인 실패:', sessionError || '세션 없음');
          
          // 세션이 없으면 새로고침 시도
          console.log('세션 새로고침 시도');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData || !refreshData.session) {
            console.error('세션 새로고침 실패:', refreshError || '세션 없음');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            return;
          }
          
          // 새로고침 성공 시 사용자 ID 업데이트
          reviewedRep.user_id = refreshData.session.user.id;
          console.log('세션 새로고침 성공:', refreshData.session.user.id);
        } else {
          // 현재 세션이 유효한 경우
          reviewedRep.user_id = session.user.id;
          console.log('현재 세션 유효:', session.user.id);
        }
        
        // 데이터 저장 시도
        console.log('데이터 저장 시도:', reviewedRep);
        
        // Supabase에 데이터 저장
        const { data: insertData, error } = await supabase
          .from('reps')
          .insert([reviewedRep])
          .select(); // 저장 후 데이터 반환 요청
          
        if (error) {
          console.error('데이터베이스 저장 실패:', error);
          
          // 오류 유형 확인
          if (error.code === 'PGRST301' || error.message.includes('policy')) {
            console.error('RLS 정책 오류:', error.message);
            alert('RLS 정책 오류: ' + error.message + '\n\nSupabase 대시보드에서 RLS 정책을 확인해주세요.');
          } else if (error.code === '403' || error.message.includes('JWT')) {
            console.error('인증 오류:', error.message);
            alert('인증 오류: ' + error.message + '\n\n다시 로그인해주세요.');
          } else {
            alert('제출 중 오류가 발생했습니다: ' + error.message);
          }
          return;
        }
        
        // 저장 성공 확인
        if (insertData && insertData.length > 0) {
          console.log('데이터 저장 성공!', insertData);
        } else {
          console.log('데이터 저장은 성공했지만 반환된 데이터가 없습니다.');
        }
        
        // 성공적으로 저장되면 목록 새로고침
        await fetchReps(); // 추출된 fetchReps 함수 호출
        
        // 오늘 날짜로 선택 변경 (데이터가 보이도록)
        setSelectedDate(new Date());
      } catch (err) {
        console.error('데이터 처리 중 오류 발생:', err);
        alert('제출 중 오류가 발생했습니다: ' + err.message);
      }
    } else {
      // 비로그인 상태: 로컬스토리지에 저장
      const localRep = {
        ...reviewedRep,
        id: Date.now(), // 로컬에서 사용할 임시 ID
        completedAt: reviewedRep.completed_at // 기존 코드와 호환성 유지
      };
      
      setRepList(prevList => [localRep, ...prevList]);
    }
    
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  // 선택된 날짜에 해당하는 렙만 필터링
  const filteredReps = repList.filter(rep => {
    // 데이터베이스와 로컬스토리지의 필드명 차이를 처리
    const completionDate = rep.completedAt || rep.completed_at;
    if (!completionDate) return false;
    
    const repDate = new Date(completionDate);
    return repDate.getFullYear() === selectedDate.getFullYear() &&
           repDate.getMonth() === selectedDate.getMonth() &&
           repDate.getDate() === selectedDate.getDate();
  });

  // 로그인/회원가입 모달 열기
  const handleOpenAuthModal = () => {
    setAuthModalOpen(true);
  };
  
  // 로그인/회원가입 모달 닫기
  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    // Container for the entire app
    <div className="app-container">
      {/* 헤더 영역에 로그인/회원가입 버튼 추가 */}
      <div className="app-header">
        <h1>Rep</h1>
        <div className="auth-section">
          {isAuthenticated ? (
            <UserProfile />
          ) : (
            <button onClick={handleOpenAuthModal} className="auth-button">로그인 / 회원가입</button>
          )}
        </div>
      </div>
      
      {/* 탭에 따라 다른 콘텐츠 표시 */}
      {activeTab === 'daily' ? (
        <div className="main-content">
        <div className="left-panel">
          {/* Calendar area */}
          <CalendarSection 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
          />
          {/* List area (core feature implementation target) */}
          <RepList reps={filteredReps} />
        </div>
        <div className="right-panel">
          {/* Current Rep area (core feature implementation target) */}
          <CurrentRep
            rep={currentRep}
            remainingSeconds={remainingSeconds}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onStartNew={handleOpenCreateModal}
            onDelete={handleDeleteRep}
            onEdit={handleOpenEditModal}
          />
          {/* Dashboard area */}
          <Dashboard reps={filteredReps} setActiveTab={setActiveTab} />
        </div>
      </div>
      ) : (
        <Statistics setActiveTab={setActiveTab} />
      )}
      
      <CreateRepModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleSaveRep}
        repToEdit={repToEdit}
      />
      
      <RetrospectiveModal 
        isOpen={isRetroModalOpen}
        onClose={() => setRetroModalOpen(false)}
        onSubmit={handleRetroSubmit}
      />
      
      {/* 로그인/회원가입 모달 */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
