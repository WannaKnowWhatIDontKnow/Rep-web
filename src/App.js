import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import "react-datepicker/dist/react-datepicker.css"; // Datepicker CSS
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import CreateRepModal from './components/CreateRepModal';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection'; // Import CalendarSection
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
  
  const { user, isAuthenticated } = useAuth();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start as paused
  const [endTime, setEndTime] = useState(null); // State to store the target end time

  // 앱이 시작될 때 데이터를 가져옵니다 (로그인 상태에 따라 다른 소스에서 가져옴)
  useEffect(() => {
    async function fetchReps() {
      try {
        if (isAuthenticated) {
          // 로그인 상태: 데이터베이스에서 가져오기
          const { data, error } = await supabase
            .from('reps')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });
            
          if (error) {
            console.error('데이터베이스에서 목표 가져오기 실패:', error);
            return;
          }
          
          if (data) setRepList(data);
        } else {
          // 비로그인 상태: 로컬스토리지에서 가져오기
          try {
            const savedReps = localStorage.getItem('repList');
            if (savedReps) {
              setRepList(JSON.parse(savedReps));
            }
          } catch (error) {
            console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
          }
        }
      } catch (error) {
        console.error('데이터 가져오기 중 오류 발생:', error);
      }
    }
    
    fetchReps();
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
    const reviewedRep = {
      goal: repToReview.goal,
      initial_seconds: repToReview.initialSeconds,
      status: status,
      notes: notes,
      completed_at: new Date().toISOString(), // 렙 종료 시각 기록
    };
    
    if (isAuthenticated) {
      // 로그인 상태: 데이터베이스에 저장
      try {
        // 사용자 ID 추가
        reviewedRep.user_id = user.id;
        
        const { data, error } = await supabase
          .from('reps')
          .insert([reviewedRep]);
          
        if (error) {
          console.error('데이터베이스 저장 실패:', error);
          return;
        }
        
        // 성공적으로 저장되면 목록 새로고침
        const { data: updatedData, error: fetchError } = await supabase
          .from('reps')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
          
        if (fetchError) {
          console.error('데이터 새로고침 실패:', fetchError);
        } else if (updatedData) {
          setRepList(updatedData);
        }
      } catch (err) {
        console.error('데이터 처리 중 오류 발생:', err);
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
      
      {/* The four main areas of the screen we'll build out later */}
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
          {/* Dashboard area (placeholder for now) */}
          <Dashboard reps={filteredReps} />
        </div>
      </div>

      <CreateRepModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onStart={handleSaveRep}
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
