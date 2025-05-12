import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  Rating,
  Stack,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  SCHEDULE_STATUS, 
  normalizeStatus, 
  isValidStatusTransition,
  getStatusLabel 
} from '../utils/statusUtils';

const ConfirmProductionModal = ({ open, onClose, scheduleItem, recipes, onConfirm }) => {
  const [actualQty, setActualQty] = useState(0);
  const [notes, setNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(5);
  const [deviations, setDeviations] = useState([]);
  const [newDeviation, setNewDeviation] = useState('');
  const [packingBatchCode, setPackingBatchCode] = useState('');
  const [batchCodes, setBatchCodes] = useState([]);
  const [sellByDate, setSellByDate] = useState(null);
  const [receivingDate, setReceivingDate] = useState(new Date());
  const [countryOfOrigin, setCountryOfOrigin] = useState('South Africa');
  
  // Find the recipe details based on the scheduleItem's recipeCode
  const recipe = recipes.find(r => r.product_code === scheduleItem?.recipeCode);
  
  // Log for debugging
  useEffect(() => {
    if (scheduleItem) {
      console.log('ConfirmProductionModal received scheduleItem:', scheduleItem);
      console.log('Recipe found:', recipe);
    }
  }, [scheduleItem, recipe]);

  useEffect(() => {
    if (scheduleItem) {
      setActualQty(scheduleItem.plannedQty || 0);
      setNotes('');
      setQualityScore(5);
      setDeviations([]);
      setNewDeviation('');
      setPackingBatchCode('');
      setBatchCodes([]);
      setSellByDate(null);
      setReceivingDate(new Date());
      setCountryOfOrigin('South Africa');
    }
  }, [scheduleItem]);

  const handleAddDeviation = () => {
    if (newDeviation.trim()) {
      setDeviations([...deviations, newDeviation.trim()]);
      setNewDeviation('');
    }
  };

  const handleRemoveDeviation = (index) => {
    setDeviations(deviations.filter((_, i) => i !== index));
  };

  const handleAddBatchCode = () => {
    if (packingBatchCode.trim()) {
      setBatchCodes([...batchCodes, packingBatchCode.trim()]);
      setPackingBatchCode('');
    }
  };

  const handleRemoveBatchCode = (index) => {
    setBatchCodes(batchCodes.filter((_, i) => i !== index));
  };

  const isConfirmDisabled = () => {
    // Check if this is a valid status transition
    const currentStatus = normalizeStatus(scheduleItem?.status);
    const canTransition = scheduleItem ? isValidStatusTransition(currentStatus, SCHEDULE_STATUS.COMPLETED) : false;
    
    return actualQty <= 0 || qualityScore <= 0 || !canTransition;
  };

  const handleConfirm = () => {
    if (!scheduleItem) return;

    // Get the current status and normalize it
    const currentStatus = normalizeStatus(scheduleItem.status);
    const newStatus = SCHEDULE_STATUS.COMPLETED;
    
    // Check if this is a valid status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      alert(`Cannot confirm an item with status: ${getStatusLabel(currentStatus)}`);
      return;
    }
    
    // Format dates properly
    const formattedSellByDate = sellByDate ? sellByDate.toISOString().split('T')[0] : '';
    const formattedReceivingDate = receivingDate ? receivingDate.toISOString().split('T')[0] : '';
    const timestamp = new Date().toISOString();
    
    // Extract ingredient information from recipe and scale quantities based on planned amount
    const plannedQty = Number(scheduleItem.plannedQty) || 1;
    const ingredientList = recipe?.ingredients?.map(ing => {
      // Parse the original recipe use quantity
      const baseQty = Number(ing.recipe_use) || 0;
      // Calculate the scaled quantity based on planned production amount
      const scaledQty = (baseQty * plannedQty).toFixed(3);
      // Return the ingredient description with both original and scaled quantities
      return `${ing.description} (${scaledQty} from base: ${ing.recipe_use})`;
    }) || [];
    const supplierNames = recipe?.ingredients?.map(ing => ing.supplier || '') || [];
    
    // Create batch codes for each ingredient if not provided
    const ingredientBatchCodes = recipe?.ingredients?.map((_, i) => 
      `BATCH-${scheduleItem.recipeCode}-${i+1}-${Date.now().toString().slice(-6)}`) || [];
    
    // Create audit data structure that exactly matches the required format in audit_recipe_form.json
    const auditData = {
      uid: `${scheduleItem.date}-${scheduleItem.recipeCode}-${Date.now()}`,
      department: scheduleItem.department,
      department_manager: scheduleItem.managerName,
      food_handler_responsible: scheduleItem.handlerName,
      packing_batch_code: batchCodes.length > 0 ? batchCodes : [`PKG-${scheduleItem.recipeCode}-${Date.now().toString().slice(-6)}`],
      product_name: [recipe?.description || scheduleItem.recipeCode],
      ingredient_list: ingredientList,
      supplier_name: supplierNames,
      address_of_supplier: recipe?.ingredients?.map(() => 'Supplier Address') || [],
      batch_code: ingredientBatchCodes,
      sell_by_date: recipe?.ingredients?.map(() => formattedSellByDate) || [],
      receiving_date: recipe?.ingredients?.map(() => formattedReceivingDate) || [],
      country_of_origin: recipe?.ingredients?.map(() => countryOfOrigin) || [],
      planned_qty: scheduleItem.plannedQty,
      actual_qty: actualQty,
      notes: notes,
      quality_score: qualityScore,
      deviations: deviations,
      confirmation_timestamp: timestamp,
      productDescription: recipe?.description,
      date: scheduleItem.date,
      status: newStatus
    };

    // Log the audit data for debugging
    console.log('Creating audit data:', auditData);

    // Update the schedule item with the confirmed status
    const updatedScheduleItem = {
      ...scheduleItem,
      actualQty,
      notes,
      qualityScore,
      deviations,
      confirmationTimestamp: timestamp
    };

    onConfirm(updatedScheduleItem, auditData);
    onClose();
  };

  if (!scheduleItem || !recipe) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm Production</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {recipe?.description || scheduleItem.recipeCode}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Planned Quantity:</strong> {scheduleItem.plannedQty}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Handler:</strong> {scheduleItem.handlerName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Manager:</strong> {scheduleItem.managerName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Scheduled Date:</strong> {scheduleItem.date}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Time:</strong> {scheduleItem.startTime} - {scheduleItem.endTime}
              </Typography>
            </Grid>
          </Grid>
          
          {recipe?.ingredients && recipe.ingredients.length > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ingredients (Scaled for {scheduleItem.plannedQty} units):
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ingredient</TableCell>
                      <TableCell align="right">Base Quantity</TableCell>
                      <TableCell align="right">Scaled Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipe.ingredients.map((ing, idx) => {
                      const baseQty = Number(ing.recipe_use) || 0;
                      const plannedQty = Number(scheduleItem.plannedQty) || 1;
                      const scaledQty = (baseQty * plannedQty).toFixed(3);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{ing.description}</TableCell>
                          <TableCell align="right">{ing.recipe_use}</TableCell>
                          <TableCell align="right">{scaledQty}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>Production Details</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Actual Quantity"
              type="number"
              value={actualQty}
              onChange={(e) => setActualQty(Number(e.target.value))}
              fullWidth
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography component="legend">Quality Score</Typography>
              <Rating
                name="quality-score"
                value={qualityScore}
                onChange={(event, newValue) => {
                  setQualityScore(newValue);
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>Deviations</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={9}>
            <TextField
              label="Add Deviation"
              value={newDeviation}
              onChange={(e) => setNewDeviation(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button 
              variant="contained" 
              onClick={handleAddDeviation}
              fullWidth
              sx={{ height: '56px' }}
            >
              Add
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {deviations.map((deviation, index) => (
                <Chip
                  key={index}
                  label={deviation}
                  onDelete={() => handleRemoveDeviation(index)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>Audit Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={9}>
            <TextField
              label="Packing Batch Code"
              value={packingBatchCode}
              onChange={(e) => setPackingBatchCode(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button 
              variant="contained" 
              onClick={handleAddBatchCode}
              fullWidth
              sx={{ height: '56px' }}
            >
              Add
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {batchCodes.map((code, index) => (
                <Chip
                  key={index}
                  label={code}
                  onDelete={() => handleRemoveBatchCode(index)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Sell By Date"
                value={sellByDate}
                onChange={(newValue) => {
                  setSellByDate(newValue);
                }}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Receiving Date"
                value={receivingDate}
                onChange={(newValue) => {
                  setReceivingDate(newValue);
                }}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Country of Origin"
              value={countryOfOrigin}
              onChange={(e) => setCountryOfOrigin(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm Production
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmProductionModal;
