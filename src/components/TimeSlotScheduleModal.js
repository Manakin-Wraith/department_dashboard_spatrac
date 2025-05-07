import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  IconButton
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import CloseIcon from '@mui/icons-material/Close';

// Helper function to format Date object to HH:MM string for saving
const formatToSaveTime = (date) => {
  if (!date || !(date instanceof Date)) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper function to format Date object or ISO string to HH:MM - RETAINED FOR BACKWARD COMPATIBILITY OR IF NEEDED
// const formatTimeToHHMM = (dateInput) => { ... }; // Original helper can be removed or kept if used elsewhere

const TimeSlotScheduleModal = ({
  open,
  onClose,
  eventInfo, // Contains data if an existing event is clicked
  slotInfo,  // Contains data if an empty slot is clicked (date, time)
  recipes = [],
  handlers = [],
  department, // This prop receives deptObj from WeeklySchedulePage
  onSave
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedHandler, setSelectedHandler] = useState('');
  const [startTime, setStartTime] = useState(null); // Store as Date object or null
  const [endTime, setEndTime] = useState(null);   // Store as Date object or null

  useEffect(() => {
    if (open) {
      // Log props when modal opens
      console.log('TimeSlotScheduleModal opened for department:', department);
      console.log('Received recipes:', recipes);
      console.log('Received handlers:', handlers);

      if (eventInfo && eventInfo.start) { // Existing event
        setSelectedRecipe(eventInfo.extendedProps?.recipeCode || '');
        setQuantity(eventInfo.extendedProps?.plannedQty || 1);
        setSelectedHandler(eventInfo.extendedProps?.handlerName || '');
        setStartTime(new Date(eventInfo.start)); 
        setEndTime(eventInfo.end ? new Date(eventInfo.end) : null); 
        console.log('Editing existing event:', eventInfo);
      } else if (slotInfo && slotInfo.date) { // New event from slot click
        const initialStartDate = new Date(slotInfo.date);
        setStartTime(initialStartDate);
        
        const defaultEndDate = new Date(initialStartDate);
        defaultEndDate.setHours(defaultEndDate.getHours() + 1); // Default end time 1 hour later
        setEndTime(defaultEndDate);
        
        setSelectedRecipe('');
        setQuantity(1);
        setSelectedHandler('');
        console.log('Scheduling new event for slot:', slotInfo);
      } else {
        // Reset if no valid info
        setSelectedRecipe('');
        setQuantity(1);
        setSelectedHandler('');
        setStartTime(null);
        setEndTime(null);
      }
    }
  }, [open, eventInfo, slotInfo, recipes, handlers, department]); // Ensure all logged/read props are dependencies

  const handleSave = () => {
    // Basic validation
    if (!selectedRecipe || !selectedHandler || !startTime) {
      alert('Please fill in all required fields: Recipe, Handler, and Start Time.');
      return;
    }

    const scheduleData = {
      recipeCode: selectedRecipe,
      plannedQty: quantity,
      handlerName: selectedHandler,
      startTime: formatToSaveTime(startTime), // Format Date to HH:MM string for saving
      endTime: formatToSaveTime(endTime),     // Format Date to HH:MM string for saving
      // Add date from slotInfo or eventInfo
      date: eventInfo?.start ? new Date(eventInfo.start).toISOString().substring(0,10) : (slotInfo?.date ? new Date(slotInfo.date).toISOString().substring(0,10) : ''),
      // Other relevant data like department, id (if editing)
      id: eventInfo ? eventInfo.id : null // Or a more specific event instance ID
    };
    onSave(scheduleData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  // Determine displayDate more robustly
  let displayDateStr = '';
  if (eventInfo && eventInfo.start) {
    displayDateStr = new Date(eventInfo.start).toLocaleDateString();
  } else if (slotInfo && slotInfo.date) {
    displayDateStr = new Date(slotInfo.date).toLocaleDateString();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography variant="h6" component="div"> 
            {eventInfo ? 'Edit Scheduled Recipe' : 'Schedule New Recipe'}
          </Typography>
          <Typography variant="body1" color="textSecondary"> 
            Date: {displayDateStr}
          </Typography>
        </div>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid md={12}>
            <FormControl fullWidth margin="dense">
              <InputLabel id="recipe-select-label">Recipe</InputLabel>
              <Select
                labelId="recipe-select-label"
                value={selectedRecipe}
                label="Recipe"
                onChange={(e) => setSelectedRecipe(e.target.value)}
              >
                {recipes.map((recipe) => (
                  <MenuItem key={recipe.product_code} value={recipe.product_code}>
                    {recipe.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Quantity and Handler on the same row */}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid md={4}> {/* Quantity takes 1/3 of the row */}
              <TextField
                margin="dense"
                label="Quantity"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid md={8}> {/* Handler takes 2/3 of the row */}
              <FormControl fullWidth margin="dense">
                <InputLabel id="handler-select-label">Handler</InputLabel>
                <Select
                  labelId="handler-select-label"
                  value={selectedHandler}
                  label="Handler"
                  onChange={(e) => setSelectedHandler(e.target.value)}
                >
                  {handlers.map((handler) => (
                    <MenuItem key={handler.id || handler.name} value={handler.name}>
                      {handler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {/* Start Time and End Time on the same row, equally spaced */}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid md={6}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(newValue) => {
                  setStartTime(newValue);
                }}
                slotProps={{ textField: { margin: 'dense', fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
            </Grid>
            <Grid md={6}>
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(newValue) => {
                  setEndTime(newValue);
                }}
                slotProps={{ textField: { margin: 'dense', fullWidth: true, InputLabelProps: { shrink: true } } }}
                minTime={startTime || undefined} // Prevent end time from being before start time
              />
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {eventInfo ? 'Save Changes' : 'Schedule Recipe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeSlotScheduleModal;
