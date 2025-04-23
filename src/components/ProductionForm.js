import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveProductionDoc } from '../services/api';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useTheme, darken } from '@mui/material/styles';

// Validation schema
const schema = yup.object().shape({
  department_manager: yup.string().required('Department Manager is required'),
  food_handler_responsible: yup.string().required('Food Handler is required'),
  product_name: yup.string().required('Product Name is required'),
  packing_batch_code: yup.string().required('Batch Code is required'),
  sell_by_date: yup.date().required('Sell-by Date is required'),
  ingredients: yup.array().of(
    yup.object().shape({
      ingredient: yup.string().required('Ingredient is required'),
      batch_code: yup.string().required('Batch Code is required'),
      qty_used: yup.number().typeError('Must be a number').required('Quantity is required'),
      supplier_name: yup.string().required('Supplier is required')
    })
  )
});

const ProductionForm = ({ deptColor }) => {
  const { department } = useParams();
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      department_manager: '',
      food_handler_responsible: '',
      product_name: '',
      packing_batch_code: '',
      sell_by_date: '',
      ingredients: [{ ingredient: '', batch_code: '', qty_used: '', supplier_name: '' }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  // contrast for buttons
  const theme = useTheme();
  const contrastText = theme.palette.getContrastText(deptColor);
  const hoverBg = darken(deptColor, 0.2);

  const onSubmit = async (data) => {
    try {
      await saveProductionDoc(department, data, data.ingredients);
      navigate(`/production/${department}/audit`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Production Overview
      </Typography>
      <Grid container spacing={2}>
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
        <Grid item xs={12} sm={4}>
          <Controller
            name="packing_batch_code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Batch Code(s)"
                placeholder="Comma separated"
                error={!!errors.packing_batch_code}
                helperText={errors.packing_batch_code?.message}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
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
        <Card key={item.id} sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={10} sm={4}>
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
              <Grid item xs={2} sm={2}>
                <IconButton color="error" onClick={() => remove(index)}>
                  <RemoveCircleOutline />
                </IconButton>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outlined"
        startIcon={<AddCircleOutline />}
        onClick={() => append({ ingredient: '', batch_code: '', qty_used: '', supplier_name: '' })}
        sx={{
          mb: 4,
          borderColor: deptColor,
          color: contrastText,
          '& svg': { color: contrastText },
          '&:hover': { borderColor: contrastText }
        }}
      >
        Add Ingredient
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ borderColor: deptColor, color: contrastText, '&:hover': { borderColor: contrastText } }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ bgcolor: deptColor, color: contrastText, '&:hover': { bgcolor: hoverBg } }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default ProductionForm;
