import React, { useState } from 'react';
import {
  GridLegacy as Grid, Box, Typography, TextField, Button, Autocomplete,
  Paper, Divider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import useDeptProductSupplier from '../utils/useDeptProductSupplier';
import { useParams } from 'react-router-dom';
import AddIngredientModal from './AddIngredientModal';

const RecipeIngredientsSection = ({ ingredients, setIngredients }) => {
  const { department } = useParams();
  const supplierMapping = useDeptProductSupplier(department);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSupplierOptions = (ingredientRow) => {
    if (!ingredientRow) return [];
    const code = ingredientRow.prod_code || ingredientRow.description;
    const options = [];
    if (supplierMapping && code && supplierMapping[code]) {
      if (Array.isArray(supplierMapping[code])) {
        supplierMapping[code].forEach(sup => {
          if (!options.find(opt => opt.supplier_name === sup.supplier_name)) {
            options.push(sup);
          }
        });
      } else if (typeof supplierMapping[code] === 'object' && supplierMapping[code].supplier_name) {
        if (!options.find(opt => opt.supplier_name === supplierMapping[code].supplier_name)) {
          options.push(supplierMapping[code]);
        }
      }
    }
    if (options.length === 0 && Object.values(supplierMapping).length > 0) {
      const allSuppliers = [];
      Object.values(supplierMapping).forEach(item => {
        if (Array.isArray(item)) {
          item.forEach(sup => allSuppliers.push(sup));
        } else if (typeof item === 'object' && item.supplier_name) {
          allSuppliers.push(item);
        }
      });
      allSuppliers.forEach(sup => {
        if (!options.find(opt => opt.supplier_name === sup.supplier_name)) {
          options.push(sup);
        }
      });
    }
    return options.filter(opt => opt && opt.supplier_name);
  };

  const handleRowChange = (index, name, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      if (name === 'description' || name === 'prod_code') {
        const code = value;
        const suppliers = getSupplierOptions(updated[index]);
        if (suppliers.length === 1) {
          updated[index].supplier_name = suppliers[0].supplier_name;
        } else if (name === 'prod_code' && supplierMapping && supplierMapping[code] && !Array.isArray(supplierMapping[code])){
           updated[index].supplier_name = supplierMapping[code].supplier_name;
        }
      }
      return updated;
    });
  };

  const handleOpenAddIngredientModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseAddIngredientModal = () => {
    setIsModalOpen(false);
  };

  const handleAddNewIngredientFromModal = (newIngredientData) => {
    setIngredients(prev => [
      ...prev,
      {
        description: newIngredientData.description || '', 
        prod_code: newIngredientData.prod_code || '',
        qty_used: newIngredientData.qty_used || '',
        supplier_name: '', 
        batch_code: '',
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
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Recipe Ingredients
      </Typography>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {ingredients.map((row, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} sm={6} md={3}>
                {/* Ingredient Name - Read-only */}
                <Box sx={{ py: 1.5 }}> 
                  <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                    Ingredient Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {row.description || '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                {/* Product Code - Read-only */}
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                    Product Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {row.prod_code || '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                {/* Qty Used - Read-only */}
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                    Qty Used
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {row.qty_used || '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={getSupplierOptions(row)}
                  getOptionLabel={option => option.supplier_name || ''}
                  value={row.supplier_name ? { supplier_name: row.supplier_name } : null}
                  onChange={(_, newValue) => handleRowChange(index, 'supplier_name', newValue ? newValue.supplier_name : '')}
                  renderInput={params => (
                    <TextField {...params} label="Supplier" fullWidth variant="outlined" />
                  )}
                  isOptionEqualToValue={(option, value) => option.supplier_name === value.supplier_name}
                  freeSolo 
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="Batch Code"
                  name="batch_code"
                  value={row.batch_code || ''}
                  onChange={e => handleRowChange(index, 'batch_code', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="Receiving Date"
                  name="receiving_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={row.receiving_date || ''}
                  onChange={e => handleRowChange(index, 'receiving_date', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="Sell By Date"
                  name="sell_by_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={row.sell_by_date || ''}
                  onChange={e => handleRowChange(index, 'sell_by_date', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pt: {xs: 1, md: 3} /* Adjusted pt for default button size */ }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleRemove(index)}
                  startIcon={<DeleteIcon />}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
            {index < ingredients.length - 1 && <Divider sx={{ my: 2 }} />}
          </Paper>
        ))}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleOpenAddIngredientModal}
            startIcon={<AddCircleOutlineIcon />}
          >
            Add Ingredient
          </Button>
        </Box>
      </Paper>
      <AddIngredientModal 
        open={isModalOpen}
        onClose={handleCloseAddIngredientModal}
        onAddIngredient={handleAddNewIngredientFromModal}
      />
    </Box>
  );
};

export default RecipeIngredientsSection;
