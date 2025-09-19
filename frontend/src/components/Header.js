import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ user, activeUsers, onLogout }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="Clarity Desk Logo" className="logo" />
        <div className="active-users-badge">
          <span className="online-indicator"></span>
          <span>{activeUsers.length} online</span>
        </div>
      </div>
      
      <div className="header-right">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle-icon">
            {isDark ? '☀️' : '🌙'}
          </span>
          <span className="theme-toggle-text">{isDark ? 'Light' : 'Dark'}</span>
        </button>
        
        <div className="user-greeting">
          <span className="greeting-text">Welcome back,</span>
          <strong className="username">{user.username}</strong>
        </div>
        
        <button onClick={onLogout} className="logout-btn">
          <span>🚪</span>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
