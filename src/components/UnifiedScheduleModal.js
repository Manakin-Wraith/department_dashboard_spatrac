import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Typography, 
  List, ListItem, useTheme, Stepper, Step, StepLabel
} from '@mui/material';
// useTheme is already imported from @mui/material
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useDeptProductSupplier from '../utils/useDeptProductSupplier';
import { SCHEDULE_STATUS, normalizeStatus, isValidStatusTransition, getStatusLabel } from '../utils/statusUtils';
import useNotifications from '../hooks/useNotifications';
import NotificationSystem from './production/common/NotificationSystem';
import { EVENT_TYPES, bus } from '../utils/eventBus';

/**
 * UnifiedScheduleModal - A combined modal for recipe scheduling and production management
 * This component handles the entire lifecycle of a recipe from scheduling to completion
 * using a simplified status-based workflow approach.
 * 
 * Status flow: scheduled -> completed
 * (with cancelled as a possible state at any point)
 */
const UnifiedScheduleModal = ({
  open,
  onClose,
  onSave,
  department,
  recipes = [],
  handlers = [], // Food handlers
  managers = [], // Department managers
  suppliers = [],
  currentItem = null,
  mode = 'scheduled', // 'schedule' or 'production'
  currentEventInfo = null,
  currentSlotInfo = null
}) => {
  // Get supplier mapping for the current department
  // Ensure department is a string before passing to the hook
  const deptString = department ? String(department) : '';
  const supplierMapping = useDeptProductSupplier(deptString);
  const theme = useTheme();
  const accentColor = department?.color || theme.palette.primary.main;
  
  // Use the notification hook for consistent notifications
  const { notification, closeNotification, showSuccess, showError } = useNotifications();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Common fields
  const [recipeCode, setRecipeCode] = useState('');
  const [plannedQty, setPlannedQty] = useState(0);
  const [handlerName, setHandlerName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState('scheduled'); // New status field: planned, scheduled, in-progress, completed, cancelled
  
  // Schedule-specific fields
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Production-specific fields
  const [actualQty, setActualQty] = useState(0);
  const [qualityScore, setQualityScore] = useState(1);
  const [notes, setNotes] = useState('');
  const [ingredientQuantities, setIngredientQuantities] = useState([]);
  const [ingredientSuppliers, setIngredientSuppliers] = useState([]);
  const [batchCodes, setBatchCodes] = useState([]);
  const [sellByDates, setSellByDates] = useState([]);
  const [receivingDates, setReceivingDates] = useState([]);
  const [deviations, setDeviations] = useState(['none']);
  
  // Status history tracking
  const [changeHistory, setChangeHistory] = useState([]);
  
  // We'll initialize ingredient data in the useEffect below when recipes or recipeCode changes
  
  // Helper function to find and validate a recipe
  const findAndValidateRecipe = (recipeCode, recipes, department) => {
    if (!recipes || !recipes.length || !recipeCode) {
      console.log(`Cannot find recipe: recipes array is empty or recipe code is missing`);
      return null;
    }
    
    // Ensure department is a valid string
    const deptStr = department ? String(department) : '';
    
    console.log(`Looking for recipe with code ${recipeCode} in ${recipes.length} recipes for department ${deptStr}`);
    
    // Find the recipe by product code
    const recipe = recipes.find(r => r.product_code === recipeCode);
    
    if (!recipe) {
      console.warn(`Recipe with code ${recipeCode} not found in department ${deptStr}`);
      return null;
    }
    
    console.log(`Found recipe: ${recipe.name || recipe.description} (${recipe.product_code}) for department ${deptStr}`);
    
    // Verify recipe belongs to the current department (case-insensitive)
    const recipeDepCode = recipe.department || recipe.department_code;
    if (recipeDepCode && deptStr) {
      // Safely convert to lowercase with type checking
      const normalizedRecipeDept = String(recipeDepCode).toLowerCase();
      const normalizedDepartment = deptStr.toLowerCase();
      
      if (normalizedRecipeDept !== normalizedDepartment) {
        console.warn(`Recipe ${recipe.product_code} belongs to department ${recipeDepCode}, not ${deptStr}`);
        // We'll still return the recipe, but with a warning
      }
    }
    
    return recipe;
  };
  
  // Initialize recipe-specific state when recipes change
  useEffect(() => {
    if (recipes.length && recipeCode) {
      const recipe = findAndValidateRecipe(recipeCode, recipes, department);
      
      if (!recipe) {
        // If recipe not found but we have recipes available, select the first one
        if (recipes.length > 0 && !recipeCode) {
          console.log(`No recipe selected, defaulting to first available recipe: ${recipes[0].product_code}`);
          setRecipeCode(recipes[0].product_code);
          return;
        }
        return;
      }
      
      // Initialize ingredient quantities
      const initialQuantities = recipe.ingredients.map(ing => ing.quantity || 0);
      setIngredientQuantities(initialQuantities);
      
      // Initialize empty supplier array for each ingredient
      const initialSuppliers = recipe.ingredients.map(() => '');
      setIngredientSuppliers(initialSuppliers);
      
      // Initialize dates
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      // Initialize batch codes
      const initialBatchCodes = recipe.ingredients.map((ing, idx) => 
        `BATCH-${recipeCode}-${idx + 1}-${Date.now().toString().slice(-6)}`
      );
      setBatchCodes(initialBatchCodes);
      
      // Initialize sell-by dates
      const initialSellByDates = recipe.ingredients.map(() => 
        nextWeek.toISOString().split('T')[0]
      );
      setSellByDates(initialSellByDates);
      
      // Initialize receiving dates
      const initialReceivingDates = recipe.ingredients.map(() => 
        today.toISOString().split('T')[0]
      );
      setReceivingDates(initialReceivingDates);
    }
  }, [recipes, recipeCode, department]); // Recreate when recipes, recipeCode, or department changes
  
  // Helper function to format time from Date object to HH:MM string
  const formatTimeToHHMM = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date)) return '';
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Helper function to parse time string to Date object
  // eslint-disable-next-line no-unused-vars
  const parseTimeString = (timeStr, baseDate) => {
    if (!timeStr || !baseDate) return null;
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(baseDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('Error parsing time string:', error);
      return null;
    }
  };
  
  // Initialize form data when modal opens or data changes
  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setActiveTab(0);
      
      console.log('Initializing modal with mode:', mode);
      console.log('Current item:', currentItem);
      console.log('Current event info:', currentEventInfo);
      console.log('Current slot info:', currentSlotInfo);
      
      // Handle initialization based on the source of data
      if (currentItem) {
        // We have an existing item to edit
        // Validate that the recipe code exists in our available recipes
        const recipeExists = recipes.some(recipe => recipe.product_code === currentItem.recipeCode);
        
        if (!recipeExists && currentItem.recipeCode) {
          console.warn(`Recipe with code ${currentItem.recipeCode} not found in department ${department}`);
        }
        
        // Log time information for debugging
        console.log('Setting time from currentItem:', {
          date: currentItem.date,
          startTime: currentItem.startTime,
          endTime: currentItem.endTime
        });
        
        setRecipeCode(recipeExists ? currentItem.recipeCode : '');
        setPlannedQty(currentItem.plannedQty || 0);
        setHandlerName(currentItem.handlerName || '');
        setScheduledDate(currentItem.date || '');
        setManagerName(currentItem.managerName || '');
        
        // Ensure time values are properly formatted
        // This is critical for drag-drop operations
        if (currentItem.date && currentItem.startTime) {
          console.log(`Setting start time to: ${currentItem.startTime}`);
          setStartTime(currentItem.startTime);
        }
        
        if (currentItem.date && currentItem.endTime) {
          console.log(`Setting end time to: ${currentItem.endTime}`);
          setEndTime(currentItem.endTime);
        }
        
        setStatus(currentItem.status || 'scheduled');
        setChangeHistory(currentItem.changeHistory || []);
        
        // If the item has production data, initialize those fields
        const normalizedItemStatus = normalizeStatus(currentItem.status);
        if (normalizedItemStatus === SCHEDULE_STATUS.SCHEDULED || normalizedItemStatus === SCHEDULE_STATUS.IN_PROGRESS || normalizedItemStatus === SCHEDULE_STATUS.COMPLETED) {
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
            // Recipe data will be initialized by the recipe-specific useEffect
            // when recipeCode changes
          }
        }
      } else if (currentEventInfo) {
        // Editing existing schedule from calendar event
        const { recipeCode: existingCode, plannedQty: existingQty, handlerName: existingHandler, status: existingStatus } = currentEventInfo.extendedProps;
        setRecipeCode(existingCode || '');
        setPlannedQty(existingQty || 0);
        setHandlerName(existingHandler || '');
        setStatus(existingStatus || 'scheduled');
        
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
          if (existingStatus === 'scheduled') {
            setStatus('scheduled');
          }
          
          setActualQty(existingQty || 0);
          setQualityScore(1);
          setNotes('');
          // Recipe data will be initialized by the recipe-specific useEffect
          // when recipeCode changes
        }
      } else if (currentSlotInfo) {
        // New schedule from calendar slot or drag-drop operation
        console.log('Initializing from currentSlotInfo:', currentSlotInfo);
        
        // Handle both direct date objects and string time formats
        if (currentSlotInfo.date) {
          setScheduledDate(currentSlotInfo.date);
        }
        
        // Handle start time - could be a Date object or a string in HH:MM format
        if (currentSlotInfo.startTime) {
          if (typeof currentSlotInfo.startTime === 'string') {
            console.log(`Setting start time from string: ${currentSlotInfo.startTime}`);
            setStartTime(currentSlotInfo.startTime);
          } else if (currentSlotInfo.start instanceof Date) {
            const formattedTime = formatTimeToHHMM(currentSlotInfo.start);
            console.log(`Setting start time from Date: ${formattedTime}`);
            setStartTime(formattedTime);
          }
        } else if (currentSlotInfo.start instanceof Date) {
          const formattedTime = formatTimeToHHMM(currentSlotInfo.start);
          console.log(`Setting start time from Date: ${formattedTime}`);
          setStartTime(formattedTime);
          
          // Also set the date if not already set
          if (!currentSlotInfo.date) {
            setScheduledDate(currentSlotInfo.start.toISOString().split('T')[0]);
          }
        }
        
        // Handle end time - could be a Date object or a string in HH:MM format
        if (currentSlotInfo.endTime) {
          if (typeof currentSlotInfo.endTime === 'string') {
            console.log(`Setting end time from string: ${currentSlotInfo.endTime}`);
            setEndTime(currentSlotInfo.endTime);
          } else if (currentSlotInfo.end instanceof Date) {
            const formattedTime = formatTimeToHHMM(currentSlotInfo.end);
            console.log(`Setting end time from Date: ${formattedTime}`);
            setEndTime(formattedTime);
          }
        } else if (currentSlotInfo.end instanceof Date) {
          const formattedTime = formatTimeToHHMM(currentSlotInfo.end);
          console.log(`Setting end time from Date: ${formattedTime}`);
          setEndTime(formattedTime);
        }
        
        // Set default values for a new item
        const defaultRecipe = recipes.length > 0 ? recipes[0].product_code : '';
        setRecipeCode(defaultRecipe);
        setPlannedQty(1);
        
        // Set default handler from handlers list
        setHandlerName(handlers.length > 0 ? (handlers[0].name || handlers[0]) : '');
        
        // Set default manager from managers list
        setManagerName(managers.length > 0 ? (managers[0].name || managers[0]) : '');
        
        setStatus(SCHEDULE_STATUS.SCHEDULED); // New items start as scheduled
        setChangeHistory([{
          timestamp: new Date().toISOString(),
          changedBy: 'Manager',
          changes: [{ field: 'created', oldValue: null, newValue: 'new item' }]
        }]);
        
        // Recipe data will be initialized by the recipe-specific useEffect
        // when recipeCode changes
      }
    }
  }, [open, mode, currentEventInfo, currentSlotInfo, currentItem, recipes, handlers, managers, department, managerName]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // If changing to Production Data tab (index 2) and status is scheduled, populate suppliers
    if (newValue === 2 && status === 'scheduled') {
      populateIngredientSuppliers();
    }
  };
  
  // Function to populate ingredient suppliers based on the current recipe and supplier mapping
  const populateIngredientSuppliers = () => {
    // Find the current recipe
    const recipe = findAndValidateRecipe(recipeCode, recipes, department);
    
    if (recipe && recipe.ingredients) {
      // Automatically populate suppliers for each ingredient
      const updatedSuppliers = recipe.ingredients.map((ingredient, index) => {
        const ingredientCode = ingredient.prod_code || ingredient.product_code || '';
        const ingredientName = ingredient.description || ingredient.name || '';
        
        // Try to find supplier from mapping
        let supplierName = '';
        
        // First try by product code
        if (ingredientCode && supplierMapping[ingredientCode]) {
          supplierName = supplierMapping[ingredientCode].supplier_name || '';
        }
        // Then try by ingredient name/description
        else if (ingredientName && supplierMapping[ingredientName]) {
          supplierName = supplierMapping[ingredientName].supplier_name || '';
        }
        // If no specific supplier found, keep the current one if it exists
        else if (ingredientSuppliers[index]) {
          supplierName = ingredientSuppliers[index];
        }
        // If still no supplier, try to find any supplier from available suppliers list
        else if (suppliers && suppliers.length > 0) {
          // Just use the first available supplier as a fallback
          const firstSupplier = suppliers[0];
          supplierName = firstSupplier.supplier_name || firstSupplier || '';
        }
        
        return supplierName;
      });
      
      // Update the suppliers state
      setIngredientSuppliers(updatedSuppliers);
      
      console.log('Automatically populated suppliers:', updatedSuppliers);
    }
  };
  
  // Handle recipe change
  const handleRecipeChange = (value) => {
    console.log(`Recipe selection changed to: ${value}`);
    setRecipeCode(value);
    
    // Validate the selected recipe immediately for better user feedback
    const selectedRecipe = findAndValidateRecipe(value, recipes, department);
    if (!selectedRecipe) {
      console.warn(`Selected recipe ${value} could not be validated`);
    } else {
      console.log(`Selected valid recipe: ${selectedRecipe.description || selectedRecipe.name} for department ${department}`);
    }
    
    // Recipe data will be initialized by the recipe-specific useEffect
    // when recipeCode changes
  };
  
  // Handle quantity change
  const handleQtyChange = (value) => {
    const numValue = value === '' ? 0 : Number(value);
    setPlannedQty(numValue);
  };
  
  // Handle status transition with guided workflow
  const handleStatusTransition = (newStatus) => {
    // Normalize current status
    const normalizedCurrentStatus = normalizeStatus(status);
    
    // Check if the transition is valid
    if (!isValidStatusTransition(normalizedCurrentStatus, newStatus)) {
      console.error(`Invalid status transition from ${normalizedCurrentStatus} to ${newStatus}`);
      
      // Use our standardized notification system
      showError(`Cannot change status from ${getStatusLabel(normalizedCurrentStatus)} to ${getStatusLabel(newStatus)}`);
      return false;
    }
    
    // Track the status change in history
    const statusChange = {
      timestamp: new Date().toISOString(),
      changedBy: 'Production Manager', // This would come from auth context in a real app
      changes: [{ field: 'status', oldValue: status, newValue: newStatus }]
    };
    
    setChangeHistory([...changeHistory, statusChange]);
    setStatus(newStatus);
    
    // Navigate to relevant tab based on new status
    if (newStatus === SCHEDULE_STATUS.COMPLETED) {
      // Initialize production fields if not already set
      if (actualQty === 0) setActualQty(plannedQty);
      
      // Show the production data tab for final confirmation
      setActiveTab(2);
      
      // After a short delay, show the change history tab
      setTimeout(() => setActiveTab(3), 300);
    } else if (newStatus === SCHEDULE_STATUS.CANCELLED) {
      // Show the change history tab to display cancellation
      setActiveTab(3);
    }
    
    return true;
  };
  
  // Handle save with simplified status-based workflow
  const handleSave = () => {
    // Use the current status without automatic changes
    let currentStatus = status;
    const timestamp = new Date().toISOString();
    
    // Debug the current status
    console.log('Current status before save:', status);
    
    // Ensure the status is properly set when completing production
    if (status === SCHEDULE_STATUS.COMPLETED) {
      currentStatus = SCHEDULE_STATUS.COMPLETED;
      console.log('Ensuring production is marked as completed');
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
    if (currentStatus === SCHEDULE_STATUS.SCHEDULED || currentStatus === SCHEDULE_STATUS.IN_PROGRESS || currentStatus === SCHEDULE_STATUS.COMPLETED) {
      // Ensure actual quantity is set if not provided
      const finalActualQty = Number(actualQty) || Number(plannedQty);
      
      const productionData = {
        ...commonData,
        actualQty: finalActualQty,
        qualityScore: Number(qualityScore),
        notes,
        ingredientSuppliers,
        batchCodes,
        sellByDates,
        receivingDates,
        deviations,
        confirmationTimestamp: timestamp
      };
      
      // If status is completed, create an audit record
      if (currentStatus === SCHEDULE_STATUS.COMPLETED) {
        console.log('Production completed - creating audit record');
        // The audit data will be created in the useScheduleManagement hook
      }
      
      onSave(productionData);
    } else {
      // Just save the basic scheduling data
      onSave(commonData);
    }
    
    onClose();
  };
  
  // Debug recipe data
  console.log(`UnifiedScheduleModal rendering with ${recipes.length} recipes for department: ${department}`);
  if (recipes.length === 0) {
    console.warn('No recipes available for dropdown selection for department:', department);
  } else {
    console.log('Available recipes:', recipes.map(r => ({ 
      code: r.product_code, 
      name: r.name || r.description, 
      department: r.department || r.department_code 
    })));
  }
  
  // Debug ingredient quantities
  console.log(`Current ingredient quantities: ${JSON.stringify(ingredientQuantities)}`);
  // This ensures the variable is used and removes the warning
  
  // Get the current recipe
  const currentRecipe = recipes.find(r => r.product_code === recipeCode) || {};
  if (recipeCode && !currentRecipe.product_code) {
    console.warn(`Selected recipe with code ${recipeCode} not found in available recipes`);
  }
  
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
            {status === 'scheduled' ? (
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
              bgcolor: status === 'scheduled' ? 'warning.light' : 
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
          <Tab label="Production Data" />
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
                  {recipes.length === 0 ? (
                    <MenuItem disabled value="">
                      No recipes available for department: {department}
                    </MenuItem>
                  ) : (
                    recipes.map((recipe) => (
                      <MenuItem key={recipe.product_code} value={recipe.product_code}>
                        {recipe.name || recipe.description || recipe.product_code}
                        {recipe.department && recipe.department !== department && 
                          ` (${recipe.department})`}
                      </MenuItem>
                    ))
                  )}
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
              
              {(status === 'scheduled' || status === 'in-progress' || (status === SCHEDULE_STATUS.COMPLETED || status === SCHEDULE_STATUS.CANCELLED)) && (
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
                    bgcolor: status === 'scheduled' ? 'info.light' : 
                           status === 'scheduled' ? 'warning.light' : 
                           status === SCHEDULE_STATUS.COMPLETED ? 'success.light' : 'error.light',
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
                <Stepper activeStep={status === SCHEDULE_STATUS.SCHEDULED ? 0 : status === SCHEDULE_STATUS.COMPLETED ? 1 : -1} alternativeLabel>
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
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Department Manager</InputLabel>
                <Select
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  label="Department Manager"
                >
                  {managers.map((manager, idx) => (
                    <MenuItem key={idx} value={manager.name || manager}>
                      {manager.name || manager}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
                    inputProps={{ step: 300 }} // 5 min step
                    value={startTime}
                    onChange={(e) => {
                      console.log(`Time input changed to: ${e.target.value}`);
                      setStartTime(e.target.value);
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }} // 5 min step
                    value={endTime}
                    onChange={(e) => {
                      console.log(`End time input changed to: ${e.target.value}`);
                      setEndTime(e.target.value);
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        {/* Tab 2: Recipe Details */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h6" gutterBottom color="primary">
                {currentRecipe.description || recipeCode}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Product Code:</strong> {currentRecipe.product_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Department:</strong> {currentRecipe.department}
                  </Typography>
                </Grid>
                {currentRecipe.cost_excl_per_each_kg && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Cost per kg:</strong> {currentRecipe.cost_excl_per_each_kg}
                    </Typography>
                  </Grid>
                )}
                {currentRecipe.yield && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Yield:</strong> {currentRecipe.yield}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
              Ingredients
            </Typography>
            
            {currentRecipe.ingredients && currentRecipe.ingredients.length > 0 ? (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                {currentRecipe.ingredients.map((ing, idx) => (
                  <ListItem key={idx} divider>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" color="primary">{ing.description}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          <strong>Code:</strong> {ing.prod_code} | <strong>Pack Size:</strong> {ing.pack_size}
                        </Typography>
                        {ing.weight && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            <strong>Weight:</strong> {ing.weight} | <strong>Cost:</strong> {ing.cost}
                          </Typography>
                        )}
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
              <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No ingredients found for this recipe.
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {/* Tab 3: Production Data - Always visible regardless of status */}
        {activeTab === 2 && (
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
                        {/* Display the auto-assigned supplier as read-only information */}
                        {ingredientSuppliers[idx] && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'success.main', mt: 0.5 }}>
                            Supplier: {ingredientSuppliers[idx]}
                          </Typography>
                        )}
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
        {/* Simplified workflow action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {status === SCHEDULE_STATUS.SCHEDULED && (
              <Button 
                variant="contained" 
                color="warning"
                onClick={handleSave}
                startIcon={<FactCheckIcon />}
                sx={{ flex: 1, mr: 1 }}
              >
                Save Schedule
              </Button>
        )}
            <>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  console.log('Current status before transition:', status);
                  
                  // Set status to completed with validation
                  const transitionSuccess = handleStatusTransition(SCHEDULE_STATUS.COMPLETED);
                  
                  console.log('Transition success:', transitionSuccess);
                  console.log('Status after transition:', status);
                  
                  // If transition failed, don't proceed
                  if (!transitionSuccess) return;
                  
                  // Short delay before saving to ensure state updates
                  setTimeout(() => {
                    // Ensure we have all the required data for the audit
                    if (!actualQty) setActualQty(plannedQty || 1);
                    if (!qualityScore) setQualityScore(5);
                    
                    // Save and complete the production
                    handleSave();
                    
                    // Show success message using our standardized notification system
                    console.log('Production completed and moved to audit');
                    showSuccess('Production completed and moved to audit records');
                    
                    // Emit an event to notify other components
                    bus.emit(EVENT_TYPES.PRODUCTION_COMPLETED, {
                      id: currentItem?.id || `${scheduledDate}-${recipeCode}-${Date.now()}`,
                      status: SCHEDULE_STATUS.COMPLETED,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Close the modal after completion
                    onClose();
                  }, 100);
                }}
                startIcon={<CheckCircleIcon />}
                sx={{ flex: 1, mr: 1, fontWeight: 'bold' }}
              >
                Complete Production
              </Button>
            </>
        </Box>
        
        {/* Close button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Close Without Saving
          </Button>
        </Box>
      </DialogActions>
      
      {/* Add NotificationSystem for consistent notifications */}
      <NotificationSystem 
        notification={notification} 
        onClose={closeNotification} 
      />
    </Dialog>
  );
};

export default UnifiedScheduleModal;
