import React, { useState, useEffect } from 'react';

const TaskManager = ({ tasks, user, activeUsers, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    assigned_to: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
      assigned_to: ''
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      assigned_to: formData.assigned_to || user.id
    };

    if (editingTask) {
      onTaskUpdate({ ...editingTask, ...taskData });
    } else {
      onTaskCreate(taskData);
    }

    resetForm();
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      priority: task.priority || 'medium',
      assigned_to: task.assigned_to || ''
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleComplete = (task) => {
    onTaskUpdate({ ...task, completed: task.completed ? 0 : 1 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && !tasks.find(t => t.deadline === deadline)?.completed;
  };

  const getTaskClassName = (task) => {
    let className = 'task-item';
    if (task.completed) className += ' completed';
    if (isOverdue(task.deadline)) className += ' overdue';
    return className;
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="card card-large">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>📋 Task Manager</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? '❌ Cancel' : '➕ Add Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              maxLength={500}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign To</label>
              <select
                className="form-select"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value={user.id}>👤 Myself</option>
                {activeUsers.filter(u => u.id !== user.id).map(u => (
                  <option key={u.id} value={u.id}>👥 {u.username}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingTask ? '💾 Update Task' : '➕ Create Task'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: '2rem' }}>
        {/* Pending Tasks */}
        <div>
          <h3>🎯 Active Tasks ({pendingTasks.length})</h3>
          {pendingTasks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
              🎉 All caught up! No pending tasks.
            </div>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} className={getTaskClassName(task)}>
                <div className="task-header">
                  <div>
                    <div className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {task.description}
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    <button
                      onClick={() => handleComplete(task)}
                      className="task-btn complete"
                      title="Mark as complete"
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => handleEdit(task)}
                      className="task-btn"
                      title="Edit task"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onTaskDelete(task.id)}
                      className="task-btn delete"
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="task-meta">
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                  </span>
                  {task.deadline && (
                    <span style={{ color: isOverdue(task.deadline) ? '#f44336' : '#666' }}>
                      📅 {formatDate(task.deadline)}
                      {isOverdue(task.deadline) && ' (Overdue)'}
                    </span>
                  )}
                  {task.assigned_to_username && (
                    <span>👤 {task.assigned_to_username}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>✅ Completed Tasks ({completedTasks.length})</h3>
            {completedTasks.slice(0, 5).map(task => (
              <div key={task.id} className={getTaskClassName(task)}>
                <div className="task-header">
                  <div>
                    <div className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      onClick={() => handleComplete(task)}
                      className="task-btn"
                      title="Mark as incomplete"
                    >
                      ↩️
                    </button>
                    <button
                      onClick={() => onTaskDelete(task.id)}
                      className="task-btn delete"
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="task-meta">
                  <span style={{ color: '#4caf50' }}>
                    ✅ Completed {formatDate(task.completed_at)}
                  </span>
                  {task.assigned_to_username && (
                    <span>👤 {task.assigned_to_username}</span>
                  )}
                </div>
              </div>
            ))}
            {completedTasks.length > 5 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                And {completedTasks.length - 5} more completed tasks...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
