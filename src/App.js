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

// App component (the overall structure of our website) is defined here.
function App() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for the selected date
  const [currentRep, setCurrentRep] = useState(null);
  const [isRetroModalOpen, setRetroModalOpen] = useState(false);
  const [repToReview, setRepToReview] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' 또는 'dashboard'
  const [showConfirmModal, setShowConfirmModal] = useState(false); // 확인 모달 표시 상태
  const [selectedRep, setSelectedRep] = useState(null); // 선택된 Rep 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState(false); // 상세 정보 모달 표시 상태 추가

  const { user, isAuthenticated } = useAuth();
  const rightPanelRef = useRef(null);
  const leftPanelRef = useRef(null);
  
  // useReps 훅 사용하여 렙 데이터 관리 (이제 인자 없이 호출)
  const { repList, loading, addRep, getFilteredReps } = useReps();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start as paused
  const [endTime, setEndTime] = useState(null); // State to store the target end time
  const [lastSuccessfulRepMinutes, setLastSuccessfulRepMinutes] = useState(15); // 마지막으로 성공한 렙의 타이머 길이 (기본값 15분)

  // useEffect에서 fetchReps 함수를 직접 호출하므로 여기서는 함수 정의를 제거합니다.
  // 이제 useReps 훅에서 fetchReps 함수를 가져와 사용합니다.


  
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLastSuccessfulRepMinutes(); // 로그인 사용자의 마지막 성공 렙 시간 불러오기
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

    // ResizeObserver를 생성하여 right-panel의 높이 변경을 감지
    const resizeObserver = new ResizeObserver(() => {
      const rightPanelHeight = rightPanel.offsetHeight;
      // 🔥 여기에 디버깅 코드 추가
      logger.info(`[ResizeObserver] right-panel 높이: ${rightPanelHeight}px, left-panel max-height 설정`);
      leftPanel.style.maxHeight = `${rightPanelHeight}px`;
    });

    resizeObserver.observe(rightPanel);

    // 컴포넌트가 언마운트될 때 observer를 정리
    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]); // activeTab이 변경되면 패널이 다시 렌더링되므로 의존성 유지

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  // 마지막 성공 렙 시간 불러오기 함수
  const fetchLastSuccessfulRepMinutes = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // user_settings 테이블에서 사용자 설정 불러오기
      const { data, error } = await supabase
        .from('user_settings')
        .select('last_successful_rep_minutes')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        logger.error('사용자 설정 불러오기 실패:', error);
        return;
      }
      
      if (data && data.last_successful_rep_minutes) {
        logger.info('마지막 성공 렙 시간 불러오기 성공:', data.last_successful_rep_minutes);
        setLastSuccessfulRepMinutes(data.last_successful_rep_minutes);
      }
    } catch (error) {
      logger.error('마지막 성공 렙 시간 불러오기 중 오류 발생:', error);
    }
  };
  
  // 마지막 성공 렙 시간 저장 함수
  const saveLastSuccessfulRepMinutes = async (minutes) => {
    logger.info('마지막 성공 렙 시간 저장:', minutes);
    
    if (isAuthenticated && user) {
      try {
        // user_settings 테이블에 사용자 설정 저장/업데이트
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            last_successful_rep_minutes: minutes,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          logger.error('사용자 설정 저장 실패:', error);
        }
      } catch (error) {
        logger.error('마지막 성공 렙 시간 저장 중 오류 발생:', error);
      }
    } else {
      // 비로그인 상태: 로컬스토리지에 저장
      try {
        localStorage.setItem('lastSuccessfulRepMinutes', minutes.toString());
      } catch (error) {
        logger.error('로컬스토리지에 마지막 성공 렙 시간 저장 실패:', error);
      }
    }
  };

  // 새로운 Rep 시작 함수
  const handleStartRep = (goal, minutes) => {
    // 렙 생성은 오늘 날짜에서만 가능
    if (!isToday(selectedDate)) {
      alert("렙 생성은 오늘 날짜에서만 가능합니다.");
      return;
    }
    
    const newInitialSeconds = minutes * 60; // 분을 초로 변환
    
    const newRep = {
      id: Date.now(),
      goal: goal,
      initialSeconds: newInitialSeconds
    };
    
    setCurrentRep(newRep);
    setRemainingSeconds(newInitialSeconds);
    setEndTime(Date.now() + newInitialSeconds * 1000);
    setIsPaused(false);
  };

  const handleCompleteRep = useCallback((completedRep, finalSeconds) => {
    logger.info('Rep 완료 처리. 회고 모달을 엽니다.');
    new Audio('/alert.mp3').play().catch(() => logger.warn('알림음 재생에 실패했습니다.'));
    
    // 🔥 중요: 이 라인을 다시 활성화합니다.
    setCurrentRep(null); 
    
    const reviewRep = {
      ...completedRep,
      finalSeconds: finalSeconds
    };
    setRepToReview(reviewRep);
    
    setTimeout(() => {
      setRetroModalOpen(true);
    }, 0);
  }, []);
  
  // 중간에 Rep을 중단하는 함수 - 확인 모달을 표시하는 역할
  const handleInterruptRep = () => {
    console.log('handleInterruptRep 함수 실행됨!', currentRep);
    if (!currentRep) {
      console.error('중단할 Rep이 없습니다.');
      return;
    }
    
    // 확인 모달 표시
    setShowConfirmModal(true);
  };

  // 실제로 Rep을 완료시키는 함수 (확인 모달에서 '확인' 버튼 클릭 시 호출)
  const confirmEarlyComplete = () => {
    if (!currentRep) {
      console.error('완료할 Rep이 없습니다.');
      return;
    }
    
    // 실제 경과 시간 계산
    const elapsedSeconds = currentRep.initialSeconds - remainingSeconds;
    
    // 완료된 Rep 정보 설정
    const completedRep = {
      ...currentRep,
      completed_at: new Date().toISOString()
    };
    
    // 확인 모달 닫기
    setShowConfirmModal(false);
    
    // handleCompleteRep 호출하여 회고 모달 표시
    handleCompleteRep(completedRep, elapsedSeconds);
  };

  // More robust timer logic
  useEffect(() => {
    if (!currentRep || isPaused) {
      return;
    }

    const timerId = setInterval(() => {
      const newRemaining = Math.round((endTime - Date.now()) / 1000);

      if (newRemaining <= 0) {
        console.log('타이머 종료! Rep 완료 처리 시작');
        clearInterval(timerId); // 타이머 즉시 중지
        setRemainingSeconds(0);
        
        // 완료된 Rep 정보 설정
        const completedRep = {
          ...currentRep,
          completed_at: new Date().toISOString()
        };
        
        // 타이머 종료 후 즉시 모달 표시
        // 타이머가 정상적으로 종료된 경우 초기 설정 시간 그대로 전달
        handleCompleteRep(completedRep, currentRep.initialSeconds);
      } else {
        setRemainingSeconds(newRemaining);
      }
    }, 500); // Check more frequently for better accuracy

    return () => clearInterval(timerId);
  }, [isPaused, currentRep, endTime, handleCompleteRep]);



  const handleDeleteRep = () => {
    if (window.confirm('Are you sure you want to delete this Rep?')) {
      setCurrentRep(null);
    }
  };

  // 이전 handleDropRep 함수는 삭제 - handleEarlyCompleteRep로 대체됨
  // 이제 모든 데이터 로딩은 useReps 훅이 책임짐

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

  const handleRetroSubmit = async (notes) => {
    if (!repToReview) {
      logger.error('회고 제출 시 repToReview가 없습니다.');
      // 사용자가 모달 외부를 클릭하거나 X를 눌러 닫는 경우, notes가 없을 수 있습니다.
      // 이 경우엔 그냥 모달만 닫고 아무것도 하지 않습니다.
      setRetroModalOpen(false);
      setRepToReview(null);
      setCurrentRep(null); // 어떤 경우든 CurrentRep는 비워줍니다.
      return;
    }

    logger.info('회고 제출. 리스트에 Rep 추가 및 CurrentRep 초기화.');

    const completedRepData = {
      ...repToReview,
      notes: notes,
    };

    // 1. 실제 데이터 리스트에 Rep 추가 (즉시 실행)
    await addRep(completedRepData);

    // 2. CurrentRep 영역을 비움 (즉시 실행)
    setCurrentRep(null);
    
    // 3. 오늘 날짜로 뷰 전환
    setSelectedDate(new Date());

    // 4. 모달 닫기 및 임시 상태 초기화
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  // 선택된 날짜에 해당하는 렙만 필터링 (useReps 훅의 getFilteredReps 함수 사용)
  const filteredReps = getFilteredReps(selectedDate);

  // 최신 10개의 Rep만 선택합니다.
  const latestTenReps = filteredReps.slice(0, 10);

  // 로그인/회원가입 모달 열기
  const handleOpenAuthModal = () => {
    setAuthModalOpen(true);
  };
  
  // 로그인/회원가입 모달 닫기
  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };
  
  // Rep 카드 클릭 시 실행될 함수
  const handleRepCardClick = (rep) => {
    setSelectedRep(rep);
    setDetailModalOpen(true);
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
            <button onClick={handleOpenAuthModal} className="header-auth-button">로그인</button>
          )}
        </div>
      </div>
      
      {/* 탭에 따라 다른 콘텐츠 표시 */}
      {activeTab === 'daily' ? (
        <div className="main-content">
        <div className="left-panel" ref={leftPanelRef}>
          {/* Calendar area */}
          <ErrorBoundary>
            <CalendarSection 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
            />
          </ErrorBoundary>
          {/* List area (core feature implementation target) */}
          <ErrorBoundary>
            <RepList reps={filteredReps} onRepCardClick={handleRepCardClick} />
          </ErrorBoundary>
        </div>
        <div className="right-panel" ref={rightPanelRef}>
          {/* Current Rep area (core feature implementation target) */}
          <ErrorBoundary>
            <CurrentRep
            key={lastSuccessfulRepMinutes} // 이 key가 변경될 때마다 컴포넌트가 리셋됩니다.
            rep={currentRep}
            remainingSeconds={remainingSeconds}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onStart={handleStartRep}
            onDelete={handleDeleteRep}
            defaultMinutes={lastSuccessfulRepMinutes}
            onInterrupt={handleInterruptRep}
            />
          </ErrorBoundary>  
          {/* Dashboard area */}
          <ErrorBoundary>
            <Dashboard reps={filteredReps} setActiveTab={setActiveTab} />
          </ErrorBoundary>
        </div>
      </div>
      ) : (
        <Statistics setActiveTab={setActiveTab} />
      )}
      
      {/* 회고 모달 - z-index를 높게 설정하여 항상 다른 요소들 위에 표시되도록 함 */}
      <RetrospectiveModal 
        isOpen={isRetroModalOpen}
        onSubmit={handleRetroSubmit}
      />
      
      {/* 로그인/회원가입 모달 */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
      
      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmEarlyComplete}
        onCancel={() => setShowConfirmModal(false)}
      />
      
      {/* Rep 상세 정보 모달 */}
      <RepDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRep(null);
        }}
        rep={selectedRep}
      />
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
