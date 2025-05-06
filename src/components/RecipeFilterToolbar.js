import React, { useState, useEffect } from 'react';
import { Grid, Box, Button, Avatar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import departments from '../data/department_table.json';

// Map JSON icon key to component
const iconMap = { BakeryDiningIcon, SetMealIcon, SoupKitchenIcon };

const RecipeFilterToolbar = ({ onFilterChange, onCreate, initialDepartment = '', lockDepartment = false }) => {
  const [department, setDepartment] = useState(initialDepartment);
  const theme = useTheme();

  useEffect(() => {
    // Sync local 'department' state with 'initialDepartment' prop when it changes.
    // This ensures the toolbar accurately reflects the parent's filter state.
    // No need to call onFilterChange here, as the parent (RecipeListPage) manages the filter state.
    setDepartment(initialDepartment);
  }, [initialDepartment]);

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} sm={8} md={9}>
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 56 }}>
            {(() => {
              // Use the internal 'department' state which is synced with 'initialDepartment'
              const deptObj = departments.find(d => d.department === department);
              if (deptObj && deptObj.icon && iconMap[deptObj.icon]) {
                const IconComponent = iconMap[deptObj.icon];
                const iconColor = theme.palette.getContrastText(deptObj.color);
                return (
                  <Avatar sx={{ bgcolor: deptObj.color, color: iconColor, mr: 1.5 }}>
                    <IconComponent />
                  </Avatar>
                );
              }
              return null; // No icon if 'All Departments' or department has no icon
            })()}
            <Typography variant="h6" component="span" sx={{ fontWeight: 500 }}>
              {department || 'All Recipes'} {/* Display department name or 'All Recipes' */}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          <Button variant="contained" color="primary" onClick={onCreate} sx={{ width: { xs: '100%', sm: 'auto'} }}>
            Create New Recipe
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeFilterToolbar;
