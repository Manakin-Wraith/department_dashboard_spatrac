import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Accordion, AccordionSummary, AccordionDetails,
  Typography, List, ListItem, Grid, TextField, Card, CardContent,
  Select, MenuItem
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTheme, darken } from '@mui/material/styles';
import departments from '../data/department_table.json';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';

const ConfirmScheduleModal = ({ open, onClose, items, recipes, onConfirm, initialDate }) => {
  const [localItems, setLocalItems] = useState([]);
  const [managerName, setManagerName] = useState('');
  const [handlersNames, setHandlersNames] = useState('');
  const [ingredientSuppliers, setIngredientSuppliers] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');

  const theme = useTheme();
  const { department } = useParams();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const accentColor = deptObj.color || theme.palette.primary.main;

  useEffect(() => {
    setLocalItems(items);
    // init suppliers map
    const init = items.map(item => {
      const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
      return Array(recipe.ingredients?.length || 0).fill('');
    });
    setIngredientSuppliers(init);
  }, [items, recipes]);

  useEffect(() => {
    if (initialDate) setScheduledDate(initialDate);
  }, [initialDate]);

  const handleQtyChange = (idx, qty) => {
    const updated = [...localItems];
    updated[idx].plannedQty = Number(qty);
    setLocalItems(updated);
  };

  const addItem = () => {
    const defaultCode = recipes[0]?.product_code || '';
    setLocalItems(prev => [...prev, { recipeCode: defaultCode, plannedQty: 0 }]);
    const count = recipes.find(r => r.product_code === defaultCode)?.ingredients?.length || 0;
    setIngredientSuppliers(prev => [...prev, Array(count).fill('')]);
  };

  const handleRecipeChange = (idx, code) => {
    const updated = [...localItems];
    updated[idx].recipeCode = code;
    setLocalItems(updated);
    // reset suppliers for new recipe
    const recipe = recipes.find(r => r.product_code === code) || {};
    setIngredientSuppliers(prev => {
      const arr = [...prev];
      arr[idx] = Array(recipe.ingredients?.length || 0).fill('');
      return arr;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: `2px solid ${accentColor}`, color: accentColor }}>Confirm Schedule</DialogTitle>
      <DialogContent dividers>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutline />}
          onClick={addItem}
          sx={{ mb: 2, borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
        >Add Item</Button>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <TextField label="Department Manager" fullWidth value={managerName} onChange={e => setManagerName(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Food Handlers" placeholder="Comma separated" fullWidth value={handlersNames} onChange={e => setHandlersNames(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Production Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
            />
          </Grid>
        </Grid>
        {localItems.map((item, idx) => {
          const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
          return (
            <Card key={idx} sx={{ mb: 2 }}>
              <CardContent>
                <Accordion sx={{ boxShadow: 'none' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Select
                      value={localItems[idx].recipeCode}
                      size="small"
                      onChange={e => handleRecipeChange(idx, e.target.value)}
                      sx={{ mr: 2, minWidth: 200 }}
                    >
                      {recipes.map(r => (
                        <MenuItem key={r.product_code} value={r.product_code}>
                          {r.description}
                        </MenuItem>
                      ))}
                    </Select>
                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={item.plannedQty}
                      onChange={e => handleQtyChange(idx, e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Ingredients</Typography>
                        <List>
                          {recipe.ingredients?.map((ing, i) => (
                            <ListItem key={i}>
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={5}>
                                  <Typography>{ing.description}</Typography>
                                  <Typography variant="caption">Code: {ing.prod_code}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <TextField
                                    label="Supplier"
                                    size="small"
                                    fullWidth
                                    value={ingredientSuppliers[idx]?.[i] || ''}
                                    onChange={e => {
                                      const sup = [...ingredientSuppliers];
                                      sup[idx][i] = e.target.value;
                                      setIngredientSuppliers(sup);
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    label="Qty Used"
                                    size="small"
                                    fullWidth
                                    value={ing.recipe_use}
                                    InputProps={{ readOnly: true }}
                                  />
                                </Grid>
                              </Grid>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
        >Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm({ items: localItems, scheduledDate, managerName, handlersNames, ingredientSuppliers })}
          sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: darken(accentColor, 0.2) } }}
        >Confirm & Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmScheduleModal;
