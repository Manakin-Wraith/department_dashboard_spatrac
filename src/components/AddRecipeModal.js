import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Divider
} from '@mui/material';

const AddRecipeModal = ({ open, onClose, onAddRecipe }) => {
  const [recipeData, setRecipeData] = useState({
    title: '',
    yield: '', // Corresponds to Cost/Yield
    description: '', // Additional field for recipe description
    category: '' // Additional field for recipe category
  });

  useEffect(() => {
    if (open) {
      setRecipeData({
        title: '',
        yield: '',
        description: '',
        category: ''
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
    
    // Create a timestamp for the recipe creation
    const timestamp = new Date().toISOString();
    
    // Add the recipe with additional metadata
    onAddRecipe({
      ...recipeData,
      createdAt: timestamp,
      ingredients: [] // Initialize with empty ingredients array
    });
    
    onClose(); // Close modal after attempting to add
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" fontWeight="bold">
          Create New Recipe
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Please enter the initial details for your new recipe. You can add ingredients after creating the recipe.
          </Typography>
        </Box>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
                  required
                  helperText="Required"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  required
                  helperText="Required"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  name="category"
                  label="Category"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={recipeData.category}
                  onChange={handleChange}
                  helperText="Optional: e.g., Dessert, Main Course, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  name="description"
                  label="Description"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={recipeData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  helperText="Optional: Brief description of the recipe"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            After creating the recipe, you'll be able to add ingredients and further details.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleAdd} 
          variant="contained" 
          color="primary"
          disabled={!recipeData.title || !recipeData.yield}
        >
          Create Recipe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRecipeModal;
