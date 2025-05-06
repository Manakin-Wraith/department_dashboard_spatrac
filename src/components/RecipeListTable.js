import React, { useState, Fragment } from 'react';
import {
  Box, Typography, Button, Collapse, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const RecipeListTable = ({ data = [], onEdit, departments = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const theme = useTheme();

  const handleExpandClick = (productCode) => {
    setExpandedRow(expandedRow === productCode ? null : productCode);
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5, width: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          No recipes found for the current selection.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
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
          {data.map((r) => {
            const recipeDepartmentName = r.department || 'Unknown';
            const deptObj = departments.find(d => d.department && d.department.toUpperCase() === recipeDepartmentName.toUpperCase()) || {};
            const accentColor = deptObj?.color || theme.palette.grey[500];
            const ingredientCount = r.ingredients ? r.ingredients.length : 0;
            const DepartmentIconComponent = deptObj.icon ? iconMap[deptObj.icon] : null;
            const isExpanded = expandedRow === r.product_code;

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
                    ) : (
                      <Box sx={{ width: 32, height: 32 }} />
                    )}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {r.description || 'Unnamed Recipe'} ({ingredientCount})
                  </TableCell>
                  <TableCell>{r.product_code || '-'}</TableCell>
                  <TableCell>
                    {r.cost_excl_per_each_kg ? `R${parseFloat(r.cost_excl_per_each_kg).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button size="small" variant="outlined" color="primary" onClick={() => onEdit(r)} sx={{ mr: 1 }}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1, p: 2, border: '1px solid rgba(224, 224, 224, 1)', borderRadius: '4px' }}>
                        <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'medium' }}>
                          Ingredients 
                        </Typography>
                        {ingredientCount > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {r.ingredients.map((ing, idx) => (
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" component="span">
                                  {ing.description || 'Unnamed Ingredient'}
                                </Typography>
                                <Chip
                                  label={`${ing.recipe_use || '-'} ${ing.pack_size || ''}`.trim()}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No ingredients listed for this recipe.
                          </Typography>
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
  );
};

export default RecipeListTable;
