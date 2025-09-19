import React, { useState, useEffect } from 'react';

const ProductivityStats = ({ stats, userId, onStatsUpdate }) => {
  const [dailyStats, setDailyStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [focusStats, setFocusStats] = useState([]);

  useEffect(() => {
    fetchDailyStats();
    fetchTrends();
    fetchFocusStats();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(`/api/stats?userId=${userId}&startDate=${getDateDaysAgo(7)}`);
      const data = await response.json();
      setDailyStats(data.dailyStats || []);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await fetch(`/api/stats/trends?userId=${userId}&days=7`);
      const data = await response.json();
      setTrends(data.trends || []);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const fetchFocusStats = async () => {
    try {
      const response = await fetch(`/api/stats/focus?userId=${userId}`);
      const data = await response.json();
      setFocusStats(data.focusStats || []);
    } catch (error) {
      console.error('Error fetching focus stats:', error);
    }
  };

  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return dailyStats.find(stat => stat.date === today) || { tasks_completed: 0 };
  };

  const getWeekTotal = () => {
    return dailyStats.reduce((total, day) => total + (day.tasks_completed || 0), 0);
  };

  const getStreakCount = () => {
    let streak = 0;
    const sortedStats = [...dailyStats].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const stat of sortedStats) {
      if (stat.tasks_completed > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getTotalFocusTime = () => {
    return focusStats.reduce((total, session) => total + (session.total_focus_time || 0), 0);
  };

  const getProductivityTrend = () => {
    if (trends.length < 2) return 'stable';
    const recent = trends.slice(-3).reduce((sum, day) => sum + day.tasks_completed, 0);
    const previous = trends.slice(-6, -3).reduce((sum, day) => sum + day.tasks_completed, 0);
    
    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  };

  const todayStats = getTodayStats();
  const weekTotal = getWeekTotal();
  const streak = getStreakCount();
  const totalFocusHours = Math.round(getTotalFocusTime() / 60);
  const trend = getProductivityTrend();

  return (
    <div className="card card-medium">
      <h2>📊 Productivity Insights</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{todayStats.tasks_completed}</div>
          <div className="stat-label">Today's Tasks</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{weekTotal}</div>
          <div className="stat-label">This Week</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.productivityRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3>📈 Recent Performance</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span>📅 Weekly Overview</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#333' }}>
              {weekTotal} tasks completed
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Average: {Math.round(weekTotal / 7)} per day
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span>⏱️ Focus Time</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#333' }}>
              {totalFocusHours}h total
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {stats.avgFocusTime || 0} min average
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #e3f2fd' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>Productivity Trend</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                Based on last 7 days
              </div>
            </div>
            <div style={{ fontSize: '1.5rem' }}>
              {trend === 'up' ? '📈 Improving' : trend === 'down' ? '📉 Declining' : '📊 Stable'}
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        {dailyStats.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>📅 Daily Breakdown</h4>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1rem' }}>
              {dailyStats.slice(0, 7).map(day => (
                <div key={day.date} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontWeight: '600', color: day.tasks_completed > 0 ? '#4caf50' : '#999' }}>
                    {day.tasks_completed} tasks
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Messages */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {streak > 0 ? `🔥 ${streak} day streak!` : '🎯 Start your streak today!'}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {streak >= 7 ? 'Amazing consistency! Keep it up!' :
             streak >= 3 ? 'Great momentum! You\'re on fire!' :
             streak >= 1 ? 'Good start! Build that habit!' :
             'Complete a task today to start your streak!'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityStats;
