import React from 'react';
import {
  Grid, Card, CardContent, CardActions, Typography, Chip, Button,
  Box, IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { alpha } from '@mui/material/styles';

/**
 * Production Document Card component for displaying production documents in a card view
 */
const ProductionDocumentCard = ({
  schedules = [],
  recipes = [],
  onEdit,
  onDelete,
  onViewHistory,
  onCreateNew,
  accentColor = '#1976d2'
}) => {
  /**
   * Get status color based on status
   * @param {string} status - Status string
   * @returns {string} Color hex code
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50'; // Green
      case 'scheduled':
        return '#ff9800'; // Orange
      case 'cancelled':
        return '#f44336'; // Red
      case 'planned':
      default:
        return '#2196f3'; // Blue
    }
  };

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {schedules && schedules.length > 0 ? (
        schedules.flatMap(schedule => {
          // Handle the nested structure where schedule might have a "0" property
          const scheduleData = schedule["0"] || schedule;
          const items = scheduleData?.items || [];
          
          return items.map((item, idx) => {
            const recipe = recipes.find(r => r.product_code === item.recipeCode);
            const statusColor = getStatusColor(item.status);
            const scheduleId = scheduleData.id || schedule.id || 'unknown';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={`${scheduleId}-${idx}`}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: `4px solid ${statusColor}`
                  }}
                >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                      {item.productDescription || recipe?.description || item.recipeCode}
                    </Typography>
                    <Chip 
                      label={item.status} 
                      size="small" 
                      sx={{ 
                        textTransform: 'capitalize',
                        bgcolor: statusColor,
                        color: '#fff'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Date: {item.date}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.plannedQty}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Handler: {item.handlerName || 'Not assigned'}
                  </Typography>
                  
                  {item.startTime && item.endTime && (
                    <Typography variant="body2" color="text.secondary">
                      Time: {item.startTime} - {item.endTime}
                    </Typography>
                  )}
                  
                  {item.notes && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Notes: {item.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <Tooltip title="View History">
                    <IconButton 
                      size="small" 
                      onClick={() => onViewHistory(item)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(schedule, item, idx)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(schedule, item, idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
        })
        })
      ) : (
        <Grid item xs={12}>
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: alpha(accentColor, 0.05),
              border: `1px dashed ${alpha(accentColor, 0.3)}`,
              borderRadius: 1
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No production documents found
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2, borderColor: accentColor, color: accentColor }}
              onClick={onCreateNew}
            >
              Create New Production
            </Button>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default ProductionDocumentCard;
