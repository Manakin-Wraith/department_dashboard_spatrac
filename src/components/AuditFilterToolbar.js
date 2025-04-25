import React, { useState } from 'react';
import { GridLegacy as Grid, Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';

const AuditFilterToolbar = ({ onOpenExport }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <TextField
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth sx={{ minWidth: 100 }}>
            <InputLabel id="product-filter-label">Product</InputLabel>
            <Select
              labelId="product-filter-label"
              value={productFilter}
              label="Product"
              onChange={e => setProductFilter(e.target.value)}
            >
              <MenuItem value="">All Products</MenuItem>
              {/* TODO: dynamic options */}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth sx={{ minWidth: 100 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={onOpenExport}>Export</Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditFilterToolbar;
