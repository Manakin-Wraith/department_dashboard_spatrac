import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Accordion, AccordionSummary, AccordionDetails,
  Typography, List, ListItem, Grid, TextField, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTheme, darken } from '@mui/material/styles';
import departments from '../data/department_table.json';
import supplierTable from '../data/supplier_table.json';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import useDeptProductSupplier from '../utils/useDeptProductSupplier';

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
  const suppliers = supplierTable.filter(s => !s.department || s.department === deptObj.department);

  // load department-specific product->supplier mappings (using department name for CSV lookup)
  const productSupplierMap = useDeptProductSupplier(deptObj.department);

  useEffect(() => {
    setLocalItems(items);
    // init suppliers map from dept CSV mapping
    const init = items.map(item => {
      const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
      return recipe.ingredients?.map(ing => 
        productSupplierMap[ing.prod_code]?.supplier_name 
        || productSupplierMap[ing.description]?.supplier_name 
        || '') || [];
    });
    setIngredientSuppliers(init);
  }, [items, recipes, productSupplierMap]);

  useEffect(() => {
    if (initialDate) setScheduledDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const dm = deptObj.department_manager;
    if (Array.isArray(dm) && dm.length) {
      setManagerName(dm[0]);
    } else if (typeof dm === 'string' && dm) {
      setManagerName(dm);
    }
  }, [deptObj.department_manager]);

  useEffect(() => {
    const handlersList = deptObj.handlers;
    if (Array.isArray(handlersList) && handlersList.length) {
      setHandlersNames(handlersList[0]);
    }
  }, [deptObj.handlers]);

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
    // reset suppliers for new recipe from mapping
    const recipe = recipes.find(r => r.product_code === code) || {};
    setIngredientSuppliers(prev => {
      const arr = [...prev];
      arr[idx] = recipe.ingredients?.map(ing => 
        productSupplierMap[ing.prod_code]?.supplier_name 
        || productSupplierMap[ing.description]?.supplier_name 
        || '') || [];
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
            <FormControl fullWidth size="small">
              <InputLabel>Food Handler</InputLabel>
              <Select
                label="Food Handler"
                size="small"
                value={handlersNames}
                onChange={e => setHandlersNames(e.target.value)}
              >
                {deptObj.handlers?.map((h, idx) => (
                  <MenuItem key={idx} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                      {recipes.map((r, recipeIdx) => (
                        <MenuItem key={`${r.product_code}-${recipeIdx}`} value={r.product_code}>
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
                                <Grid item xs={4}>
                                  <Typography>{ing.description}</Typography>
                                  <Typography variant="caption">Code: {ing.prod_code}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Select
                                    label="Supplier"
                                    size="small"
                                    fullWidth
                                    sx={{ minWidth: 200 }}
                                    value={ingredientSuppliers[idx]?.[i] || ''}
                                    onChange={e => {
                                      const supArr = [...ingredientSuppliers];
                                      supArr[idx][i] = e.target.value;
                                      setIngredientSuppliers(supArr);
                                    }}
                                  >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {(() => {
                                      const entry = productSupplierMap[ing.prod_code] || productSupplierMap[ing.description];
                                      return entry ? [entry] : suppliers;
                                    })().map(s => (
                                      <MenuItem key={s.supplier_code} value={s.supplier_name}>
                                        {s.supplier_name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </Grid>
                                <Grid item xs={2}>
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
