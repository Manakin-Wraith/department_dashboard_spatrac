import React from 'react';
import {
  Box, Grid, TextField, Button, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Document Filters component for filtering and viewing production documents
 */
const DocumentFilters = ({
  startDate,
  endDate,
  searchTerm,
  documentView,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onViewChange,
  onFilter,
  onReset,
  accentColor = '#1976d2'
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) => onStartDateChange(date ? date.toISOString().split('T')[0] : '')}
              renderInput={(params) => <TextField {...params} fullWidth size="small" />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) => onEndDateChange(date ? date.toISOString().split('T')[0] : '')}
              renderInput={(params) => <TextField {...params} fullWidth size="small" />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
            size="small"
            placeholder="Search by recipe, handler, etc."
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={onFilter}
              sx={{ borderColor: accentColor, color: accentColor }}
            >
              Filter
            </Button>
            
            <Button 
              variant="text" 
              onClick={onReset}
              sx={{ color: accentColor }}
            >
              Reset
            </Button>
            
            <ToggleButtonGroup
              value={documentView}
              exclusive
              onChange={(e, newView) => newView && onViewChange(newView)}
              size="small"
              aria-label="view mode"
            >
              <ToggleButton value="list" aria-label="list view">
                <ListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" aria-label="card view">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="calendar view">
                <CalendarMonthIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentFilters;
