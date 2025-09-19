import React, { useState } from 'react';

const UserLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user);
      } else {
        alert('Failed to login. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUsers = [
      { username: 'Alice_Designer', email: 'alice@example.com' },
      { username: 'Bob_Developer', email: 'bob@example.com' },
      { username: 'Charlie_PM', email: 'charlie@example.com' }
    ];
    
    const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
    setUsername(randomUser.username);
    setEmail(randomUser.email);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Join Your Team</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Enter your details to start collaborating
        </p>
        
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email (optional)</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '1rem' }}
          disabled={loading || !username.trim()}
        >
          {loading ? '🔄 Joining...' : '🚀 Join Dashboard'}
        </button>

        <button 
          type="button" 
          onClick={handleDemoLogin}
          className="btn btn-secondary" 
          style={{ width: '100%' }}
        >
          🎯 Quick Demo Login
        </button>

        {/* Add Google Sign-In Button */}
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}
          onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
        >
          <span style={{ marginRight: '8px' }}>🟢</span> Sign in with Google
        </button>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f8ff', borderRadius: '8px', fontSize: '0.9rem' }}>
          <strong>💡 Demo Tips:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>Open multiple browser tabs to test real-time collaboration</li>
            <li>Use different usernames to simulate team members</li>
            <li>Try the focus timer and task management features</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default UserLogin;
