// Notification utilities
export const notifyUser = (message, type = 'info') => {
  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = type === 'success' ? '✅ Success' : 
                  type === 'error' ? '❌ Error' : 
                  type === 'warning' ? '⚠️ Warning' : 
                  '📢 Info';
    
    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }

  // In-app notification
  showInAppNotification(message, type);
};

const showInAppNotification = (message, type) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
};

// Request notification permission
export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
};

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Check if notifications are enabled
export const areNotificationsEnabled = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};
