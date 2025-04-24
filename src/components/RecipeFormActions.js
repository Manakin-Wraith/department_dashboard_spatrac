import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress } from '@mui/material';

const RecipeFormActions = ({ isSubmitting = false }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
      <Button variant="outlined" onClick={() => navigate(-1)}>
        Cancel
      </Button>
      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
      </Button>
    </Box>
  );
};

export default RecipeFormActions;
