import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchRecipe, saveRecipe } from '../services/api';
import PageHeader from '../components/PageHeader';
import InfoCard from '../components/InfoCard';
import RecipeDetailsSection from '../components/RecipeDetailsSection';
import RecipeIngredientsSection from '../components/RecipeIngredientsSection';
import RecipeFormActions from '../components/RecipeFormActions';
import departments from '../data/department_table.json';
import { GridLegacy as Grid, Box, Avatar, Typography, Snackbar, Alert } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';

const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const RecipeEditorPage = () => {
  const { department, recipeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const accentColor = deptObj.color;
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const [details, setDetails] = useState({ title: '', yield: '', instructions: '' });
  const [ingredients, setIngredients] = useState([{ ingredient: '', quantity: '', unit: '' }]);
  const [lastModified, setLastModified] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const handleClose = () => setSnackbar(s => ({ ...s, open: false }));

  useEffect(() => {
    if (recipeId === 'new') {
      setIsLoading(true);
      const { title, yield: costYield } = location.state || { title: '', yield: '' };
      setDetails({
        title: title || '',
        yield: costYield || '',
        instructions: ''
      });
      setIngredients([{ ingredient: '', quantity: '', unit: '' }]);
      setLastModified(new Date().toLocaleString());
      setIsLoading(false);
    } else if (recipeId) {
      async function loadRecipe() {
        setIsLoading(true);
        try {
          const recipe = await fetchRecipe(department, recipeId);
          setDetails({
            title: recipe.title || recipe.description || '',
            yield: recipe.yield || recipe.quantity || recipe.cost_excl_per_each_kg || '',
            instructions: recipe.instructions || ''
          });
          setIngredients((recipe.ingredients || []).map(ing => ({
            description: ing.description || '',
            prod_code: ing.prod_code || '',
            qty_used: ing.recipe_use || ing.quantity || '',
            supplier_name: ing.supplier_name || '',
            batch_code: '',
            receiving_date: '',
            sell_by_date: ''
          })));
          setLastModified(recipe.updated_at || recipe.lastModified || new Date().toLocaleString());
        } catch (err) {
          console.error('Failed to load recipe:', err);
          setSnackbar({ open: true, message: 'Failed to load recipe details.', severity: 'error' });
        } finally {
          setIsLoading(false);
        }
      }
      loadRecipe();
    }
  }, [department, recipeId, location.state]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let recipeIdentifierForApi = recipeId === 'new' ? null : recipeId;
      let isNewRecipe = recipeId === 'new';

      let finalPayload = {
        ...details,
        ingredients,
        department: deptObj.department, 
      };
      
      let displayIdForMessage = recipeId;

      if (isNewRecipe) {
        const safeTitle = details.title.replace(/\s+/g, '_').toLowerCase();
        const newProductCode = `${safeTitle}_${Date.now()}`;
        
        finalPayload.id = newProductCode;
        finalPayload.product_code = newProductCode;
        finalPayload.cost_excl_per_each_kg = details.yield; 
        finalPayload.description = details.title; 
        
        displayIdForMessage = newProductCode; // For the success message
      } else {
        // For existing recipes
        finalPayload.product_code = recipeId; 
        finalPayload.id = recipeId;
        finalPayload.cost_excl_per_each_kg = details.yield;
        finalPayload.description = details.title; 
      }

      await saveRecipe(department, recipeIdentifierForApi, finalPayload);
      setSnackbar({ open: true, message: `Recipe ${isNewRecipe ? 'created' : 'updated'} successfully! (ID: ${displayIdForMessage})`, severity: 'success' });
      navigate(`/production/${department}/recipes`); 
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to save recipe. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const pageTitle = recipeId === 'new' ? 'Create New Recipe' : `Edit Recipe (${recipeId || 'N/A'})`;
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
          <InfoCard title="Recipe Title" value={details.title || '—'} />
          <InfoCard title="Cost/Yield" value={details.yield || '—'} />
          <InfoCard title="Last Modified" value={lastModified || '—'} />
        </Box>
        <Box sx={{ width: '100%', mt: 4 }} component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <RecipeDetailsSection details={details} setDetails={setDetails} />
            </Grid>
            <Grid item xs={12}>
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
