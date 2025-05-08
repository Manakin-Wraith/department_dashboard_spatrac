import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, FormControl, InputLabel, Select,
  Typography, Box, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Unified Schedule Modal component for scheduling and managing production
 */
const UnifiedScheduleModal = ({
  open,
  onClose,
  onSave,
  mode = 'schedule', // 'schedule' or 'production'
  item = null,
  recipes = [],
  handlers = [],
  department = ''
}) => {
  // Form state
  const [formData, setFormData] = useState({
    recipeCode: '',
    plannedQty: 1,
    handlerName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    status: 'planned',
    notes: '',
    actualQty: '',
    qualityScore: 1,
    deviations: '',
    batchCodes: [],
    sellByDates: [],
    receivingDates: []
  });
  
  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        recipeCode: item.recipeCode || '',
        plannedQty: item.plannedQty || 1,
        handlerName: item.handlerName || '',
        date: item.date || new Date().toISOString().split('T')[0],
        startTime: item.startTime || '09:00',
        endTime: item.endTime || '17:00',
        status: item.status || 'planned',
        notes: item.notes || '',
        actualQty: item.actualQty || item.plannedQty || '',
        qualityScore: item.qualityScore || 1,
        deviations: item.deviations || '',
        batchCodes: item.batchCodes || [],
        sellByDates: item.sellByDates || [],
        receivingDates: item.receivingDates || []
      });
    } else {
      // Reset form for new items
      setFormData({
        recipeCode: '',
        plannedQty: 1,
        handlerName: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        status: 'planned',
        notes: '',
        actualQty: '',
        qualityScore: 1,
        deviations: '',
        batchCodes: [],
        sellByDates: [],
        receivingDates: []
      });
    }
  }, [item]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    if (date) {
      setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    }
  };
  
  // Handle time change
  const handleTimeChange = (time, field) => {
    if (time) {
      const timeString = time.toTimeString().substring(0, 5);
      setFormData(prev => ({ ...prev, [field]: timeString }));
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    onSave(formData);
  };
  
  // Get the selected recipe
  const selectedRecipe = recipes.find(r => r.product_code === formData.recipeCode);
  
  // Determine if we're in edit mode
  const isEditMode = !!item;
  
  // Determine if we're in production mode
  const isProductionMode = mode === 'production';
  
  // Determine modal title
  const getModalTitle = () => {
    if (isProductionMode) {
      return isEditMode ? 'Edit Production Details' : 'Record Production';
    } else {
      return isEditMode ? 'Edit Schedule' : 'Schedule Production';
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getModalTitle()}</DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Recipe Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Recipe</InputLabel>
              <Select
                name="recipeCode"
                value={formData.recipeCode}
                onChange={handleChange}
                label="Recipe"
                disabled={isEditMode && isProductionMode}
              >
                {recipes.map(recipe => (
                  <MenuItem key={recipe.product_code} value={recipe.product_code}>
                    {recipe.description || recipe.product_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Planned Quantity */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="plannedQty"
              label="Planned Quantity"
              type="number"
              fullWidth
              margin="normal"
              value={formData.plannedQty}
              onChange={handleChange}
              disabled={isEditMode && isProductionMode}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          
          {/* Handler */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Handler</InputLabel>
              <Select
                name="handlerName"
                value={formData.handlerName}
                onChange={handleChange}
                label="Handler"
              >
                {handlers.map(handler => (
                  <MenuItem key={handler.id} value={handler.name}>
                    {handler.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Date */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date ? new Date(formData.date) : null}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" />
                )}
                disabled={isEditMode && isProductionMode}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Time Range (for scheduling) */}
          {!isProductionMode && (
            <>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime ? new Date(`2022-01-01T${formData.startTime}:00`) : null}
                    onChange={(time) => handleTimeChange(time, 'startTime')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime ? new Date(`2022-01-01T${formData.endTime}:00`) : null}
                    onChange={(time) => handleTimeChange(time, 'endTime')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
          
          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Notes"
              multiline
              rows={2}
              fullWidth
              margin="normal"
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
          
          {/* Production Details (only shown in production mode or when status is completed) */}
          {(isProductionMode || formData.status === 'completed') && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="subtitle2">Production Details</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="actualQty"
                  label="Actual Quantity"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={formData.actualQty}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Quality Score</InputLabel>
                  <Select
                    name="qualityScore"
                    value={formData.qualityScore}
                    onChange={handleChange}
                    label="Quality Score"
                  >
                    <MenuItem value={1}>1 - Poor</MenuItem>
                    <MenuItem value={2}>2 - Below Average</MenuItem>
                    <MenuItem value={3}>3 - Average</MenuItem>
                    <MenuItem value={4}>4 - Good</MenuItem>
                    <MenuItem value={5}>5 - Excellent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="deviations"
                  label="Deviations/Issues"
                  multiline
                  rows={2}
                  fullWidth
                  margin="normal"
                  value={formData.deviations}
                  onChange={handleChange}
                  placeholder="Enter any deviations or issues encountered during production"
                />
              </Grid>
            </>
          )}
          
          {/* Recipe Details (if a recipe is selected) */}
          {selectedRecipe && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recipe Details
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Code: {selectedRecipe.product_code}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Description: {selectedRecipe.description}
                </Typography>
                
                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Ingredients:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {selectedRecipe.ingredients.map((ing, idx) => {
                        const qty = Number(ing.recipe_use) || 0;
                        const planned = Number(formData.plannedQty) || 0;
                        const scaled = qty * planned;
                        
                        return (
                          <li key={idx}>
                            {ing.description} ({scaled}{ing.unit ? ` ${ing.unit}` : ''})
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEditMode ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedScheduleModal;
