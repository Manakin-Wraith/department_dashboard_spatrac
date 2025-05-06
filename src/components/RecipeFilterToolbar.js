import React, { useState, useEffect } from 'react';
import { GridLegacy as Grid, Box, Button, Avatar } from '@mui/material';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import departments from '../data/department_table.json';
// Map JSON icon key to component
const iconMap = { BakeryDiningIcon, SetMealIcon, SoupKitchenIcon };


const RecipeFilterToolbar = ({ onFilterChange, onCreate, initialDepartment = '', lockDepartment = false }) => {
  const [department, setDepartment] = useState(initialDepartment);

  // Only call onFilterChange once on mount if initialDepartment is set
  // Only call onFilterChange once when initialDepartment is set for the first time
  useEffect(() => {
    if (initialDepartment) {
      setDepartment(initialDepartment);
      onFilterChange({ department: initialDepartment });
    }
    // eslint-disable-next-line
  }, [initialDepartment]);


  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5}>
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 56, pl: 1 }}>
            {(() => {
              const deptObj = departments.find(d => d.department === department);
              if (deptObj && deptObj.icon && iconMap[deptObj.icon]) {
                const IconComponent = iconMap[deptObj.icon];
                return (
                  <Avatar sx={{ bgcolor: deptObj.color, mr: 1 }}>
                    <IconComponent />
                  </Avatar>
                );
              }
              return null;
            })()}
            <span style={{ fontWeight: 600, fontSize: 20 }}>
              {department || 'All Departments'}
            </span>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onCreate}>
            Create New Recipe
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeFilterToolbar;
