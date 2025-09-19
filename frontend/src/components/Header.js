import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ user, activeUsers, onLogout }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="header">
      <h1>🚀 Smart Productivity Dashboard</h1>
      <div className="user-info">
        <div className="active-users">
          <span>👥 {activeUsers.length} online</span>
        </div>
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle-icon">
            {isDark ? '☀️' : '🌙'}
          </span>
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>
        
        <span>Welcome, <strong>{user.username}</strong></span>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
