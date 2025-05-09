import React, { useState, Fragment } from 'react';
import {
  Box, Typography, Button, Collapse, Avatar, TextField, MenuItem, Select, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Tooltip, InputAdornment, FormControl, InputLabel, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

// Units for dropdown selection
const UNIT_OPTIONS = ['KG', 'GR', 'EA', 'ML', 'L', 'P/KG'];

const RecipeListTable = ({ data = [], onEdit, onSave, onDelete, departments = [], onAddRecipe }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editedRecipe, setEditedRecipe] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [deleteIngredientConfirmOpen, setDeleteIngredientConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [addIngredientDialogOpen, setAddIngredientDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    description: '',
    ingr_prod_code: '',
    pack_size: '',
    recipe_use: '',
    cost: '',
  });
  
  const theme = useTheme();

  const handleExpandClick = (productCode) => {
    setExpandedRow(expandedRow === productCode ? null : productCode);
  };

  const handleEditClick = (recipe) => {
    // If already in edit mode for this recipe, save changes
    if (editMode === recipe.product_code) {
      handleSaveChanges();
      return;
    }
    
    // Clone the recipe to edit
    setEditedRecipe(JSON.parse(JSON.stringify(recipe)));
    setEditMode(recipe.product_code);
    setExpandedRow(recipe.product_code); // Expand the row when editing
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedRecipe(null);
  };

  const handleSaveChanges = () => {
    if (editedRecipe) {
      // Calculate derived values before saving
      const totalBatchWeight = editedRecipe.ingredients.reduce(
        (sum, ing) => sum + parseFloat(ing.recipe_use || 0), 0
      );
      
      const totalBatchCost = editedRecipe.ingredients.reduce(
        (sum, ing) => sum + parseFloat(ing.total_cost || 0), 0
      );
      
      // Calculate cost per unit
      const expectedYield = parseFloat(editedRecipe.yield || 0);
      const costPerUnit = expectedYield > 0 ? totalBatchCost / expectedYield : 0;
      
      const updatedRecipe = {
        ...editedRecipe,
        total_batch_weight: totalBatchWeight,
        total_batch_cost: totalBatchCost,
        cost_excl_per_each_kg: costPerUnit.toFixed(2)
      };
      
      onSave(updatedRecipe);
      setEditMode(null);
      setEditedRecipe(null);
    }
  };

  const handleDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (recipeToDelete) {
      onDelete(recipeToDelete);
      setDeleteConfirmOpen(false);
      setRecipeToDelete(null);
      // If the deleted recipe was expanded, collapse it
      if (expandedRow === recipeToDelete.product_code) {
        setExpandedRow(null);
      }
    }
  };

  const handleDeleteIngredientClick = (ingredientIndex) => {
    setIngredientToDelete(ingredientIndex);
    setDeleteIngredientConfirmOpen(true);
  };

  const handleDeleteIngredientConfirm = () => {
    if (editedRecipe && ingredientToDelete !== null) {
      const updatedIngredients = [...editedRecipe.ingredients];
      updatedIngredients.splice(ingredientToDelete, 1);
      
      setEditedRecipe({
        ...editedRecipe,
        ingredients: updatedIngredients
      });
      
      setDeleteIngredientConfirmOpen(false);
      setIngredientToDelete(null);
    }
  };

  const handleRecipeFieldChange = (field, value) => {
    if (editedRecipe) {
      setEditedRecipe({
        ...editedRecipe,
        [field]: value
      });
    }
  };

  const handleIngredientFieldChange = (index, field, value) => {
    if (editedRecipe) {
      const updatedIngredients = [...editedRecipe.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      };
      
      // If changing quantity or unit cost, recalculate total cost
      if (field === 'recipe_use' || field === 'cost') {
        const qty = field === 'recipe_use' ? value : updatedIngredients[index].recipe_use;
        const cost = field === 'cost' ? value : updatedIngredients[index].cost;
        
        if (qty && cost) {
          updatedIngredients[index].total_cost = (parseFloat(qty) * parseFloat(cost)).toFixed(2);
        }
      }
      
      setEditedRecipe({
        ...editedRecipe,
        ingredients: updatedIngredients
      });
    }
  };

  const handleAddIngredient = () => {
    setAddIngredientDialogOpen(true);
  };

  const handleAddIngredientSave = () => {
    if (editedRecipe && newIngredient.description) {
      // Calculate total cost
      const totalCost = parseFloat(newIngredient.recipe_use || 0) * parseFloat(newIngredient.cost || 0);
      
      const ingredientToAdd = {
        ...newIngredient,
        total_cost: isNaN(totalCost) ? '0.00' : totalCost.toFixed(2)
      };
      
      setEditedRecipe({
        ...editedRecipe,
        ingredients: [...editedRecipe.ingredients, ingredientToAdd]
      });
      
      // Reset new ingredient form
      setNewIngredient({
        description: '',
        ingr_prod_code: '',
        pack_size: '',
        recipe_use: '',
        cost: '',
      });
      
      setAddIngredientDialogOpen(false);
    }
  };

  // Filter recipes based on search term and department filter
  const filteredData = data.filter(recipe => {
    const matchesSearch = !searchTerm || 
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || 
      recipe.department?.toLowerCase() === departmentFilter.toLowerCase();
    
    return matchesSearch && matchesDepartment;
  });

  // Calculate totals for a recipe
  const calculateTotals = (recipe) => {
    if (!recipe || !recipe.ingredients) return { totalWeight: 0, totalCost: 0 };
    
    const totalWeight = recipe.ingredients.reduce(
      (sum, ing) => sum + parseFloat(ing.recipe_use || 0), 0
    );
    
    const totalCost = recipe.ingredients.reduce(
      (sum, ing) => sum + parseFloat(ing.total_cost || 0), 0
    );
    
    return { totalWeight, totalCost };
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={onAddRecipe}
          >
            Add New Recipe
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5, width: '100%' }}>
          <Typography variant="h6" color="text.secondary">
            No recipes found for the current selection.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* Header with Add Recipe button and Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          {showFilters && (
            <>
              <TextField
                size="small"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="department-filter-label">Department</InputLabel>
                <Select
                  labelId="department-filter-label"
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={onAddRecipe}
        >
          Add New Recipe
        </Button>
      </Box>

      {/* Recipe Table */}
      <TableContainer component={Paper}>
        <Table aria-label="collapsible recipe table">
          <TableHead>
            <TableRow sx={{ '& > *': { fontWeight: 'bold' } }}>
              <TableCell sx={{ width: '60px' }} />
              <TableCell sx={{ width: '80px' }}>Dept.</TableCell>
              <TableCell>Recipe Name</TableCell>
              <TableCell>Product Code</TableCell>
              <TableCell>Cost / Unit</TableCell>
              <TableCell sx={{ width: '200px', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((r) => {
              const recipeDepartmentName = r.department || 'Unknown';
              const deptObj = departments.find(d => d.department && d.department.toUpperCase() === recipeDepartmentName.toUpperCase()) || {};
              const accentColor = deptObj?.color || theme.palette.grey[500];
              const ingredientCount = r.ingredients ? r.ingredients.length : 0;
              const DepartmentIconComponent = deptObj.icon ? iconMap[deptObj.icon] : null;
              const isExpanded = expandedRow === r.product_code;
              const isEditing = editMode === r.product_code;
              
              // Get the recipe to display (either the original or the edited version)
              const displayRecipe = isEditing ? editedRecipe : r;
              
              // Calculate totals
              const { totalWeight, totalCost } = calculateTotals(displayRecipe);
              
              return (
              <Fragment key={r.product_code}>
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => handleExpandClick(r.product_code)}
                    >
                      {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {DepartmentIconComponent ? (
                      <Tooltip title={recipeDepartmentName}>
                        <Avatar
                          sx={{
                            bgcolor: accentColor,
                            color: theme.palette.getContrastText(accentColor),
                            width: 32,
                            height: 32,
                          }}
                        >
                          <DepartmentIconComponent fontSize="small" />
                        </Avatar>
                      </Tooltip>
                    ) : (
                      <Box sx={{ width: 32, height: 32 }} />
                    )}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {displayRecipe.description || 'Unnamed Recipe'} ({ingredientCount})
                  </TableCell>
                  <TableCell>{displayRecipe.product_code || '-'}</TableCell>
                  <TableCell>
                    {displayRecipe.cost_excl_per_each_kg ? `R${parseFloat(displayRecipe.cost_excl_per_each_kg).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color={isEditing ? "success" : "primary"} 
                      onClick={() => handleEditClick(r)} 
                      sx={{ mr: 1 }}
                    >
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteClick(r)}
                      disabled={isEditing}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1, p: 2, border: '1px solid rgba(224, 224, 224, 1)', borderRadius: '4px' }}>
                        {/* Recipe Details Section */}
                        <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'medium', mb: 2 }}>
                          Recipe Details
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Recipe Name"
                              value={displayRecipe.description || ''}
                              onChange={(e) => handleRecipeFieldChange('description', e.target.value)}
                              disabled={!isEditing}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Product Code"
                              value={displayRecipe.product_code || ''}
                              onChange={(e) => handleRecipeFieldChange('product_code', e.target.value)}
                              disabled={!isEditing}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Department</InputLabel>
                              <Select
                                value={displayRecipe.department || ''}
                                label="Department"
                                onChange={(e) => handleRecipeFieldChange('department', e.target.value)}
                                disabled={!isEditing}
                              >
                                {departments.map((dept) => (
                                  <MenuItem key={dept.department} value={dept.department}>
                                    {dept.department}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                        
                        {/* Costing & Yield Summary Section */}
                        <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'medium', mb: 2 }}>
                          Costing & Yield Summary
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Total Batch Weight"
                              value={totalWeight.toFixed(3)}
                              disabled
                              size="small"
                              InputProps={{
                                endAdornment: <InputAdornment position="end">KG</InputAdornment>,
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Total Batch Cost"
                              value={`R${totalCost.toFixed(2)}`}
                              disabled
                              size="small"
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <TextField
                                fullWidth
                                label="Unit Scale/Size"
                                value={displayRecipe.scale || ''}
                                onChange={(e) => handleRecipeFieldChange('scale', e.target.value)}
                                disabled={!isEditing}
                                size="small"
                                type="number"
                                inputProps={{ step: "0.001" }}
                              />
                              <Tooltip title="The standard weight or size of a single finished product unit (e.g., one loaf, one pie)">
                                <IconButton size="small" sx={{ ml: 0.5, mt: 1 }}>
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Expected Yield (Units)"
                              value={displayRecipe.yield || ''}
                              onChange={(e) => handleRecipeFieldChange('yield', e.target.value)}
                              disabled={!isEditing}
                              size="small"
                              type="number"
                              inputProps={{ step: "0.01" }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Actual Yield (Units)"
                              value={displayRecipe.actual_yield || ''}
                              onChange={(e) => handleRecipeFieldChange('actual_yield', e.target.value)}
                              disabled={!isEditing}
                              size="small"
                              type="number"
                              inputProps={{ step: "0.01" }}
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="COST PER UNIT (Excl.)"
                              value={displayRecipe.cost_excl_per_each_kg ? `R${parseFloat(displayRecipe.cost_excl_per_each_kg).toFixed(2)}` : '-'}
                              disabled
                              size="small"
                              sx={{ 
                                '& .MuiInputBase-input': { 
                                  fontWeight: 'bold', 
                                  color: theme.palette.primary.main 
                                } 
                              }}
                            />
                          </Grid>
                        </Grid>
                        
                        {/* Ingredients Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                            Ingredients
                          </Typography>
                          {isEditing && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={handleAddIngredient}
                            >
                              Add Ingredient
                            </Button>
                          )}
                        </Box>
                        
                        {ingredientCount > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Ingredient (Description)</TableCell>
                                  <TableCell>Prod. Code</TableCell>
                                  <TableCell>Qty Used</TableCell>
                                  <TableCell>Unit</TableCell>
                                  <TableCell>Unit Cost</TableCell>
                                  <TableCell>Total Cost</TableCell>
                                  {isEditing && <TableCell>Actions</TableCell>}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {displayRecipe.ingredients.map((ing, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      {isEditing ? (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          value={ing.description || ''}
                                          onChange={(e) => handleIngredientFieldChange(idx, 'description', e.target.value)}
                                        />
                                      ) : (
                                        ing.description || 'Unnamed Ingredient'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          value={ing.ingr_prod_code || ''}
                                          onChange={(e) => handleIngredientFieldChange(idx, 'ingr_prod_code', e.target.value)}
                                        />
                                      ) : (
                                        ing.ingr_prod_code || '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="number"
                                          inputProps={{ step: "0.001" }}
                                          value={ing.recipe_use || ''}
                                          onChange={(e) => handleIngredientFieldChange(idx, 'recipe_use', e.target.value)}
                                        />
                                      ) : (
                                        ing.recipe_use || '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <FormControl fullWidth size="small">
                                          <Select
                                            value={ing.pack_size || ''}
                                            onChange={(e) => handleIngredientFieldChange(idx, 'pack_size', e.target.value)}
                                          >
                                            {UNIT_OPTIONS.map((unit) => (
                                              <MenuItem key={unit} value={unit}>
                                                {unit}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      ) : (
                                        ing.pack_size || '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          type="number"
                                          inputProps={{ step: "0.01" }}
                                          value={ing.cost || ''}
                                          onChange={(e) => handleIngredientFieldChange(idx, 'cost', e.target.value)}
                                          InputProps={{
                                            startAdornment: <InputAdornment position="start">R</InputAdornment>,
                                          }}
                                        />
                                      ) : (
                                        ing.cost ? `R${parseFloat(ing.cost).toFixed(2)}` : '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {ing.total_cost ? `R${parseFloat(ing.total_cost).toFixed(2)}` : '-'}
                                    </TableCell>
                                    {isEditing && (
                                      <TableCell>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteIngredientClick(idx)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No ingredients listed for this recipe.
                          </Typography>
                        )}
                        
                        {/* Actions Section (only in edit mode) */}
                        {isEditing && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                            <Button 
                              variant="outlined" 
                              color="inherit" 
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              onClick={handleSaveChanges}
                            >
                              Save Changes
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

      {/* Delete Recipe Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the recipe "{recipeToDelete?.description}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Ingredient Confirmation Dialog */}
      <Dialog
        open={deleteIngredientConfirmOpen}
        onClose={() => setDeleteIngredientConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this ingredient from the recipe? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIngredientConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteIngredientConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Ingredient Dialog */}
      <Dialog
        open={addIngredientDialogOpen}
        onClose={() => setAddIngredientDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Ingredient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ingredient Description"
                value={newIngredient.description}
                onChange={(e) => setNewIngredient({...newIngredient, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Code"
                value={newIngredient.ingr_prod_code}
                onChange={(e) => setNewIngredient({...newIngredient, ingr_prod_code: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity Used"
                type="number"
                inputProps={{ step: "0.001" }}
                value={newIngredient.recipe_use}
                onChange={(e) => setNewIngredient({...newIngredient, recipe_use: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newIngredient.pack_size}
                  label="Unit"
                  onChange={(e) => setNewIngredient({...newIngredient, pack_size: e.target.value})}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unit Cost"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newIngredient.cost}
                onChange={(e) => setNewIngredient({...newIngredient, cost: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddIngredientDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddIngredientSave} color="primary" variant="contained" disabled={!newIngredient.description}>
            Add Ingredient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeListTable;
