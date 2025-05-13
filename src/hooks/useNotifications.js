import { useState, useCallback, useEffect } from 'react';
import { bus } from '../utils/eventBus';

/**
 * Custom hook for managing notifications
 * @returns {Object} Notification state and functions
 */
const useNotifications = () => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} severity - Notification severity (success, error, warning, info)
   */
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  /**
   * Close the notification
   */
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);
  
  // Listen for global toast notifications via event bus
  useEffect(() => {
    const handleToast = (toastData) => {
      showNotification(toastData.message, toastData.severity);
    };
    
    bus.on('show-toast', handleToast);
    
    return () => {
      bus.off('show-toast', handleToast);
    };
  }, [showNotification]);

  /**
   * Show a success notification
   * @param {string} message - Success message
   */
  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  }, [showNotification]);

  /**
   * Show an error notification
   * @param {string} message - Error message
   */
  const showError = useCallback((message) => {
    showNotification(message, 'error');
  }, [showNotification]);

  /**
   * Show a warning notification
   * @param {string} message - Warning message
   */
  const showWarning = useCallback((message) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  /**
   * Show an info notification
   * @param {string} message - Info message
   */
  const showInfo = useCallback((message) => {
    showNotification(message, 'info');
  }, [showNotification]);

  return {
    notification,
    showNotification,
    closeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotifications;
