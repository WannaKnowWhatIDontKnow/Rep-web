import React, { useState, useEffect, useRef, useCallback } from 'react';
import logger from './utils/logger'; // logger 임포트
import ErrorBoundary from './components/ErrorBoundary'; // ErrorBoundary 임포트
import './App.css';
import "react-datepicker/dist/react-datepicker.css"; // Datepicker CSS
import CurrentRep from './components/CurrentRep';

import RepList from './components/RepList';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection'; // Import CalendarSection
import Statistics from './components/Statistics/Statistics'; // 대시보드(주간/월간/연간) 컴포넌트 추가
import supabase from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import ConfirmModal from './components/ConfirmModal'; // 확인 모달 컴포넌트 추가
import RepDetailModal from './components/RepDetailModal'; // Rep 상세 정보 모달 컴포넌트 추가
import { useReps } from './hooks/useReps'; // 새로운 커스텀 훅 추가
import { Rep } from './types'; // Rep 타입 임포트

// App component (the overall structure of our website) is defined here.
function App(): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // State for the selected date
  const [currentRep, setCurrentRep] = useState<Rep | null>(null);
  const [isRetroModalOpen, setRetroModalOpen] = useState<boolean>(false);
  const [repToReview, setRepToReview] = useState<Rep | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'dashboard'>('daily'); // 'daily' 또는 'dashboard'
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false); // 확인 모달 표시 상태
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null); // 선택된 Rep 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false); // 상세 정보 모달 표시 상태 추가
  const [repToDelete, setRepToDelete] = useState<Rep | null>(null); // 삭제할 rep의 정보를 저장
  const [isDeleteCurrentRepModalOpen, setDeleteCurrentRepModalOpen] = useState<boolean>(false); // CurrentRep 삭제 확인 모달 상태

  const { user, isAuthenticated } = useAuth();
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  
  // useReps 훅 사용하여 렙 데이터 관리 (이제 인자 없이 호출)
  const { repList, loading, addRep, getFilteredReps, deleteRep } = useReps();

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true); // Start as paused
  const [endTime, setEndTime] = useState<number | null>(null); // State to store the target end time
  const [lastSuccessfulRepMinutes, setLastSuccessfulRepMinutes] = useState<number>(15); // 마지막으로 성공한 렙의 타이머 길이 (기본값 15분)

  // useEffect에서 fetchReps 함수를 직접 호출하므로 여기서는 함수 정의를 제거합니다.
  // 이제 useReps 훅에서 fetchReps 함수를 가져와 사용합니다.


  
  useEffect(() => {
    if (isAuthenticated && user) {
      // 로그인된 사용자의 마지막 성공 렙 시간 가져오기 
      const fetchLastSuccessfulRepMinutes = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('last_successful_rep_minutes')
          .eq('id', user.id);
        if (error) {
          console.error('로그인 사용자의 마지막 성공 렙 시간 가져오기 실패:', error);
        } else {
          setLastSuccessfulRepMinutes(data[0].last_successful_rep_minutes);
        }
      };
      fetchLastSuccessfulRepMinutes();
    } else if (!isAuthenticated) {
      // 비로그인 상태일 때 로컬스토리지에서 마지막 성공 렙 시간 불러오기
      try {
        // 마지막 성공 렙 시간 불러오기
        const savedLastSuccessfulRepMinutes = localStorage.getItem('lastSuccessfulRepMinutes');
        if (savedLastSuccessfulRepMinutes) {
          setLastSuccessfulRepMinutes(Number(savedLastSuccessfulRepMinutes));
        }
      } catch (error) {
        console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
      }
    }
  }, [isAuthenticated, user]);
  
  // 비로그인 상태일 때만 로컬스토리지에 저장
  // 이제 이 기능은 useReps 훅에서 처리합니다.

  useEffect(() => {
    const rightPanel = rightPanelRef.current;
    const leftPanel = leftPanelRef.current;

    if (!rightPanel || !leftPanel) return;
    const resizeObserver = new ResizeObserver(() => {
      const rightPanelHeight = rightPanel.offsetHeight;
      leftPanel.style.maxHeight = `${rightPanelHeight}px`;
    });
    resizeObserver.observe(rightPanel);
    return () => resizeObserver.disconnect();
  }, [activeTab]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  const handleStartRep = (goal: string, minutes: number): void => {
    if (!isToday(selectedDate)) {
      alert("렙 생성은 오늘 날짜에서만 가능합니다.");
      return;
    }
    const newInitialSeconds = minutes * 60;
    const newRep: Rep = {
      id: Date.now(),
      goal: goal,
      initial_seconds: newInitialSeconds,
      completed_at: null, // 시작 시에는 null로 설정
      initialSeconds: newInitialSeconds // 클라이언트 측 호환성
    };
    setCurrentRep(newRep);
    setRemainingSeconds(newInitialSeconds);
    setEndTime(Date.now() + newInitialSeconds * 1000);
    setIsPaused(false);
  };

  const handleCompleteRep = useCallback((completedRep: Rep, finalSeconds: number) => {
    logger.info('Rep 완료 처리. 회고 모달을 엽니다.');
    setCurrentRep(null); 
    
    const reviewRep: Rep = {
      ...completedRep,
      finalSeconds: finalSeconds
    };
    setRepToReview(reviewRep);
    
    setTimeout(() => {
      setRetroModalOpen(true);
    }, 0);
  }, []);

  const handleInterruptRep = () => {
    if (!currentRep) return;
    setShowConfirmModal(true);
  };

  const confirmEarlyComplete = () => {
    if (!currentRep) return;
    const elapsedSeconds = currentRep.initial_seconds - remainingSeconds;
    const completedRep: Rep = {
      ...currentRep,
      completed_at: new Date().toISOString()
    };
    new Audio('/alert.mp3').play().catch(e => console.error('Audio error:', e));
    setShowConfirmModal(false);
    handleCompleteRep(completedRep, elapsedSeconds);
  };

  useEffect(() => {
    if (!currentRep || isPaused || endTime === null) return;
    const timerId = setInterval(() => {
      // endTime이 null이 아닌지 확인
      const now = Date.now();
      const gap = now - lastTickRef.current;
      lastTickRef.current = now;
      if (gap > 3000) {
        setRemainingSeconds(Math.max(0, Math.round((endTime - now) / 1000)));
        setIsPaused(true);
        return;
      }
      if (endTime === null) {
        clearInterval(timerId);
        return;
      }
      
      const newRemaining = Math.round((endTime - Date.now()) / 1000);

      if (newRemaining <= 0) {
        clearInterval(timerId);
        setRemainingSeconds(0);
        console.log('Timer ended - attempting sound');
        new Audio('/alert.mp3').play().catch(e => console.error('Audio error:', e));
        const completedRep: Rep = { ...currentRep, completed_at: new Date().toISOString() };
        handleCompleteRep(completedRep, currentRep.initial_seconds);
      } else {
        setRemainingSeconds(newRemaining);
      }
    }, 500);
    return () => clearInterval(timerId);
  }, [isPaused, currentRep, endTime, handleCompleteRep]);

  const handleDeleteCurrentRepRequest = () => setDeleteCurrentRepModalOpen(true);
  const confirmDeleteCurrentRep = () => { setCurrentRep(null); setDeleteCurrentRepModalOpen(false); };
  const cancelDeleteCurrentRep = () => setDeleteCurrentRepModalOpen(false);

  const handleTogglePause = (): void => {
    setIsPaused(prev => {
      if (prev) setEndTime(Date.now() + remainingSeconds * 1000);
      return !prev;
    });
  };

  const handleRetroSubmit = async (notes: string): Promise<void> => {
      if (!repToReview) {
          setRetroModalOpen(false);
          return;
      }
      const completedRepData = { ...repToReview, notes };
      await addRep(completedRepData);
      setCurrentRep(null);
      setSelectedDate(new Date());
      setRetroModalOpen(false);
      setRepToReview(null);
      
      // 마지막 성공한 렙 시간 저장
      const minutes = Math.floor(completedRepData.initial_seconds / 60);
      setLastSuccessfulRepMinutes(minutes);
      
      try {
        localStorage.setItem('lastSuccessfulRepMinutes', String(minutes));
      } catch (error) {
        console.error('로컬스토리지에 데이터 저장 실패:', error);
      }
  };

  const filteredReps = getFilteredReps(selectedDate);

  const repDates: Record<string, number> = {};
  repList.forEach(rep => {
    if (!rep.completed_at) return;
    const d = new Date(rep.completed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    repDates[key] = (repDates[key] || 0) + Math.floor((rep.initial_seconds || 0) / 60);
  });

  const handleOpenAuthModal = (): void => setAuthModalOpen(true);
  const handleCloseAuthModal = (): void => setAuthModalOpen(false);
  const handleRepCardClick = (rep: Rep): void => { setSelectedRep(rep); setDetailModalOpen(true); };
  const handleDeleteRequest = (rep: Rep): void => { if (!rep) return; setRepToDelete(rep); setDetailModalOpen(false); };
  const handleConfirmDelete = async (): Promise<void> => { if (!repToDelete) return; await deleteRep(repToDelete.id); setRepToDelete(null); };
  const handleCancelDelete = (): void => setRepToDelete(null);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 onClick={() => setActiveTab('daily')} style={{ cursor: 'pointer' }}>Rep</h1>
        <div className="auth-section">
          {isAuthenticated ? <UserProfile /> : <button onClick={handleOpenAuthModal} className="header-auth-button">로그인</button>}
        </div>
      </div>
      
      {activeTab === 'daily' ? (
        <div className="main-content">
          <div className="left-panel" ref={leftPanelRef}>
            <ErrorBoundary><CalendarSection selectedDate={selectedDate} setSelectedDate={setSelectedDate} repDates={repDates} /></ErrorBoundary>
            <ErrorBoundary><RepList reps={filteredReps} onRepCardClick={handleRepCardClick} /></ErrorBoundary>
          </div>
          <div className="right-panel" ref={rightPanelRef}>
            <ErrorBoundary><CurrentRep key={lastSuccessfulRepMinutes} rep={currentRep} remainingSeconds={remainingSeconds} isPaused={isPaused} onTogglePause={handleTogglePause} onStart={handleStartRep} onDeleteRequest={handleDeleteCurrentRepRequest} defaultMinutes={lastSuccessfulRepMinutes} onInterrupt={handleInterruptRep} /></ErrorBoundary>
            <ErrorBoundary><Dashboard reps={filteredReps} setActiveTab={setActiveTab} /></ErrorBoundary>
          </div>
        </div>
      ) : (
        <Statistics setActiveTab={setActiveTab} />
      )}
      
      <RetrospectiveModal isOpen={isRetroModalOpen} onSubmit={handleRetroSubmit} repToReview={repToReview} />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
      <ConfirmModal isOpen={showConfirmModal} onConfirm={confirmEarlyComplete} onCancel={() => setShowConfirmModal(false)} />
      <ConfirmModal isOpen={!!repToDelete} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} title="삭제 확인"><p>정말 이 Rep을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p></ConfirmModal>
      <ConfirmModal isOpen={isDeleteCurrentRepModalOpen} onConfirm={confirmDeleteCurrentRep} onCancel={cancelDeleteCurrentRep} title="삭제 확인"><p>진행 중인 Rep을 정말 삭제하시겠습니까?</p></ConfirmModal>
      <RepDetailModal isOpen={isDetailModalOpen} onClose={() => { setDetailModalOpen(false); setSelectedRep(null); }} rep={selectedRep} onDeleteRequest={handleDeleteRequest} />
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
