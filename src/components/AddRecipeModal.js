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

const AddRecipeModal = ({ open, onClose, onAddRecipe }) => {
  const [recipeData, setRecipeData] = useState({
    title: '',
    yield: '', // Corresponds to Cost/Yield
  });

  useEffect(() => {
    if (open) {
      setRecipeData({
        title: '',
        yield: '',
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!recipeData.title || !recipeData.yield) {
      // Basic validation: Optionally show an alert or inline error message
      console.error("Recipe Title and Cost/Yield are required.");
      alert("Recipe Title and Cost/Yield are required."); // Simple alert for now
      return;
    }
    onAddRecipe(recipeData);
    onClose(); // Close modal after attempting to add
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Recipe</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Please enter the initial details for your new recipe.
        </DialogContentText>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Recipe Title"
              type="text"
              fullWidth
              variant="outlined"
              value={recipeData.title}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="dense"
              name="yield"
              label="Cost/Yield"
              type="number"
              fullWidth
              variant="outlined"
              value={recipeData.yield}
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
          Create Recipe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRecipeModal;
