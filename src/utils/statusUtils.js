/**
 * Status utilities for managing schedule and production statuses
 * This centralizes all status-related logic to ensure consistency and data integrity
 */

/**
 * Enum for schedule item statuses
 * @readonly
 * @enum {string}
 */
export const SCHEDULE_STATUS = {
  /** Initial status when an item is scheduled */
  SCHEDULED: 'scheduled',
  
  /** Status when production has started but not completed */
  IN_PROGRESS: 'in_progress',
  
  /** Status when production is completed and verified */
  COMPLETED: 'completed',
  
  /** Status when a scheduled item is cancelled */
  CANCELLED: 'cancelled'
};

/**
 * Legacy status mapping - helps with backward compatibility
 * @type {Object.<string, string>}
 */
export const LEGACY_STATUS_MAP = {
  'planned': SCHEDULE_STATUS.SCHEDULED,
};

/**
 * Map of valid status transitions
 * Key: current status, Value: array of valid next statuses
 * @type {Object.<string, Array<string>>}
 */
const VALID_TRANSITIONS = {
  [SCHEDULE_STATUS.SCHEDULED]: [
    SCHEDULE_STATUS.IN_PROGRESS, 
    SCHEDULE_STATUS.COMPLETED, 
    SCHEDULE_STATUS.CANCELLED
  ],
  [SCHEDULE_STATUS.IN_PROGRESS]: [
    SCHEDULE_STATUS.COMPLETED, 
    SCHEDULE_STATUS.CANCELLED
  ],
  [SCHEDULE_STATUS.COMPLETED]: [],
  [SCHEDULE_STATUS.CANCELLED]: []
};

/**
 * Validates if a status transition is allowed
 * @param {string} currentStatus - The current status
 * @param {string} newStatus - The proposed new status
 * @returns {boolean} - Whether the transition is valid
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  // Handle legacy status mapping
  const normalizedCurrentStatus = LEGACY_STATUS_MAP[currentStatus] || currentStatus;
  
  // Check if the transition is valid
  return VALID_TRANSITIONS[normalizedCurrentStatus]?.includes(newStatus) || false;
};

/**
 * Normalizes any status value to ensure it uses the current naming convention
 * @param {string} status - The status to normalize
 * @returns {string} - The normalized status
 */
export const normalizeStatus = (status) => {
  return LEGACY_STATUS_MAP[status] || status;
};

/**
 * Creates a status change history entry
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} changedBy - User who made the change
 * @param {Object} [additionalInfo] - Any additional information to record
 * @returns {Object} - Status change history entry
 */
export const createStatusChangeHistoryEntry = (oldStatus, newStatus, changedBy, additionalInfo = {}) => {
  return {
    timestamp: new Date().toISOString(),
    changedBy,
    changes: [
      {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
        ...additionalInfo
      }
    ]
  };
};

/**
 * Returns the appropriate color for a status
 * @param {string} status - The status
 * @returns {string} - Color code for the status
 */
export const getStatusColor = (status) => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case SCHEDULE_STATUS.SCHEDULED:
      return '#3498db'; // Blue
    case SCHEDULE_STATUS.IN_PROGRESS:
      return '#f39c12'; // Orange
    case SCHEDULE_STATUS.COMPLETED:
      return '#2ecc71'; // Green
    case SCHEDULE_STATUS.CANCELLED:
      return '#e74c3c'; // Red
    default:
      return '#95a5a6'; // Gray for unknown status
  }
};

/**
 * Returns a human-readable label for a status
 * @param {string} status - The status
 * @returns {string} - Human-readable label
 */
export const getStatusLabel = (status) => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case SCHEDULE_STATUS.SCHEDULED:
      return 'Scheduled';
    case SCHEDULE_STATUS.IN_PROGRESS:
      return 'In Progress';
    case SCHEDULE_STATUS.COMPLETED:
      return 'Completed';
    case SCHEDULE_STATUS.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Determines if a schedule item can be edited based on its status
 * @param {string} status - The item's status
 * @returns {boolean} - Whether the item can be edited
 */
export const canEditItem = (status) => {
  const normalizedStatus = normalizeStatus(status);
  return [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.IN_PROGRESS].includes(normalizedStatus);
};

/**
 * Determines if a schedule item can be confirmed (marked as completed)
 * @param {string} status - The item's status
 * @returns {boolean} - Whether the item can be confirmed
 */
export const canConfirmItem = (status) => {
  const normalizedStatus = normalizeStatus(status);
  return [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.IN_PROGRESS].includes(normalizedStatus);
};
