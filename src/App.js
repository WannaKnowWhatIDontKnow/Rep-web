import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import CurrentRep from './components/CurrentRep';
import RepList from './components/RepList';
import CreateRepModal from './components/CreateRepModal';
import RetrospectiveModal from './components/RetrospectiveModal';

// App component (the overall structure of our website) is defined here.
function App() {
  const [currentRep, setCurrentRep] = useState(null);
  const [repList, setRepList] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isRetroModalOpen, setRetroModalOpen] = useState(false);
  const [repToReview, setRepToReview] = useState(null);
  const [repToEdit, setRepToEdit] = useState(null); // State to hold the rep being edited

  // Timer-related states are lifted up from CurrentRep.js
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleOpenCreateModal = () => {
    setRepToEdit(null); // Ensure it's in creation mode
    setCreateModalOpen(true);
  };
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setRepToEdit(null); // Clean up after modal closes
  };

  const handleOpenEditModal = () => {
    setRepToEdit(currentRep);
    setCreateModalOpen(true);
  };

  const handleCompleteRep = useCallback((completedRep) => {
    new Audio('/alert.mp3').play().catch(() => console.log('Failed to play alert sound'));
    setCurrentRep(null);
    setRepToReview(completedRep);
    setRetroModalOpen(true);
  }, []);

  // Timer logic, moved from CurrentRep.js
  useEffect(() => {
    if (!currentRep || isPaused) return;

    if (remainingSeconds <= 0) {
      handleCompleteRep(currentRep);
      return;
    }

    const timerId = setInterval(() => {
      setRemainingSeconds(prevSeconds => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [remainingSeconds, isPaused, currentRep, handleCompleteRep]);

  // This function now handles both creating and updating a Rep.
  const handleSaveRep = (goal, minutes, seconds) => {
    const newInitialSeconds = minutes * 60 + seconds;

    if (repToEdit) {
      // Editing an existing Rep
      const elapsedSeconds = currentRep.initialSeconds - remainingSeconds;
      const newRemainingSeconds = newInitialSeconds - elapsedSeconds;

      setCurrentRep({
        ...currentRep,
        goal: goal,
        initialSeconds: newInitialSeconds,
      });
      setRemainingSeconds(newRemainingSeconds > 0 ? newRemainingSeconds : 0);

    } else {
      // Creating a new Rep
      const newRep = {
        id: Date.now(),
        goal: goal,
        initialSeconds: newInitialSeconds,
        status: 'pending',
      };
      setCurrentRep(newRep);
      setRemainingSeconds(newInitialSeconds);
      setIsPaused(false);
    }

    handleCloseCreateModal();
  };

  const handleDeleteRep = () => {
    if (window.confirm('Are you sure you want to delete this Rep?')) {
      setCurrentRep(null);
    }
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
            onTogglePause={() => setIsPaused(!isPaused)}
            onStartNew={handleOpenCreateModal}
            onDelete={handleDeleteRep}
            onEdit={handleOpenEditModal} // Changed from onEdit={handleEditRep}
          />
          {/* Dashboard area (placeholder for now) */}
          <div className="dashboard-placeholder">Dashboard</div>
        </div>
      </div>

      <CreateRepModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onStart={handleSaveRep} // Renamed from onStart={handleStartRep}
        repToEdit={repToEdit} // Pass the rep to be edited
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
