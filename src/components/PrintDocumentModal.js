import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const PrintDocumentModal = ({ open, onClose, schedules, recipes }) => {
  const theme = useTheme();
  const [printReady, setPrintReady] = useState(false);
  
  // Get accent color from first schedule's department if available
  const accentColor = schedules[0]?.color || theme.palette.primary.main;

  useEffect(() => {
    if (open && printReady) {
      // Delay printing to allow the modal to render completely
      const timer = setTimeout(() => {
        window.print();
        setPrintReady(false);
        onClose();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open, printReady, onClose]);

  const handlePrint = () => {
    setPrintReady(true);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          '@media print': {
            boxShadow: 'none',
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            maxHeight: 'none',
            margin: 0
          }
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          borderBottom: `2px solid ${accentColor}`, 
          color: accentColor,
          '@media print': { 
            borderBottom: `2px solid ${accentColor}`,
            color: accentColor,
            padding: '16px'
          }
        }}
      >
        Production Documents
      </DialogTitle>
      
      <DialogContent 
        dividers
        sx={{
          '@media print': {
            padding: '16px'
          }
        }}
      >
        {/* This is only visible when printing */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 1 }}>
          {schedules && schedules.length > 0 ? (
            schedules.flatMap(schedule => {
              // Handle the nested structure where schedule might have a "0" property
              const scheduleData = schedule["0"] || schedule;
              const items = scheduleData?.items || [];
              
              return items.map((item, idx) => {
                const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
                const scheduleId = scheduleData.id || schedule.id || 'unknown';
                
                return (
                  <Box 
                    key={`${scheduleId}-${idx}`} 
                    sx={{ 
                      border: `1px solid ${accentColor}`, 
                      borderRadius: 1, 
                      p: 1, 
                      mb: 2,
                      breakInside: 'avoid' 
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Date: {item.date || scheduleData.weekStartDate}
                  </Typography>
                  <Typography variant="body2">
                    Recipe: {recipe.description || item.productDescription || item.recipeCode}
                  </Typography>
                  <Typography variant="body2">
                    Qty: {item.plannedQty}
                  </Typography>
                  {item.startTime && item.endTime && (
                    <Typography variant="body2">
                      Time: {item.startTime} - {item.endTime}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    Handler: {item.handlerName || scheduleData.handlersNames || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2">
                    Manager: {scheduleData.managerName || 'Not assigned'}
                  </Typography>
                  
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Ingredients:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {recipe.ingredients.map((ing, i) => {
                          const qty = Number(ing.recipe_use) || 0;
                          const planned = Number(item.plannedQty) || 0;
                          const scaled = qty * planned;
                          return (
                            <li key={i}>
                              {ing.description} ({scaled}{ing.unit ? ` ${ing.unit}` : ''})
                            </li>
                          );
                        })}
                      </ul>
                    </Box>
                  )}
                </Box>
              );
            })
            })
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body1">No scheduled items to display</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ '@media print': { display: 'none' } }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ 
            borderColor: theme.palette.grey[300], 
            color: theme.palette.text.secondary
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          sx={{ 
            backgroundColor: accentColor, 
            '&:hover': { 
              backgroundColor: alpha(accentColor, 0.8) 
            } 
          }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintDocumentModal;
