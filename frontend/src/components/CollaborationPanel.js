import React, { useState, useEffect, useRef } from 'react';

const CollaborationPanel = ({ messages, activeUsers, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return messageTime.toLocaleDateString();
  };

  return (
    <div className="card card-large">
      <h2>💬 Team Chat</h2>
      
      {/* Active Users */}
      <div className="user-list">
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
          👥 Online ({activeUsers.length})
        </h3>
        {activeUsers.map(user => (
          <div key={user.id} className="user-item">
            <div className="user-status"></div>
            <span className="user-name">
              {user.username}
              {user.id === currentUser.id && ' (You)'}
            </span>
          </div>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '2rem',
              fontStyle: 'italic'
            }}>
              💭 No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className="chat-message">
                <div className="message-header">
                  <span className="message-username">
                    {message.username}
                    {message.username === currentUser.username && ' (You)'}
                  </span>
                  <span className="message-time" title={new Date(message.timestamp).toLocaleString()}>
                    {getTimeAgo(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            maxLength={500}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!newMessage.trim()}
          >
            📤
          </button>
        </form>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>⚡ Quick Messages</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            '👋 Hello team!',
            '✅ Task completed!',
            '🆘 Need help',
            '☕ Taking a break',
            '🎯 Starting focus session',
            '🎉 Great work!'
          ].map(quickMessage => (
            <button
              key={quickMessage}
              onClick={() => onSendMessage(quickMessage)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #ddd',
                background: 'white',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f0f8ff';
                e.target.style.borderColor = '#667eea';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#ddd';
              }}
            >
              {quickMessage}
            </button>
          ))}
        </div>
      </div>

      {/* Team Activity Summary */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>📈 Team Activity</h4>
        <div style={{ color: '#666' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            💬 {messages.length} messages today
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            👥 {activeUsers.length} members online
          </div>
          <div>
            🕐 Last activity: {messages.length > 0 ? getTimeAgo(messages[messages.length - 1]?.timestamp) : 'No activity'}
          </div>
        </div>
      </div>

      {/* Collaboration Tips */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: '8px',
        fontSize: '0.85rem'
      }}>
        <strong>💡 Collaboration Tips:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>Share progress updates regularly</li>
          <li>Ask for help when stuck</li>
          <li>Celebrate team achievements</li>
          <li>Use @mentions for specific people</li>
        </ul>
      </div>
    </div>
  );
};

export default CollaborationPanel;
