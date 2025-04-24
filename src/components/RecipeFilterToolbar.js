import React, { useState } from 'react';
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';

const RecipeFilterToolbar = ({ onFilterChange, onCreate }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const handleSearch = e => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({ search: value, status });
  };
  const handleStatus = e => {
    const value = e.target.value;
    setStatus(value);
    onFilterChange({ search, status: value });
  };

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5}>
          <TextField
            label="Search"
            placeholder="Search recipes..."
            value={search}
            onChange={handleSearch}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={status}
              label="Status"
              onChange={handleStatus}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
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
