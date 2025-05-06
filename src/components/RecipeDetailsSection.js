import React from 'react';
import { GridLegacy as Grid, Box, TextField, Typography, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import departmentData from '../data/department_table.json'; // Import department data

const RecipeDetailsSection = ({ details, setDetails }) => {
  const { department: departmentSlug } = useParams(); // Get department slug from URL, rename to avoid clash

  const handleChange = e => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  let managerName = 'N/A';
  let currentDepartmentInfo = null; // Initialize to see if it's found

  if (departmentSlug) {
    currentDepartmentInfo = departmentData.find(
      // Match against department_code instead of department name slug
      (dept) => dept.department_code === departmentSlug 
    );
    if (currentDepartmentInfo) {
      managerName = currentDepartmentInfo.department_manager;
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Recipe Details
      </Typography>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ py: 0.5 }}>
              <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                Recipe Title
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {details.title || '—'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ py: 0.5 }}>
              <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                Cost/Yield
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {details.yield || '—'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ py: 0.5 }}>
              <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                Department Manager
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {managerName}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date Created"
              name="date_created"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={details.date_created || ''}
              onChange={handleChange}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Allergens"
              name="allergens"
              value={details.allergens || ''}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Instructions"
              name="instructions"
              value={details.instructions || ''}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RecipeDetailsSection;
