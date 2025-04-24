import React from 'react';
import { Box, Grid, Typography, TextField, Button } from '@mui/material';

const RecipeIngredientsSection = ({ ingredients, setIngredients }) => {
  const handleRowChange = (index, name, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const handleAdd = () => {
    setIngredients(prev => [
      ...prev,
      {
        ingredient: '',
        supplier_name: '',
        batch_code: '',
        qty_used: '',
        receiving_date: '',
        sell_by_date: ''
      }
    ]);
  };

  const handleRemove = index => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Recipe Ingredients
      </Typography>
      {ingredients.map((row, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ingredient Name/ID"
                name="ingredient"
                value={row.ingredient}
                onChange={e => handleRowChange(index, 'ingredient', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier"
                name="supplier_name"
                value={row.supplier_name}
                onChange={e => handleRowChange(index, 'supplier_name', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Input Batch Code"
                name="batch_code"
                value={row.batch_code}
                onChange={e => handleRowChange(index, 'batch_code', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Qty Used"
                name="qty_used"
                type="number"
                value={row.qty_used}
                onChange={e => handleRowChange(index, 'qty_used', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Received Date"
                name="receiving_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={row.receiving_date}
                onChange={e => handleRowChange(index, 'receiving_date', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Batch Sell-by"
                name="sell_by_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={row.sell_by_date}
                onChange={e => handleRowChange(index, 'sell_by_date', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item>
              <Button variant="outlined" color="error" size="small" onClick={() => handleRemove(index)}>
                Remove
              </Button>
            </Grid>
          </Grid>
        </Box>
      ))}
      <Button variant="outlined" onClick={handleAdd}>
        + Add Ingredient
      </Button>
    </Box>
  );
};

export default RecipeIngredientsSection;
