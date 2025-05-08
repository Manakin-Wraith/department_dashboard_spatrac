import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Notification System component for displaying notifications
 */
const NotificationSystem = ({
  notification,
  onClose
}) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={notification.severity || 'info'}
        variant="filled"
        elevation={6}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSystem;
