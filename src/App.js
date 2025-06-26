import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import CreateRepModal from './components/CreateRepModal';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';

// App component (the overall structure of our website) is defined here.
function App() {
  const [currentRep, setCurrentRep] = useState(null);
  const [repList, setRepList] = useState(() => {
    // 앱이 처음 켜질 때 딱 한 번만 실행되는 부분입니다.
    try {
      const savedReps = localStorage.getItem('repList'); // 'repList' 이름으로 저장된 게 있는지 찾아봅니다.
      // 저장된 게 있으면 그걸 사용하고, 없으면 빈 목록으로 시작합니다.
      return savedReps ? JSON.parse(savedReps) : [];
    } catch (error) {
      console.error("Failed to load reps from local storage", error);
      return []; // 에러가 나도 앱이 멈추지 않게 빈 목록을 줍니다.
    }
  });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isRetroModalOpen, setRetroModalOpen] = useState(false);
  const [repToReview, setRepToReview] = useState(null);
  const [repToEdit, setRepToEdit] = useState(null);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start as paused
  const [endTime, setEndTime] = useState(null); // State to store the target end time

  // repList 데이터가 바뀔 때마다 자동으로 실행되는 센서입니다.
  useEffect(() => {
    try {
      // repList 데이터를 텍스트로 변환해서 'repList'라는 이름으로 저장합니다.
      localStorage.setItem('repList', JSON.stringify(repList));
    } catch (error) {
      console.error("Failed to save reps to local storage", error);
    }
  }, [repList]);

  const handleOpenCreateModal = () => {
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

  const handleRetroSubmit = (status, notes) => {
    const reviewedRep = {
      ...repToReview,
      status: status,
      notes: notes,
    };
    setRepList([reviewedRep, ...repList]);
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  return (
    // Container for the entire app
    <div className="app-container">
      {/* The four main areas of the screen we'll build out later */}
      <div className="main-content">
        <div className="left-panel">
          {/* Calendar area (placeholder for now) */}
          <div className="calendar-placeholder">Calendar</div>
          {/* List area (core feature implementation target) */}
          <RepList reps={repList} />
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
          <Dashboard reps={repList} />
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
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
