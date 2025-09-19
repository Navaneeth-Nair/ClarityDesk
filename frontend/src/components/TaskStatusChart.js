import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskStatusChart = ({ tasks = [] }) => {
  // Calculate task status distribution
  const getTaskStats = () => {
    const completed = tasks.filter(task => task.completed).length;
    
    // For non-completed tasks, determine if they're "In Progress" or "Not Started"
    const pendingTasks = tasks.filter(task => !task.completed);
    
    // Tasks with deadlines in the future are considered "In Progress"
    // Tasks without deadlines or with past deadlines are "Not Started"
    const inProgress = pendingTasks.filter(task => {
      if (!task.deadline) return false; // No deadline = not started
      const deadline = new Date(task.deadline);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      return taskDate >= today; // Future or today = in progress
    }).length;
    
    const notStarted = pendingTasks.length - inProgress;
    
    return {
      completed,
      inProgress,
      notStarted,
      total: tasks.length
    };
  };

  const stats = getTaskStats();

  // Chart configuration
  const data = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [stats.completed, stats.inProgress, stats.notStarted],
        backgroundColor: [
          '#4caf50', // Green for completed
          '#2196f3', // Blue for in progress
          '#ff9800', // Orange for not started
        ],
        borderColor: [
          '#4caf50',
          '#2196f3',
          '#ff9800',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#66bb6a',
          '#42a5f5',
          '#ffb74d',
        ],
        hoverBorderColor: [
          '#388e3c',
          '#1976d2',
          '#f57c00',
        ],
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
            return `${label}: ${value} tasks (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
    elements: {
      arc: {
        borderJoinStyle: 'round',
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Center text for total tasks
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height, ctx } = chart;
      ctx.restore();
      
      const fontSize = Math.min(width, height) / 8;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Use theme-aware colors
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
      const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';
      
      ctx.fillStyle = primaryColor;
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw total number
      ctx.fillText(stats.total.toString(), centerX, centerY - fontSize / 4);
      
      // Draw "Tasks" label
      ctx.font = `${fontSize / 3}px Arial`;
      ctx.fillStyle = secondaryColor;
      ctx.fillText('Tasks', centerX, centerY + fontSize / 3);
      
      ctx.save();
    },
  };

  // Don't render chart if no tasks
  if (stats.total === 0) {
    return (
      <div className="task-chart-container">
        <div className="no-tasks-chart">
          <div className="no-tasks-icon">📊</div>
          <div className="no-tasks-text">No tasks to display</div>
          <div className="no-tasks-subtext">Create your first task to see the chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-chart-container">
      <div className="chart-header">
        <h4>📊 Task Overview</h4>
        <div className="chart-summary">
          <span className="summary-item">
            <span className="summary-dot completed"></span>
            {stats.completed} Completed
          </span>
          <span className="summary-item">
            <span className="summary-dot in-progress"></span>
            {stats.inProgress} In Progress
          </span>
          <span className="summary-item">
            <span className="summary-dot not-started"></span>
            {stats.notStarted} Not Started
          </span>
        </div>
      </div>
      <div className="chart-wrapper">
        <Doughnut 
          data={data} 
          options={options} 
          plugins={[centerTextPlugin]}
        />
      </div>
    </div>
  );
};

export default TaskStatusChart;