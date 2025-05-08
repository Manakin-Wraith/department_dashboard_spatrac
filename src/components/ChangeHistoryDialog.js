import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Paper, List, ListItem,
  Divider, Chip, Box, useTheme
} from '@mui/material';
import { formatDistance } from 'date-fns';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';

/**
 * Dialog component to display the change history of a scheduled item
 */
const ChangeHistoryDialog = ({ open, onClose, item, accentColor }) => {
  const theme = useTheme();
  
  if (!item) return null;
  
  // Extract change history or use empty array if not available
  const history = item.changeHistory || [];
  
  // Get recipe description if available
  const recipeCode = item.recipeCode || 'Unknown Recipe';
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: `2px solid ${accentColor}`, color: accentColor }}>
        Change History for {recipeCode}
      </DialogTitle>
      
      <DialogContent dividers>
        {history.length === 0 ? (
          <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
            No change history available for this item.
          </Typography>
        ) : (
          <List>
            {history.map((entry, index) => {
              const isCreation = entry.action === 'created';
              const timeAgo = formatDistance(
                new Date(entry.timestamp),
                new Date(),
                { addSuffix: true }
              );
              
              return (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem alignItems="flex-start">
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center">
                          {isCreation ? (
                            <AddCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                          ) : (
                            <EditIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                          )}
                          <Typography variant="subtitle1" fontWeight="bold">
                            {isCreation ? 'Created' : 'Modified'} by {entry.changedBy}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip 
                            icon={<HistoryIcon />}
                            label={timeAgo}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.background.default }}>
                        {entry.changes.map((change, changeIdx) => (
                          <Box key={changeIdx} mb={1}>
                            <Typography variant="body2" fontWeight="medium" color="text.secondary">
                              {change.field}:
                            </Typography>
                            <Box display="flex" alignItems="center" mt={0.5}>
                              {change.oldValue !== null ? (
                                <>
                                  <Chip 
                                    label={change.oldValue.toString()} 
                                    size="small"
                                    color="default"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                                </>
                              ) : null}
                              <Chip 
                                label={change.newValue.toString()}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          </Box>
                        ))}
                      </Paper>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeHistoryDialog;
