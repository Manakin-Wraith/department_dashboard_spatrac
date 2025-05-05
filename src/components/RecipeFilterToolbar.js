import React, { useState } from 'react';
import { GridLegacy as Grid, Box, TextField, Button } from '@mui/material';

const RecipeFilterToolbar = ({ onFilterChange, onCreate }) => {
  const [department, setDepartment] = useState('');

  const handleDepartmentChange = e => {
    const value = e.target.value;
    setDepartment(value);
    onFilterChange({ department: value });
  };



  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5}>
          <TextField
            select
            value={department}
            onChange={handleDepartmentChange}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="">Select Department</option>
            <option value="BUTCHERY">Butchery</option>
            <option value="BAKERY">Bakery</option>
            <option value="HMR">HMR</option>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onCreate}>
            Create New Recipe
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeFilterToolbar;
