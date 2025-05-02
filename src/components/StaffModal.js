import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Checkbox, Autocomplete, IconButton, Typography, Tooltip, Divider, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import { fetchRecipes } from '../services/api';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';

const StaffModal = ({ open, onClose, handler, onSave, onDelete }) => {
  const { department } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);

  const isSelected = idx => selected.includes(idx);
  const handleSelectAll = e => e.target.checked ? setSelected(assignments.map((_,i)=>i)) : setSelected([]);
  const handleSelectOne = (e, idx) => e.target.checked ? setSelected(prev=>[...prev, idx]) : setSelected(prev=>prev.filter(i=>i!==idx));
  const handleDeleteSelected = () => { setAssignments(prev=>prev.filter((_,i)=>!selected.includes(i))); setSelected([]); };

  useEffect(() => {
    // initialize form fields on handler change
    setName(handler?.name || '');
    setAssignments(handler?.assignments || []);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{handler?.id ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Staff Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
          />
          <Divider />
          <Typography variant="subtitle1">Assignments</Typography>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} disabled={!selected.length} onClick={handleDeleteSelected}>
              Delete Selected
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { py: 0, px: 0.75 } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox indeterminate={selected.length>0 && selected.length<assignments.length} checked={assignments.length>0 && selected.length===assignments.length} onChange={handleSelectAll} />
                  </TableCell>
                  <TableCell>Recipe</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={isSelected(idx)} onChange={e=>handleSelectOne(e, idx)} />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        options={recipesList}
                        getOptionLabel={opt => opt.description}
                        value={recipesList.find(r => r.product_code === a.recipeCode) || null}
                        onChange={(e, v) => {
                          const arr = [...assignments];
                          arr[idx].recipeCode = v?.product_code || '';
                          setAssignments(arr);
                        }}
                        renderInput={params => <TextField {...params} variant="standard" size="small" margin="dense" placeholder="Recipe" sx={{ minWidth: 200 }} />}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        variant="standard"
                        size="small"
                        margin="none"
                        value={a.date}
                        onChange={e => {
                          const arr = [...assignments];
                          arr[idx].date = e.target.value;
                          setAssignments(arr);
                        }}
                        sx={{ minWidth: 120 }}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          style: {
                            padding: '4px 6px',
                            height: '20px',
                            fontSize: '0.8125rem'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        size="small"
                        margin="dense"
                        type="number"
                        value={a.plannedQty}
                        onChange={e => {
                          const arr = [...assignments]; arr[idx].plannedQty = e.target.value; setAssignments(arr);
                        }}
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove assignment">
                        <IconButton color="error" size="small" onClick={() => setAssignments(assignments.filter((_, i) => i !== idx))}>
                          <RemoveCircleIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Button startIcon={<AddCircleIcon />} onClick={() => setAssignments([...assignments, { date: '', recipeCode: '', plannedQty: '' }])}>
                      Add Assignment
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
      <DialogActions>
        {handler?.id && (
          <Button color="error" onClick={() => onDelete(handler.id)}>Delete Staff</Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name || assignments.some(a => !a.date || !a.recipeCode || !a.plannedQty)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffModal;
