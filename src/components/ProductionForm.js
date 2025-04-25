import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import departments from '../data/department_table.json';
import { saveProductionDoc } from '../services/api';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { useTheme, darken } from '@mui/material/styles';

// Available units of measure
const unitOptions = ['g','kg','ml','l','pcs','each'];

// Validation schema
const schema = yup.object().shape({
  department_manager: yup.string().required('Department Manager is required'),
  food_handler_responsible: yup.string().required('Food Handler is required'),
  product_name: yup.string().required('Product Name is required'),
  packing_batch_code: yup.string().required('Packaging Batch Code is required'),
  sell_by_date: yup.date().required('Sell-by Date is required'),
  ingredients: yup.array().of(
    yup.object().shape({
      ingredient: yup.string().required('Ingredient is required'),
      batch_code: yup.string().required('Batch Code is required'),
      qty_used: yup.number().typeError('Must be a number').required('Quantity is required'),
      supplier_name: yup.string().required('Supplier is required'),
      amount: yup.number().typeError('Must be a number').required('Amount is required'),
      unit_of_measure: yup.string().required('Unit is required'),
      receiving_date: yup.date().required('Receiving Date is required')
    })
  )
});

const ProductionForm = ({ deptColor }) => {
  const { department } = useParams();
  const navigate = useNavigate();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      department_manager: Array.isArray(deptObj.department_manager) ? deptObj.department_manager[0] : deptObj.department_manager || '',
      food_handler_responsible: '',
      product_name: '',
      packing_batch_code: '',
      sell_by_date: '',
      ingredients: [{ ingredient: '', batch_code: '', qty_used: '', supplier_name: '', amount: '', unit_of_measure: '', receiving_date: '' }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  // contrast for buttons
  const theme = useTheme();
  const contrastText = theme.palette.getContrastText(deptColor);
  const hoverBg = darken(deptColor, 0.2);

  const onSubmit = async (data) => {
    // Build audit JSON payload per build_docs/audit_recipe_form.json
    const payload = {
      uid: '',
      department,
      department_manager: data.department_manager,
      food_handler_responsible: data.food_handler_responsible,
      packing_batch_code: data.packing_batch_code.split(',').map(s => s.trim()),
      product_name: data.product_name.split(',').map(s => s.trim()),
      ingredient_list: data.ingredients.map(i => i.ingredient),
      supplier_name: data.ingredients.map(i => i.supplier_name),
      amount: data.ingredients.map(i => i.amount),
      unit_of_measure: data.ingredients.map(i => i.unit_of_measure),
      address_of_supplier: data.ingredients.map(i => i.address_of_supplier || ''),
      batch_code: data.ingredients.map(i => i.batch_code),
      sell_by_date: [data.sell_by_date],
      receiving_date: data.ingredients.map(i => i.receiving_date || ''),
      country_of_origin: data.ingredients.map(i => i.country_of_origin || '')
    };
    try {
      await saveProductionDoc(department, payload, []);
      setSnackbar({ open: true, message: 'Document saved successfully!', severity: 'success' });
      navigate(`/production/${department}/audit`);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to save document.', severity: 'error' });
    }
  };

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const handleClose = () => setSnackbar(s => ({ ...s, open: false }));

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Production Overview
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <Controller
            name="department_manager"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Department Manager"
                error={!!errors.department_manager}
                helperText={errors.department_manager?.message}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="food_handler_responsible"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Food Handler(s)"
                placeholder="Comma separated"
                error={!!errors.food_handler_responsible}
                helperText={errors.food_handler_responsible?.message}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="product_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Product Name"
                error={!!errors.product_name}
                helperText={errors.product_name?.message}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Controller
            name="packing_batch_code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Packaging Batch Code(s)"
                placeholder="Comma separated"
                error={!!errors.packing_batch_code}
                helperText={errors.packing_batch_code?.message}
                fullWidth sx={{ minWidth: 250 }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Controller
            name="sell_by_date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Sell-by Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.sell_by_date}
                helperText={errors.sell_by_date?.message}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Ingredients Required
      </Typography>
      {fields.map((item, index) => (
        <Card key={item.id} elevation={0} sx={{ mb: 2, backgroundColor: theme.palette.grey[100], boxShadow: 'none', border: 'none' }}>
          <CardContent sx={{ px: 0 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={2}>
                <Controller
                  name={`ingredients.${index}.ingredient`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Ingredient"
                      error={!!errors.ingredients?.[index]?.ingredient}
                      helperText={errors.ingredients?.[index]?.ingredient?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Controller
                  name={`ingredients.${index}.batch_code`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Batch Code"
                      error={!!errors.ingredients?.[index]?.batch_code}
                      helperText={errors.ingredients?.[index]?.batch_code?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Controller
                  name={`ingredients.${index}.supplier_name`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Supplier"
                      error={!!errors.ingredients?.[index]?.supplier_name}
                      helperText={errors.ingredients?.[index]?.supplier_name?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Controller
                  name={`ingredients.${index}.amount`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Amount"
                      error={!!errors.ingredients?.[index]?.amount}
                      helperText={errors.ingredients?.[index]?.amount?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={3} sx={{ minWidth: 120 }}>
                <Controller
                  name={`ingredients.${index}.unit_of_measure`}
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id={`unit-label-${index}`}>Unit</InputLabel>
                      <Select
                        {...field}
                        labelId={`unit-label-${index}`}
                        displayEmpty
                        label="Unit"
                        sx={{
                          fontWeight: theme.typography.fontWeightRegular,
                          color: theme.palette.text.secondary
                        }}
                        renderValue={(selected) => selected || 'Unit'}
                      >
                        <MenuItem value="" disabled>
                          Unit
                        </MenuItem>
                        {unitOptions.map(unit => (
                          <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Controller
                  name={`ingredients.${index}.receiving_date`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Receiving Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.ingredients?.[index]?.receiving_date}
                      helperText={errors.ingredients?.[index]?.receiving_date?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <Button
                  variant="contained"
                  onClick={() => remove(index)}
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    '&:hover': { bgcolor: darken(theme.palette.error.main, 0.2) }
                  }}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outlined"
        startIcon={<AddCircleOutline />}
        onClick={() => append({ ingredient: '', batch_code: '', qty_used: '', supplier_name: '', amount: '', unit_of_measure: '', receiving_date: '' })}
        sx={{
          mb: 4,
          borderColor: deptColor,
          color: theme.palette.text.primary,
          '& svg': { color: theme.palette.text.primary },
          '&:hover': { borderColor: theme.palette.text.primary }
        }}
      >
        Add Ingredient
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ borderColor: deptColor, color: theme.palette.text.primary, '&:hover': { borderColor: theme.palette.text.primary } }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ bgcolor: deptColor, color: contrastText, '&:hover': { bgcolor: hoverBg } }}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
        </Button>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductionForm;
