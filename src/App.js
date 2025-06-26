import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import "react-datepicker/dist/react-datepicker.css"; // Datepicker CSS
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import CreateRepModal from './components/CreateRepModal';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection'; // Import CalendarSection

// App component (the overall structure of our website) is defined here.
function App() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for the selected date
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

  const handleRetroSubmit = (status, notes) => {
    const reviewedRep = {
      ...repToReview,
      status: status,
      notes: notes,
      completedAt: new Date().toISOString(), // 렙 종료 시각 기록
    };
    setRepList([reviewedRep, ...repList]);
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  // 선택된 날짜에 해당하는 렙만 필터링
  const filteredReps = repList.filter(rep => {
    if (!rep.completedAt) return false;
    const repDate = new Date(rep.completedAt);
    return repDate.getFullYear() === selectedDate.getFullYear() &&
           repDate.getMonth() === selectedDate.getMonth() &&
           repDate.getDate() === selectedDate.getDate();
  });

  return (
    // Container for the entire app
    <div className="app-container">
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
    </div>
  );
}

// Export the App component so it can be used in other files.
export default App;
