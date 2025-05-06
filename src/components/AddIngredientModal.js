import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Grid,
} from '@mui/material';

const AddIngredientModal = ({ open, onClose, onAddIngredient }) => {
  const [ingredientData, setIngredientData] = useState({
    description: '', // Corresponds to Product Name
    prod_code: '',   // Corresponds to Product Code
    qty_used: '',    // Corresponds to Quantity Used
  });

  useEffect(() => {
    // Reset form when modal opens/closes if needed
    if (open) {
      setIngredientData({
        description: '',
        prod_code: '',
        qty_used: '',
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIngredientData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    // Basic validation can be added here if needed
    if (!ingredientData.description || !ingredientData.prod_code || !ingredientData.qty_used) {
      // Optionally, show an alert or inline error message
      console.error("All fields are required for new ingredient.");
      return;
    }
    onAddIngredient(ingredientData);
    onClose(); // Close modal after adding
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Ingredient</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Please enter the details for the new ingredient.
        </DialogContentText>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              name="description"
              label="Product Name"
              type="text"
              fullWidth
              variant="outlined"
              value={ingredientData.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              name="prod_code"
              label="Product Code"
              type="text"
              fullWidth
              variant="outlined"
              value={ingredientData.prod_code}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              name="qty_used"
              label="Quantity Used"
              type="number"
              fullWidth
              variant="outlined"
              value={ingredientData.qty_used}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleAdd} variant="contained" color="primary">
          Add Ingredient
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddIngredientModal;
