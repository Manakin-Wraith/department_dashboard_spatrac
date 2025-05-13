/**
 * Event bus for application-wide communication
 * Provides a centralized event system for components to communicate
 * without direct dependencies
 */

const listeners = {};

/**
 * Event types - centralizing all event types to avoid typos and ensure consistency
 * @readonly
 * @enum {string}
 */
export const EVENT_TYPES = {
  // Data events
  SCHEDULE_UPDATED: 'schedule-updated',
  SCHEDULE_DELETED: 'schedule-deleted',
  PRODUCTION_COMPLETED: 'production-completed',
  AUDIT_CREATED: 'audit-created',
  DATA_UPDATED: 'data-updated',
  
  // UI events
  SHOW_TOAST: 'show-toast',
  MODAL_CLOSED: 'modal-closed',
  REFRESH_CALENDAR: 'refresh-calendar'
};

/**
 * The event bus implementation
 */
export const bus = {
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  },
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(h => h !== handler);
  },
  
  /**
   * Emit an event with payload
   * @param {string} event - Event name
   * @param {*} payload - Event data
   */
  emit(event, payload) {
    (listeners[event] || []).forEach(h => h(payload));
  },
};

/**
 * Global toast notification function
 * This is kept for backward compatibility but new code should
 * use the useNotifications hook directly
 * @param {Object} toastData - Toast notification data
 * @param {string} toastData.message - Notification message
 * @param {string} toastData.severity - Notification severity (success, error, warning, info)
 */
window.showToast = (toastData) => {
  bus.emit(EVENT_TYPES.SHOW_TOAST, toastData);
};
