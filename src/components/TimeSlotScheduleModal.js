import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { SCHEDULE_STATUS, getStatusLabel } from '../utils/statusUtils';
import useNotifications from '../hooks/useNotifications';
import NotificationSystem from './production/common/NotificationSystem';
import { EVENT_TYPES, bus } from '../utils/eventBus';

/**
 * DEPRECATED: This component has been replaced by UnifiedScheduleModal
 * This file is kept for backward compatibility but forwards props to UnifiedScheduleModal
 * 
 * @deprecated Use UnifiedScheduleModal instead for all scheduling operations
 */
const TimeSlotScheduleModal = (props) => {
  const { open, onClose, eventInfo, slotInfo, onSave } = props;
  
  // Use the notification hook for consistent notifications
  const { notification, closeNotification, showWarning } = useNotifications();
  
  console.warn('TimeSlotScheduleModal is deprecated. Use UnifiedScheduleModal instead.');
  
  // Show a deprecation warning using our notification system
  React.useEffect(() => {
    if (open) {
      showWarning('This component is deprecated. Please use UnifiedScheduleModal instead.');
    }
  }, [open, showWarning]);
  
  // Handle forwarding the save action to the parent with proper data mapping
  const handleForwardSave = () => {
    if (onSave) {
      // Map the old props format to the new format expected by UnifiedScheduleModal
      const mappedData = {
        id: eventInfo?.id,
        recipeCode: eventInfo?.extendedProps?.recipeCode,
        plannedQty: eventInfo?.extendedProps?.plannedQty || 1,
        handlerName: eventInfo?.extendedProps?.handlerName,
        startTime: eventInfo?.start ? new Date(eventInfo.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '',
        endTime: eventInfo?.end ? new Date(eventInfo.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '',
        date: slotInfo?.date || (eventInfo?.start ? new Date(eventInfo.start).toISOString().split('T')[0] : ''),
        status: SCHEDULE_STATUS.SCHEDULED
      };
      
      // Call the onSave function with the mapped data
      onSave(mappedData);
      
      // Close the modal
      if (onClose) {
        onClose();
      }
    }
  };
  
  // Show a simple deprecation notice dialog
  return (
    <Dialog open={!!open} onClose={onClose}>
      <DialogTitle>Component Deprecated</DialogTitle>
      <DialogContent>
        <Typography paragraph>
          This component has been replaced by UnifiedScheduleModal for better functionality.
        </Typography>
        <Typography paragraph>
          The scheduling system has been streamlined to use a single modal component for all operations.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleForwardSave} color="primary" variant="contained">
          Continue Anyway
        </Button>
      </DialogActions>
      
      {/* Add NotificationSystem for consistent notifications */}
      <NotificationSystem 
        notification={notification} 
        onClose={closeNotification} 
      />
    </Dialog>
  );
};

export default TimeSlotScheduleModal;
