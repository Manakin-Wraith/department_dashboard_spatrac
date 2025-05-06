import React from 'react';
import { GridLegacy as Grid, Box, Typography, TextField, Button, Autocomplete } from '@mui/material';
import useDeptProductSupplier from '../utils/useDeptProductSupplier';
import { useParams } from 'react-router-dom';

const RecipeIngredientsSection = ({ ingredients, setIngredients }) => {
  const { department } = useParams();
  const supplierMapping = useDeptProductSupplier(department);

  // Utility to get supplier options for a given ingredient row
  const getSupplierOptions = (ingredientRow) => {
    if (!ingredientRow) return [];
    // Try by prod_code or ingredient name/ID
    const code = ingredientRow.ingredient;
    const options = [];
    if (supplierMapping && code && supplierMapping[code]) {
      options.push(supplierMapping[code]);
    }
    // Fallback: collect all unique suppliers from mapping
    if (Object.values(supplierMapping).length > 0) {
      Object.values(supplierMapping).forEach(sup => {
        if (!options.find(opt => opt.supplier_name === sup.supplier_name)) {
          options.push(sup);
        }
      });
    }
    return options;
  };

  // Auto-populate supplier if possible when ingredient changes
  const handleRowChange = (index, name, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      // If changing the ingredient, try to auto-set supplier
      if (name === 'ingredient') {
        const code = value;
        if (supplierMapping && code && supplierMapping[code]) {
          updated[index].supplier_name = supplierMapping[code].supplier_name;
        }
      }
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
                name="description"
                value={row.description}
                onChange={e => handleRowChange(index, 'description', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="prod_code"
                value={row.prod_code}
                onChange={e => handleRowChange(index, 'prod_code', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={getSupplierOptions(row)}
                getOptionLabel={option => option.supplier_name || ''}
                value={row.supplier_name ? { supplier_name: row.supplier_name } : null}
                onChange={(_, newValue) => handleRowChange(index, 'supplier_name', newValue ? newValue.supplier_name : '')}
                renderInput={params => (
                  <TextField {...params} label="Supplier" fullWidth />
                )}
                isOptionEqualToValue={(option, value) => option.supplier_name === value.supplier_name}
                freeSolo
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
