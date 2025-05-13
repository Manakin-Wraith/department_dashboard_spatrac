import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Grid, Card, CardContent, 
  Chip, useTheme, alpha
} from '@mui/material';
import { normalizeStatus, getStatusColor } from '../../../utils/statusUtils';
import useNotifications from '../../../hooks/useNotifications';
import NotificationSystem from '../common/NotificationSystem';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Day View Dialog component for displaying all events for a specific day
 */
const DayViewDialog = ({
  open,
  onClose,
  dayEventsData,
  accentColor,
  onEventClick,
  schedules
}) => {
  const theme = useTheme();
  
  // Use the notification hook for consistent notifications
  const { notification, closeNotification } = useNotifications();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        borderBottom: `2px solid ${accentColor}`, 
        color: accentColor 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {dayEventsData?.date ? `Scheduled Events for ${dayEventsData.date}` : 'Scheduled Events'}
          </Typography>
          <Chip 
            label={`${dayEventsData?.events?.length || 0} Events`}
            color="primary"
            size="small"
            sx={{ bgcolor: accentColor }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {dayEventsData?.events?.length > 0 ? (
          <>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Click on any event to view its details
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {dayEventsData.events.map((event, index) => {
                const { status: rawStatus, scheduleId, itemIndex } = event.extendedProps;
                const status = normalizeStatus(rawStatus);
                // Use the centralized getStatusColor utility for consistent status colors
                const statusColor = getStatusColor(status);
                
                return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 2 },
                        borderLeft: `4px solid ${statusColor}`
                      }}
                      onClick={() => {
                        // Find the schedule and item for detailed view
                        const schedule = schedules.find(s => s.id === scheduleId);
                        
                        // Handle the nested structure where schedule might have a "0" property
                        if (schedule) {
                          const scheduleData = schedule["0"] || schedule;
                          const items = scheduleData?.items || [];
                          
                          if (items[itemIndex]) {
                            onEventClick(items[itemIndex]);
                          }
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {event.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - 
                            {event.end ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </Typography>
                        </Box>
                        
                        {event.extendedProps.item?.handlerName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {event.extendedProps.item.handlerName}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={status || 'planned'} 
                            size="small"
                            sx={{ 
                              bgcolor: alpha(statusColor, 0.2),
                              color: alpha(statusColor, 0.8),
                              textTransform: 'capitalize'
                            }}
                          />
                          
                          {event.extendedProps.item?.plannedQty && (
                            <Chip 
                              label={`Qty: ${event.extendedProps.item.plannedQty}`}
                              size="small"
                              sx={{ ml: 1 }}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No scheduled events found for this time period
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try selecting a different date or time range
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          color="primary"
        >
          Close
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

export default DayViewDialog;
