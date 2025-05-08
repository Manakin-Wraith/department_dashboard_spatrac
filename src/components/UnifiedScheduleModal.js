
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Typography, 
  List, ListItem, useTheme, Stepper, Step, StepLabel
} from '@mui/material';
import { darken } from '@mui/material/styles';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * UnifiedScheduleModal - A combined modal for recipe scheduling and production management
 * This component handles the entire lifecycle of a recipe from planning to completion
 * using a status-based workflow approach.
 * 
 * Status flow: planned -> scheduled -> in-progress -> completed
 * (with cancelled as a possible state at any point)
 */
const UnifiedScheduleModal = ({
  open,
  onClose,
  onSave,
  department,
  recipes = [],
  handlers = [],
  suppliers = [],
  currentItem = null,
  mode = 'schedule', // 'schedule' or 'production'
  currentEventInfo = null,
  currentSlotInfo = null
}) => {
  const theme = useTheme();
  const accentColor = department?.color || theme.palette.primary.main;
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Common fields
  const [recipeCode, setRecipeCode] = useState('');
  const [plannedQty, setPlannedQty] = useState(0);
  const [handlerName, setHandlerName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState('planned'); // New status field: planned, scheduled, in-progress, completed, cancelled
  
  // Schedule-specific fields
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Production-specific fields
  const [actualQty, setActualQty] = useState(0);
  const [qualityScore, setQualityScore] = useState(1);
  const [notes, setNotes] = useState('');
  const [ingredientSuppliers, setIngredientSuppliers] = useState([]);
  const [batchCodes, setBatchCodes] = useState([]);
  const [sellByDates, setSellByDates] = useState([]);
  const [receivingDates, setReceivingDates] = useState([]);
  const [deviations, setDeviations] = useState(['none']);
  
  // Status history tracking
  const [changeHistory, setChangeHistory] = useState([]);
  
  // Helper function to initialize ingredient data based on recipe - wrapped in useCallback to prevent recreation on every render
  const initializeIngredientData = useCallback((recipeCode) => {
    const recipe = recipes.find(r => r.product_code === recipeCode);
    if (recipe && recipe.ingredients) {
      // Initialize empty supplier array for each ingredient
      const initialSuppliers = recipe.ingredients.map(() => '');
      setIngredientSuppliers(initialSuppliers);
      
      // Initialize batch codes, sell-by dates, and receiving dates
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const initialBatchCodes = recipe.ingredients.map((ing, idx) => 
        `BATCH-${recipeCode}-${idx + 1}-${Date.now().toString().slice(-6)}`
      );
      setBatchCodes(initialBatchCodes);
      
      const initialSellByDates = recipe.ingredients.map(() => 
        nextWeek.toISOString().split('T')[0]
      );
      setSellByDates(initialSellByDates);
      
      const initialReceivingDates = recipe.ingredients.map(() => 
        today.toISOString().split('T')[0]
      );
      setReceivingDates(initialReceivingDates);
    }
  }, [recipes]); // Only recreate when recipes changes
  
  // Initialize modal based on mode and current item
  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setActiveTab(0);
      
      // Handle initialization based on the source of data
      if (currentItem) {
        // We have an existing item to edit
        setRecipeCode(currentItem.recipeCode || '');
        setPlannedQty(currentItem.plannedQty || 0);
        setHandlerName(currentItem.handlerName || '');
        setScheduledDate(currentItem.date || '');
        setManagerName(currentItem.managerName || '');
        setStartTime(currentItem.startTime || '');
        setEndTime(currentItem.endTime || '');
        setStatus(currentItem.status || 'planned');
        setChangeHistory(currentItem.changeHistory || []);
        
        // If the item has production data, initialize those fields
        if (currentItem.status === 'scheduled' || currentItem.status === 'in-progress' || currentItem.status === 'completed') {
          setActualQty(currentItem.actualQty || currentItem.plannedQty || 0);
          setQualityScore(currentItem.qualityScore || 1);
          setNotes(currentItem.notes || '');
          setDeviations(currentItem.deviations || ['none']);
          
          // If we have ingredient data, use it
          if (currentItem.ingredientSuppliers) {
            setIngredientSuppliers(currentItem.ingredientSuppliers);
            setBatchCodes(currentItem.batchCodes || []);
            setSellByDates(currentItem.sellByDates || []);
            setReceivingDates(currentItem.receivingDates || []);
          } else {
            // Initialize ingredient data based on the recipe
            initializeIngredientData(currentItem.recipeCode);
          }
        }
      } else if (currentEventInfo) {
        // Editing existing schedule from calendar event
        const { recipeCode: existingCode, plannedQty: existingQty, handlerName: existingHandler, status: existingStatus } = currentEventInfo.extendedProps;
        setRecipeCode(existingCode || '');
        setPlannedQty(existingQty || 0);
        setHandlerName(existingHandler || '');
        setStatus(existingStatus || 'planned');
        
        // Extract times from the event
        const startDate = currentEventInfo.start;
        const endDate = currentEventInfo.end;
        
        if (startDate) {
          setStartTime(`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);
          setScheduledDate(startDate.toISOString().split('T')[0]);
        }
        
        if (endDate) {
          setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
        }
        
        // If we're in production mode, initialize production fields
        if (mode === 'production') {
          // Set status to scheduled if we're moving to production
          if (existingStatus === 'planned') {
            setStatus('scheduled');
          }
          
          setActualQty(existingQty || 0);
          setQualityScore(1);
          setNotes('');
          initializeIngredientData(existingCode);
        }
      } else if (currentSlotInfo) {
        // New schedule from calendar slot
        const { start, end } = currentSlotInfo;
        
        if (start) {
          setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
          setScheduledDate(start.toISOString().split('T')[0]);
        }
        
        if (end) {
          setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
        }
        
        // Set default values for a new item
        setRecipeCode(recipes.length > 0 ? recipes[0].product_code : '');
        setPlannedQty(1);
        setHandlerName(handlers.length > 0 ? handlers[0].name : '');
        setStatus('planned'); // New items start as planned
        setChangeHistory([{
          timestamp: new Date().toISOString(),
          changedBy: 'Current User', // This would come from auth context in a real app
          changes: [{ field: 'created', oldValue: null, newValue: 'new item' }]
        }]);
      }
      
      // Set manager name from department if not already set
      if (!managerName && department?.department_manager) {
        const dm = Array.isArray(department.department_manager) 
          ? department.department_manager[0] 
          : department.department_manager;
        setManagerName(dm);
      }
    }
  }, [open, mode, currentEventInfo, currentSlotInfo, currentItem, recipes, handlers, department, initializeIngredientData, managerName]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle recipe change
  const handleRecipeChange = (value) => {
    setRecipeCode(value);
    initializeIngredientData(value);
  };
  
  // Handle quantity change
  const handleQtyChange = (value) => {
    const numValue = value === '' ? 0 : Number(value);
    setPlannedQty(numValue);
  };
  
  // Handle status transition with guided workflow
  const handleStatusTransition = (newStatus) => {
    // Track the status change in history
    const statusChange = {
      timestamp: new Date().toISOString(),
      changedBy: 'Current User', // This would come from auth context in a real app
      changes: [{ field: 'status', oldValue: status, newValue: newStatus }]
    };
    
    setChangeHistory([...changeHistory, statusChange]);
    setStatus(newStatus);
    
    // Navigate to relevant tab based on new status
    if (newStatus === 'scheduled') {
      // Initialize production fields
      setActualQty(plannedQty);
      setQualityScore(1);
      setNotes('');
      
      // Initialize ingredient data if not already done
      if (ingredientSuppliers.length === 0) {
        initializeIngredientData(recipeCode);
      }
      
      // Show the production data tab
      setActiveTab(2);
    } else if (newStatus === 'completed') {
      // Show the change history tab to display completion
      setActiveTab(3);
    } else if (newStatus === 'cancelled') {
      // Show the change history tab to display cancellation
      setActiveTab(3);
    }
  };
  
  // Handle save with simplified status-based workflow
  const handleSave = () => {
    // Use the current status without automatic changes
    let currentStatus = status;
    
    // If we're in production mode and still in planned status, suggest scheduling
    if (mode === 'production' && status === 'planned') {
      // We'll keep the status as is, but the UI will guide the user to click
      // the Schedule Production button instead of forcing the transition
      console.log('Production mode with planned status - user should use Schedule Production button');
    }
    
    // Get the current recipe for additional data
    const recipe = recipes.find(r => r.product_code === recipeCode);
    
    // Prepare common data fields
    const commonData = {
      id: currentItem?.id || `${scheduledDate}-${recipeCode}-${Date.now()}`,
      recipeCode,
      plannedQty: Number(plannedQty),
      handlerName,
      startTime,
      endTime,
      date: scheduledDate,
      managerName,
      status: currentStatus,
      changeHistory,
      productDescription: recipe?.description || recipeCode
    };
    
    // Add production-specific fields if in a production status
    if (currentStatus === 'scheduled' || currentStatus === 'in-progress' || currentStatus === 'completed') {
      const productionData = {
        ...commonData,
        actualQty: Number(actualQty),
        qualityScore: Number(qualityScore),
        notes,
        ingredientSuppliers,
        batchCodes,
        sellByDates,
        receivingDates,
        deviations,
        confirmationTimestamp: new Date().toISOString()
      };
      
      onSave(productionData);
    } else {
      // Just save the basic scheduling data
      onSave(commonData);
    }
    
    onClose();
  };
  
  // Get the current recipe
  const currentRecipe = recipes.find(r => r.product_code === recipeCode) || {};
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: `2px solid ${accentColor}`, color: accentColor }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {status === 'planned' ? (
              <>
                <EventNoteIcon sx={{ mr: 1 }} />
                {currentEventInfo ? 'Edit Planned Recipe' : 'Plan New Recipe'}
              </>
            ) : status === 'scheduled' ? (
              <>
                <FactCheckIcon sx={{ mr: 1 }} />
                {currentItem ? 'Edit Scheduled Production' : 'Schedule Production'}
              </>
            ) : (
              <>
                <FactCheckIcon sx={{ mr: 1 }} />
                {`${status.charAt(0).toUpperCase() + status.slice(1)} Production`}
              </>
            )}
          </Box>
          
          {/* Status badge */}
          <Box 
            sx={{ 
              bgcolor: status === 'planned' ? 'info.light' : 
                     status === 'scheduled' ? 'warning.light' : 
                     status === 'in-progress' ? 'secondary.light' : 
                     status === 'completed' ? 'success.light' : 'error.light',
              color: '#fff',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            {status}
          </Box>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Basic Information" />
          <Tab label="Recipe Details" />
          {(status === 'scheduled' || status === 'in-progress' || status === 'completed') && 
            <Tab label="Production Data" />}
          <Tab label="Change History" />
        </Tabs>
      </Box>
      
      <DialogContent dividers>
        {/* Tab 1: Basic Information */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Recipe</InputLabel>
                <Select
                  value={recipeCode}
                  onChange={(e) => handleRecipeChange(e.target.value)}
                  label="Recipe"
                >
                  {recipes.map((recipe) => (
                    <MenuItem key={recipe.product_code} value={recipe.product_code}>
                      {recipe.description || recipe.product_code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Planned Quantity"
                type="number"
                fullWidth
                value={plannedQty === 0 ? '0' : plannedQty}
                onChange={(e) => handleQtyChange(e.target.value)}
                onBlur={() => {
                  if (plannedQty === '' || isNaN(plannedQty)) {
                    handleQtyChange(0);
                  }
                }}
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
              />
              
              {(status === 'scheduled' || status === 'in-progress' || status === 'completed') && (
                <TextField
                  label="Actual Quantity"
                  type="number"
                  fullWidth
                  value={actualQty === 0 ? '0' : actualQty}
                  onChange={(e) => setActualQty(e.target.value === '' ? 0 : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                  sx={{ mb: 2 }}
                />
              )}
              
              {/* Status indicator */}
              <Box sx={{ mb: 2, mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Current Status:</Typography>
                <Box 
                  sx={{ 
                    bgcolor: status === 'planned' ? 'info.light' : 
                           status === 'scheduled' ? 'warning.light' : 
                           status === 'completed' ? 'success.light' : 'error.light',
                    color: '#fff',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {status}
                </Box>
              </Box>
              
              {/* Workflow stepper */}
              <Box sx={{ mb: 3, mt: 2 }}>
                <Stepper activeStep={status === 'planned' ? 0 : status === 'scheduled' ? 1 : status === 'completed' ? 2 : -1} alternativeLabel>
                  <Step>
                    <StepLabel>Planned</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Scheduled</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Completed</StepLabel>
                  </Step>
                </Stepper>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Food Handler</InputLabel>
                <Select
                  value={handlerName}
                  onChange={(e) => setHandlerName(e.target.value)}
                  label="Food Handler"
                >
                  {handlers.map((handler, idx) => (
                    <MenuItem key={idx} value={handler.name || handler}>
                      {handler.name || handler}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Department Manager"
                fullWidth
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        {/* Tab 2: Recipe Details */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {currentRecipe.description || recipeCode}
            </Typography>
            
            {currentRecipe.ingredients && currentRecipe.ingredients.length > 0 ? (
              <List>
                {currentRecipe.ingredients.map((ing, idx) => (
                  <ListItem key={idx} divider>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">{ing.description}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Code: {ing.prod_code} | Pack Size: {ing.pack_size}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Base Qty"
                          size="small"
                          value={ing.recipe_use || 0}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Total Qty"
                          size="small"
                          value={(Number(ing.recipe_use || 0) * Number(plannedQty || 0)).toFixed(3)}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                No ingredients found for this recipe.
              </Typography>
            )}
          </Box>
        )}
        
        {/* Tab 3: Production Data (only for production statuses) */}
        {activeTab === 2 && (status === 'scheduled' || status === 'in-progress' || status === 'completed') && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quality Score (1-5)"
                  type="number"
                  fullWidth
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Math.min(5, Math.max(1, Number(e.target.value))))}
                  inputProps={{ min: 1, max: 5 }}
                  helperText="1 = Poor, 5 = Excellent"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Notes"
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any production notes or issues"
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>
              Ingredient Traceability
            </Typography>
            
            {currentRecipe.ingredients && currentRecipe.ingredients.length > 0 ? (
              <List>
                {currentRecipe.ingredients.map((ing, idx) => (
                  <ListItem key={idx} divider>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">{ing.description}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Code: {ing.prod_code} | Required Qty: {(Number(ing.recipe_use || 0) * Number(plannedQty || 0)).toFixed(3)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                          <InputLabel>Supplier</InputLabel>
                          <Select
                            value={ingredientSuppliers[idx] || ''}
                            onChange={(e) => {
                              const newSuppliers = [...ingredientSuppliers];
                              newSuppliers[idx] = e.target.value;
                              setIngredientSuppliers(newSuppliers);
                            }}
                            label="Supplier"
                          >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {suppliers.map((supplier, sidx) => (
                              <MenuItem key={sidx} value={supplier.supplier_name || supplier}>
                                {supplier.supplier_name || supplier}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Batch Code"
                          size="small"
                          fullWidth
                          value={batchCodes[idx] || ''}
                          onChange={(e) => {
                            const newCodes = [...batchCodes];
                            newCodes[idx] = e.target.value;
                            setBatchCodes(newCodes);
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Sell By Date"
                          type="date"
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={sellByDates[idx] || ''}
                          onChange={(e) => {
                            const newDates = [...sellByDates];
                            newDates[idx] = e.target.value;
                            setSellByDates(newDates);
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Receiving Date"
                          type="date"
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={receivingDates[idx] || ''}
                          onChange={(e) => {
                            const newDates = [...receivingDates];
                            newDates[idx] = e.target.value;
                            setReceivingDates(newDates);
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                No ingredients found for this recipe.
              </Typography>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Deviations / Issues
              </Typography>
              
              <TextField
                label="Deviations"
                fullWidth
                multiline
                rows={2}
                value={deviations.join(', ')}
                onChange={(e) => setDeviations(e.target.value.split(',').map(d => d.trim()))}
                placeholder="Enter any deviations or issues, separated by commas"
                helperText="Enter 'none' if there are no deviations"
              />
            </Box>
          </Box>
        )}
        
        {/* Tab 4: Change History */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Change History
            </Typography>
            
            {changeHistory && changeHistory.length > 0 ? (
              <List>
                {changeHistory.map((entry, idx) => (
                  <ListItem key={idx} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" color="primary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle2">
                      Changed by: {entry.changedBy}
                    </Typography>
                    <List dense sx={{ width: '100%' }}>
                      {entry.changes.map((change, changeIdx) => (
                        <ListItem key={changeIdx}>
                          <Typography variant="body2">
                            {change.field === 'created' ? (
                              <strong>Item created</strong>
                            ) : (
                              <>
                                Changed <strong>{change.field}</strong> from "{change.oldValue}" to "{change.newValue}"
                              </>
                            )}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                No change history available for this item.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
        {/* Workflow action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          {status === 'planned' && (
            <Button 
              variant="contained" 
              color="warning"
              onClick={() => handleStatusTransition('scheduled')}
              startIcon={<FactCheckIcon />}
              sx={{ flex: 1, mr: 1 }}
            >
              Schedule Production
            </Button>
          )}
          
          {status === 'scheduled' && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => handleStatusTransition('completed')}
              startIcon={<CheckCircleIcon />}
              sx={{ flex: 1, mr: 1 }}
            >
              Complete Production
            </Button>
          )}
          
          {status !== 'cancelled' && status !== 'completed' && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => handleStatusTransition('cancelled')}
              startIcon={<CancelIcon />}
              sx={{ ...(status === 'planned' || status === 'scheduled' ? { ml: 1 } : { flex: 1 }) }}
            >
              Cancel
            </Button>
          )}
        </Box>
        
        {/* Standard save/close buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Close</Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: accentColor, '&:hover': { bgcolor: darken(accentColor, 0.1) } }}
          >
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedScheduleModal;
