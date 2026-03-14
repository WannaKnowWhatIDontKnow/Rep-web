import React, { useState, useRef, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import "react-datepicker/dist/react-datepicker.css";
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection';
import Statistics from './components/Statistics/Statistics';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import ConfirmModal from './components/ConfirmModal';
import RepDetailModal from './components/RepDetailModal';
import { useReps } from './hooks/useReps';
import { useRepSession } from './hooks/useRepSession';
import { useRepActions } from './hooks/useRepActions';
import { buildRepDates } from './utils/repDates';

function App(): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'dashboard'>('daily');
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const { repList, addRep, getFilteredReps, deleteRep } = useReps();
  const session = useRepSession({ addRep, selectedDate });
  const repActions = useRepActions({ deleteRep });

  const filteredReps = getFilteredReps(selectedDate);
  const repDates = buildRepDates(repList);

  useEffect(() => {
    const rightPanel = rightPanelRef.current;
    const leftPanel = leftPanelRef.current;
    if (!rightPanel || !leftPanel) return;
    const resizeObserver = new ResizeObserver(() => {
      leftPanel.style.maxHeight = `${rightPanel.offsetHeight}px`;
    });
    resizeObserver.observe(rightPanel);
    return () => resizeObserver.disconnect();
  }, [activeTab]);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 onClick={() => setActiveTab('daily')} style={{ cursor: 'pointer' }}>Rep</h1>
        <div className="auth-section">
          {isAuthenticated
            ? <UserProfile />
            : <button onClick={() => setAuthModalOpen(true)} className="header-auth-button">로그인</button>}
        </div>
      </div>

      {activeTab === 'daily' ? (
        <div className="main-content">
          <div className="left-panel" ref={leftPanelRef}>
            <ErrorBoundary><CalendarSection selectedDate={selectedDate} setSelectedDate={setSelectedDate} repDates={repDates} /></ErrorBoundary>
            <ErrorBoundary><RepList reps={filteredReps} onRepCardClick={repActions.openDetail} /></ErrorBoundary>
          </div>
          <div className="right-panel" ref={rightPanelRef}>
            <ErrorBoundary>
              <CurrentRep
                key={session.lastSuccessfulRepMinutes}
                rep={session.currentRep}
                remainingSeconds={session.remainingSeconds}
                isPaused={session.isPaused}
                onTogglePause={session.handleTogglePause}
                onStart={session.handleStartRep}
                onDeleteRequest={session.handleDeleteCurrentRepRequest}
                defaultMinutes={session.lastSuccessfulRepMinutes}
                onInterrupt={session.handleInterruptRep}
              />
            </ErrorBoundary>
            <ErrorBoundary><Dashboard reps={filteredReps} setActiveTab={setActiveTab} /></ErrorBoundary>
          </div>
        </div>
      ) : (
        <Statistics setActiveTab={setActiveTab} />
      )}

      <RetrospectiveModal isOpen={session.isRetroModalOpen} onSubmit={session.handleRetroSubmit} repToReview={session.repToReview} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ConfirmModal isOpen={session.showConfirmModal} onConfirm={session.confirmEarlyComplete} onCancel={session.cancelEarlyComplete} />
      <ConfirmModal isOpen={!!repActions.repToDelete} onConfirm={repActions.confirmDelete} onCancel={repActions.cancelDelete} title="삭제 확인">
        <p>정말 이 Rep을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      </ConfirmModal>
      <ConfirmModal isOpen={session.isDeleteCurrentRepModalOpen} onConfirm={session.confirmDeleteCurrentRep} onCancel={session.cancelDeleteCurrentRep} title="삭제 확인">
        <p>진행 중인 Rep을 정말 삭제하시겠습니까?</p>
      </ConfirmModal>
      <RepDetailModal isOpen={repActions.isDetailModalOpen} onClose={repActions.closeDetail} rep={repActions.selectedRep} onDeleteRequest={repActions.handleDeleteRequest} />
    </div>
  );
}

export default App;