import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipe, saveRecipe } from '../services/api';
import PageHeader from '../components/PageHeader';
import InfoCard from '../components/InfoCard';
import RecipeDetailsSection from '../components/RecipeDetailsSection';
import RecipeIngredientsSection from '../components/RecipeIngredientsSection';
import RecipeFormActions from '../components/RecipeFormActions';
import departments from '../data/department_table.json';
import { Box, Grid, Avatar, Typography, Snackbar, Alert } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';

const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const RecipeEditorPage = () => {
  const { department, recipeId } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const accentColor = deptObj.color;
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const navigate = useNavigate();
  const [details, setDetails] = useState({ title: '', yield: '', instructions: '' });
  const [ingredients, setIngredients] = useState([{ ingredient: '', quantity: '', unit: '' }]);
  const [lastModified, setLastModified] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const handleClose = () => setSnackbar(s => ({ ...s, open: false }));

  useEffect(() => {
    if (recipeId) {
      async function loadRecipe() {
        try {
          const recipe = await fetchRecipe(department, recipeId);
          setDetails({ title: recipe.title, yield: recipe.yield, instructions: recipe.instructions });
          setIngredients(recipe.ingredients || []);
          setLastModified(recipe.updated_at || recipe.lastModified || new Date().toLocaleString());
        } catch (err) {
          console.error(err);
        }
      }
      loadRecipe();
    }
  }, [department, recipeId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saveRecipe(department, recipeId, { ...details, ingredients });
      setSnackbar({ open: true, message: 'Recipe saved successfully!', severity: 'success' });
      navigate(`/production/${department}/recipes`);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to save recipe. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const pageTitle = recipeId ? `Edit Recipe (${recipeId})` : 'Create New Recipe';
  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <PageHeader title={pageTitle} />
        <Box className="info-cards-row">
          <InfoCard
            title="Department"
            value={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: accentColor,
                    color: theme.palette.getContrastText(accentColor),
                    width: 24,
                    height: 24
                  }}
                >
                  {(() => {
                    const IconComponent = iconMap[deptObj.icon];
                    return IconComponent ? <IconComponent fontSize="small" /> : deptObj.department.charAt(0);
                  })()}
                </Avatar>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {deptObj.department}
                </Typography>
              </Box>
            }
          />
          <InfoCard title="Recipe Title" value={details.title} />
          <InfoCard title="Yield" value={details.yield} />
          <InfoCard title="Last Modified" value={lastModified} />
        </Box>
        <Box sx={{ width: '100%', mt: 4 }} component="form" onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <RecipeDetailsSection details={details} setDetails={setDetails} />
            </Grid>
            <Grid item xs={12} md={6}>
              <RecipeIngredientsSection ingredients={ingredients} setIngredients={setIngredients} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <RecipeFormActions isSubmitting={isLoading} />
          </Box>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecipeEditorPage;
