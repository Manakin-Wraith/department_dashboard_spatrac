import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useParams } from 'react-router-dom';
import { fetchRecipes } from '../services/api';
import { Autocomplete, Box, IconButton, Typography } from '@mui/material';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const StaffModal = ({ open, onClose, handler, onSave }) => {
  const { department } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (handler && handler.name) {
      setName(handler.name);
    } else {
      setName('');
    }
    // load existing assignments if editing
    if (handler?.assignments) setAssignments(handler.assignments);
  }, [handler]);

  // fetch recipes for assignment picker
  useEffect(() => {
    async function loadRecipes() {
      const recs = await fetchRecipes(department);
      const flat = Array.isArray(recs[0]) ? recs.flat() : recs;
      setRecipesList(flat);
    }
    loadRecipes();
  }, [department]);

  const handleSubmit = () => {
    const payload = handler?.id
      ? { ...handler, name, assignments }
      : { name, assignments };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{handler?.id ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="dense"
        />
        <Typography variant="subtitle2" sx={{ mt:2 }} gutterBottom>Assignments</Typography>
        {assignments.map((a, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap:1, mb:1 }}>
            <TextField
              type="date"
              label="Date"
              value={a.date}
              onChange={e => {
                const arr = [...assignments]; arr[idx].date = e.target.value; setAssignments(arr);
              }}
            />
            <Autocomplete
              options={recipesList}
              getOptionLabel={opt => `${opt.product_code} – ${opt.description}`}
              value={recipesList.find(r=>r.product_code===a.recipeCode)||null}
              onChange={(e, v) => {
                const arr = [...assignments]; arr[idx].recipeCode = v?.product_code||''; setAssignments(arr);
              }}
              renderInput={params => <TextField {...params} label="Recipe" />}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Qty"
              type="number"
              value={a.plannedQty}
              onChange={e => {
                const arr = [...assignments]; arr[idx].plannedQty = e.target.value; setAssignments(arr);
              }}
              sx={{ width: 80 }}
            />
            <IconButton color="error" onClick={() => setAssignments(assignments.filter((_,i)=>i!==idx))}>
              <RemoveCircleIcon />
            </IconButton>
          </Box>
        ))}
        <Button startIcon={<AddCircleIcon />} onClick={() => setAssignments([...assignments, {date:'', recipeCode:'', plannedQty:''}])}>
          Add Assignment
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffModal;
