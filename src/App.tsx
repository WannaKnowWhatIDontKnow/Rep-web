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

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  // 마지막 성공 렙 시간 불러오기 함수
  const fetchLastSuccessfulRepMinutes = async (): Promise<void> => {
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
  const saveLastSuccessfulRepMinutes = async (minutes: number): Promise<void> => {
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
  const handleStartRep = (goal: string, minutes: number): void => {
    // 렙 생성은 오늘 날짜에서만 가능
    if (!isToday(selectedDate)) {
      alert("렙 생성은 오늘 날짜에서만 가능합니다.");
      return;
    }
    
    const newInitialSeconds = minutes * 60; // 분을 초로 변환
    
    const newRep: Rep = {
      id: Date.now(),
      goal: goal,
      initial_seconds: newInitialSeconds,
      completed_at: null,
    };
    
    setCurrentRep(newRep);
    setRemainingSeconds(newInitialSeconds);
    setEndTime(Date.now() + newInitialSeconds * 1000);
    setIsPaused(false);
  };

  const handleCompleteRep = useCallback((completedRep: Rep, finalSeconds: number) => {
    logger.info('Rep 완료 처리. 회고 모달을 엽니다.');
    new Audio('/alert.mp3').play().catch(() => logger.warn('알림음 재생에 실패했습니다.'));
    
    // 🔥 중요: 이 라인을 다시 활성화합니다.
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
    const elapsedSeconds = currentRep.initial_seconds - remainingSeconds;
    
    // 완료된 Rep 정보 설정
    const completedRep: Rep = {
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
      // endTime이 null이 아닌지 확인
      if (endTime === null) {
        clearInterval(timerId);
        return;
      }
      
      const newRemaining = Math.round((endTime - Date.now()) / 1000);

      if (newRemaining <= 0) {
        console.log('타이머 종료! Rep 완료 처리 시작');
        clearInterval(timerId); // 타이머 즉시 중지
        setRemainingSeconds(0);
        
        // 완료된 Rep 정보 설정
        const completedRep: Rep = {
          ...currentRep,
          completed_at: new Date().toISOString()
        };
        
        // 타이머 종료 후 즉시 모달 표시
        // 타이머가 정상적으로 종료된 경우 초기 설정 시간 그대로 전달
        handleCompleteRep(completedRep, currentRep.initial_seconds);
      } else {
        setRemainingSeconds(newRemaining);
      }
    }, 500); // Check more frequently for better accuracy

    return () => clearInterval(timerId);
  }, [isPaused, currentRep, endTime, handleCompleteRep]);



  // CurrentRep 삭제 관련 핸들러 함수들
  const handleDeleteCurrentRepRequest = () => {
    // 'Delete' 버튼이 눌리면 모달을 열기만 함
    setDeleteCurrentRepModalOpen(true);
  };

  const confirmDeleteCurrentRep = () => {
    // 모달에서 '확인'을 누르면 실제 삭제 로직 실행
    setCurrentRep(null);
    setDeleteCurrentRepModalOpen(false);
  };

  const cancelDeleteCurrentRep = () => {
    // 모달에서 '취소'를 누르면 모달만 닫음
    setDeleteCurrentRepModalOpen(false);
  };
  
  // 기존 함수 - 상세 모달에서 삭제 요청 시 사용
  const handleDeleteRep = (rep: Rep) => {
    // Rep 상세 모달에서 삭제 요청 시
    setRepToDelete(rep);
  };

  // 이전 handleDropRep 함수는 삭제 - handleEarlyCompleteRep로 대체됨
  // 이제 모든 데이터 로딩은 useReps 훅이 책임짐

  const handleTogglePause = (): void => {
    setIsPaused(prevIsPaused => {
      const nowPaused = !prevIsPaused;
      if (!nowPaused) {
        // Resuming
        setEndTime(Date.now() + remainingSeconds * 1000);
      }
      return nowPaused;
    });
  };

    setSelectedDate(new Date());

    // 4. 모달 닫기 및 임시 상태 초기화
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  // 선택된 날짜에 해당하는 렙만 필터링 (useReps 훅의 getFilteredReps 함수 사용)
  const filteredReps = getFilteredReps ? getFilteredReps(selectedDate) : [];

  // 최신 10개의 Rep만 선택합니다.
  const latestTenReps = filteredReps.slice(0, 10);

  // 로그인/회원가입 모달 열기
  const handleOpenAuthModal = (): void => {
    setIsAuthModalOpen(true);
  };
  
  // 로그인/회원가입 모달 닫기
  const handleCloseAuthModal = (): void => {
    setIsAuthModalOpen(false);
  };
  
  // Rep 카드 클릭 시 실행될 함수
  const handleRepCardClick = (rep: Rep): void => {
    setSelectedRep(rep);
    setIsDetailModalOpen(true);
  };
  
  // 상세 모달에서 '삭제' 버튼 클릭 시 호출될 함수
  const handleDeleteRequest = (rep: Rep): void => {
    if (!rep) return;
    setRepToDelete(rep); // 삭제할 Rep 정보 저장
    setIsDetailModalOpen(false); // 상세 정보 모달은 닫음
  };

  // 최종 확인 모달에서 '확인' 클릭 시 호출될 함수
  const handleConfirmDelete = async (): Promise<void> => {
    if (!repToDelete) return;
    await deleteRep(repToDelete.id);
    setRepToDelete(null); // 삭제 프로세스 종료 및 초기화
  };

  // 최종 확인 모달 '취소' 클릭 시
  const handleCancelDelete = (): void => {
    setRepToDelete(null); // 삭제 프로세스 취소
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
            onDeleteRequest={handleDeleteCurrentRepRequest}
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
      
      {/* 최종 삭제 확인을 위한 확인 모달. repToDelete가 있을 때만 열림 */}
      <ConfirmModal
        isOpen={!!repToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="삭제 확인"
      >
        <p>정말 이 Rep을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      </ConfirmModal>
      
      {/* CurrentRep 삭제 확인을 위한 새로운 ConfirmModal 추가 */}
      <ConfirmModal
        isOpen={isDeleteCurrentRepModalOpen}
        onConfirm={confirmDeleteCurrentRep}
        onCancel={cancelDeleteCurrentRep}
        title="삭제 확인"
      >
        <p>진행 중인 Rep을 정말 삭제하시겠습니까?</p>
      </ConfirmModal>
      
      {/* Rep 상세 정보 모달 */}
      <RepDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRep(null);
        }}
        rep={selectedRep}
        onDeleteRequest={handleDeleteRequest} // 삭제 요청 함수 전달
      />
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
