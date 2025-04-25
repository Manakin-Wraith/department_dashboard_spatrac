import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, FormGroup, FormControlLabel, Checkbox, Box, Typography
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTheme, darken } from '@mui/material/styles';
import departments from '../data/department_table.json';

const ExportScheduleModal = ({ open, onClose, schedules, recipes }) => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const accentColor = deptObj.color || theme.palette.primary.main;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    let items = [];
    schedules.forEach(s => {
      if (startDate && endDate) {
        if (s.weekStartDate >= startDate && s.weekStartDate <= endDate) {
          items.push(...s.items.map((item, idx) => ({ schedule: s, item, idx })));
        }
      } else if (startDate) {
        if (s.weekStartDate === startDate) {
          items.push(...s.items.map((item, idx) => ({ schedule: s, item, idx })));
        }
      } else if (endDate) {
        if (s.weekStartDate === endDate) {
          items.push(...s.items.map((item, idx) => ({ schedule: s, item, idx })));
        }
      }
    });
    setFilteredItems(items);
    const map = {};
    items.forEach(({ schedule, item, idx }) => {
      const key = `${schedule.id}-${item.recipeCode}-${idx}`;
      map[key] = true;
    });
    setSelected(map);
  }, [schedules, startDate, endDate]);

  const toggleSelect = key => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
      onClose();
    }, 100);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: `2px solid ${accentColor}`, color: accentColor }}>
        Export Schedules
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ '@media print': { display: 'none' } }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ '@media print': { display: 'none' } }}>
          <FormGroup>
            {filteredItems.map(({ schedule, item, idx }) => {
              const rec = recipes.find(r => r.product_code === item.recipeCode) || {};
              const key = `${schedule.id}-${item.recipeCode}-${idx}`;
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={!!selected[key]}
                      onChange={() => toggleSelect(key)}
                      sx={{ color: accentColor, '&.Mui-checked': { color: accentColor } }}
                    />
                  }
                  label={`${schedule.weekStartDate} — ${rec.description || item.recipeCode} (${item.plannedQty}) — Handlers: ${schedule.handlersNames}`}
                />
              );
            })}
          </FormGroup>
        </Box>
        <Box sx={{ display: 'none', '@media print': { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 1 } }}>
          {filteredItems.filter(({ schedule, item, idx }) => selected[`${schedule.id}-${item.recipeCode}-${idx}`]).map(({ schedule, item, idx }) => {
            const rec = recipes.find(r => r.product_code === item.recipeCode) || {};
            return (
              <Box key={`${schedule.id}-${item.recipeCode}-${idx}`} sx={{ border: `1px solid ${accentColor}`, borderRadius: 1, p: 1, breakInside: 'avoid' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Date: {schedule.weekStartDate}</Typography>
                <Typography variant="body2">Recipe: {rec.description || item.recipeCode}</Typography>
                <Typography variant="body2">Qty: {item.plannedQty}</Typography>
                <Typography variant="body2">Handlers: {schedule.handlersNames}</Typography>
                <Typography variant="body2">Manager: {schedule.managerName}</Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ '@media print': { display: 'none' } }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: darken(accentColor, 0.2) } }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportScheduleModal;
