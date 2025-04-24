import React from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';

const RecipeDetailsSection = ({ details, setDetails }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Recipe Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Recipe Title"
            name="title"
            value={details.title}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Department Manager"
            name="department_manager"
            value={details.department_manager || ''}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Yield"
            name="yield"
            value={details.yield}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Date Created"
            name="date_created"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={details.date_created || ''}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Allergens"
            name="allergens"
            value={details.allergens || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeDetailsSection;
