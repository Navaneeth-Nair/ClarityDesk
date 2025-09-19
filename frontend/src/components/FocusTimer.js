import React, { useState, useEffect, useRef } from 'react';

const FocusTimer = ({ onSessionStart, onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const intervalRef = useRef(null);

  const presets = [
    { label: '15 min', value: 15 },
    { label: '25 min', value: 25 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 }
  ];

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, timeLeft]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!isRunning) {
      // Start new session
      setIsRunning(true);
      setPaused(false);
      const newSessionId = Date.now();
      setSessionId(newSessionId);
      onSessionStart(selectedDuration);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Focus Session Started! 🎯', {
          body: `${selectedDuration} minute focus session has begun. Stay focused!`,
          icon: '/favicon.ico'
        });
      }
    } else if (isPaused) {
      // Resume session
      setPaused(false);
    } else {
      // Pause session
      setPaused(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setPaused(false);
    setTimeLeft(selectedDuration * 60);
    setSessionId(null);
    clearInterval(intervalRef.current);
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    setPaused(false);
    setTimeLeft(selectedDuration * 60);
    
    if (sessionId) {
      onSessionComplete(sessionId);
    }
    
    // Show completion notification
    if (Notification.permission === 'granted') {
      new Notification('Focus Session Complete! 🎉', {
        body: `Great job! You completed a ${selectedDuration} minute focus session.`,
        icon: '/favicon.ico'
      });
    }
    
    // Play completion sound (if available)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DoumMcBDOJ0fPTgjMGHm/A7+OZSA0PVqzn77BdGAg+ltryxnkpBSl+zPLaizsIGGS57OW');
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (error) {
      // Audio not supported, ignore
    }
    
    setSessionId(null);
  };

  const handlePresetSelect = (duration) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
    }
  };

  const getProgressPercentage = () => {
    const totalTime = selectedDuration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getTimerColor = () => {
    if (!isRunning) return '#667eea';
    if (isPaused) return '#ff9800';
    if (timeLeft < 300) return '#f44336'; // Red for last 5 minutes
    return '#4caf50';
  };

  return (
    <div className="card card-medium">
      <h2>⏰ Focus Timer</h2>
      
      <div className="timer-container">
        {/* Timer Presets */}
        <div className="timer-presets">
          {presets.map(preset => (
            <button
              key={preset.value}
              className={`preset-btn ${selectedDuration === preset.value ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset.value)}
              disabled={isRunning}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Progress Ring */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getTimerColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgressPercentage() / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div 
            className="timer-display"
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: getTimerColor(),
              fontSize: '2rem'
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {!isRunning ? '⏸️ Ready to focus' :
           isPaused ? '⏸️ Paused' :
           timeLeft > 300 ? '🎯 Stay focused!' :
           '🔥 Final push!'}
        </div>

        {/* Timer Controls */}
        <div className="timer-controls">
          <button
            onClick={handleStart}
            className={`btn ${!isRunning ? 'btn-primary' : isPaused ? 'btn-success' : 'btn-secondary'}`}
          >
            {!isRunning ? '▶️ Start' : isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          
          {isRunning && (
            <button
              onClick={handleStop}
              className="btn btn-danger"
            >
              ⏹️ Stop
            </button>
          )}
        </div>

        {/* Session Info */}
        {isRunning && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f0f8ff', 
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Session Duration:</span>
              <strong>{selectedDuration} minutes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Progress:</span>
              <strong>{Math.round(getProgressPercentage())}%</strong>
            </div>
          </div>
        )}

        {/* Tips */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <strong>💡 Focus Tips:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>Turn off notifications on your devices</li>
            <li>Have water and snacks ready</li>
            <li>Focus on one task at a time</li>
            <li>Take short breaks between sessions</li>
          </ul>
        </div>

        {/* Statistics */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            🎯 Today's Focus Time
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
            Track your progress with completed sessions
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
