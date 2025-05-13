import React from 'react';
import {
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, IconButton, Tooltip, Button, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * Production Document List component for displaying production documents in a table view
 */
const ProductionDocumentList = ({
  schedules,
  recipes,
  onEdit,
  onDelete,
  onViewHistory,
  onCreateNew,
  accentColor = '#1976d2'
}) => {
  /**
   * Get status chip based on status
   * @param {string} status - Status string
   * @returns {JSX.Element} Status chip component
   */
  const getStatusChip = (status) => {
    let color = 'primary';
    
    switch (status) {
      case 'completed':
        color = 'success';
        break;
      case 'scheduled':
        color = 'warning';
        break;
      case 'cancelled':
        color = 'error';
        break;
      case 'planned':
      default:
        color = 'info';
        break;
    }
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small" 
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          sx={{ bgcolor: accentColor, '&:hover': { bgcolor: accentColor } }}
          onClick={onCreateNew}
        >
          Create New Production
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Recipe</TableCell>
            <TableCell>Handler</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedules && schedules.length > 0 ? (
            // Process schedules with safety checks
            schedules.flatMap(schedule => {
              // Handle the nested structure where schedule might have a "0" property
              const scheduleData = schedule["0"] || schedule;
              const items = scheduleData?.items || [];
              
              return items.map((item, idx) => {
                const recipe = recipes.find(r => r.product_code === item.recipeCode);
                const scheduleId = scheduleData.id || schedule.id || 'unknown';
                
                return (
                  <TableRow key={`${scheduleId}-${idx}`}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      {item.productDescription || recipe?.description || item.recipeCode}
                    </TableCell>
                    <TableCell>{item.handlerName || 'Not assigned'}</TableCell>
                    <TableCell>{item.plannedQty}</TableCell>
                    <TableCell>
                      {item.startTime && item.endTime 
                        ? `${item.startTime} - ${item.endTime}` 
                        : 'Not scheduled'}
                    </TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell align="right">
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
                          onClick={() => onEdit(scheduleData, item, idx)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => onDelete(scheduleData, item, idx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              });
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No production documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductionDocumentList;
