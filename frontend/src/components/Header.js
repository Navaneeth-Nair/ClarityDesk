import React from 'react';

const Header = ({ user, activeUsers, onLogout }) => {
  return (
    <header className="header">
      <h1>🚀 Smart Productivity Dashboard</h1>
      <div className="user-info">
        <div className="active-users">
          <span>👥 {activeUsers.length} online</span>
        </div>
        <span>Welcome, <strong>{user.username}</strong></span>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
