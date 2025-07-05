import React from 'react';
import './Dashboard.css';
import { IoTimeOutline, IoRepeat, IoBarChartSharp, IoLockClosedOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';



// Function to format time as MM:SS or HH:MM:SS and return both value and unit
const formatTime = (totalSeconds, forceHours = false) => {
    // Floor the total seconds to remove decimal points
    const safeTotalSeconds = Math.floor(totalSeconds);
    
    if (isNaN(safeTotalSeconds) || safeTotalSeconds === 0) {
        const value = forceHours ? '00:00:00' : '00:00';
        const unit = forceHours ? 'HH:MM:SS' : 'MM:SS';
        return { value, unit };
    }
    
    const hours = Math.floor(safeTotalSeconds / 3600);
    const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
    const seconds = safeTotalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0 || forceHours) {
        const paddedHours = String(hours).padStart(2, '0');
        return {
            value: `${paddedHours}:${paddedMinutes}:${paddedSeconds}`,
            unit: 'HH:MM:SS'
        };
    }
    return {
        value: `${paddedMinutes}:${paddedSeconds}`,
        unit: 'MM:SS'
    };
};

function Dashboard({ reps, setActiveTab }) {
  const totalReps = reps.length;
  
  // Handle NaN and data format inconsistencies when calculating time
  const totalTime = reps.reduce((sum, rep) => {
    // Use initial_seconds or initialSeconds field, default to 0 if both are missing or NaN
    const seconds = rep.initial_seconds || rep.initialSeconds;
    // Handle non-numeric or NaN values by using 0
    return sum + (typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0);
  }, 0);
  
  // Calculate average time with Math.floor to remove decimal points
  const averageTimeInSeconds = totalReps > 0 ? Math.floor(totalTime / totalReps) : 0;
  
  // Format times with the updated formatTime function
  const totalTimeFormatted = formatTime(totalTime, true);
  const averageTimeFormatted = formatTime(averageTimeInSeconds);
  
  const { isAuthenticated } = useAuth();

  return (
    <div className="new-dashboard">
      <div className="main-metric">
        <div className="metric-header">
          <IoTimeOutline />
          <span>Total Time</span>
        </div>
        <div className="metric-value-large">{totalTimeFormatted.value}</div>
        <div className="metric-unit">{totalTimeFormatted.unit}</div>
      </div>

      <div className="sub-metrics">
        <div className="metric-card">
          <div className="metric-header">
            <IoRepeat />
            <span>Reps</span>
          </div>
          <div className="metric-value-small">{totalReps}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <IoBarChartSharp />
            <span>Average Time</span>
          </div>
          <div className="metric-value-small">{averageTimeFormatted.value}</div>
          <div className="metric-unit">{averageTimeFormatted.unit}</div>
        </div>
      </div>

      <div className="dashboard-cta">
        {isAuthenticated ? (
          <button className="stats-button" onClick={() => setActiveTab('dashboard')}>
            View Weekly/Monthly Stats
          </button>
        ) : (
          <div className="stats-locked-wrapper">
            <button className="stats-button disabled" disabled>
              <IoLockClosedOutline />
              View Weekly/Monthly Stats
            </button>
            <p className="stats-message">Sign up to unlock this feature</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;