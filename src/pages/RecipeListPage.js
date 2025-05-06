import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../services/api';
import RecipeFilterToolbar from '../components/RecipeFilterToolbar';
import RecipeListTable from '../components/RecipeListTable';
import AddRecipeModal from '../components/AddRecipeModal';
import departments from '../data/department_table.json';
import { Box } from '@mui/material';

const RecipeListPage = () => {
  const { department } = useParams();
  const navigate = useNavigate();
  
  const deptObj = React.useMemo(() => departments.find(d => d.department_code === department) || {}, [department]);
  
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState({ department: deptObj.department || '' });
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);

  useEffect(() => {
    setFilters(prevFilters => ({ ...prevFilters, department: deptObj.department || '' }));
  }, [deptObj.department]);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const allRecipesData = await fetchRecipes();
        const recipesData = Array.isArray(allRecipesData[0]) && allRecipesData.length === 1 ? allRecipesData[0] : allRecipesData;
        
        let filtered = recipesData;
        if (filters.department) {
          filtered = recipesData.filter(r => r.department && r.department.toUpperCase() === filters.department.toUpperCase());
        }
        setRecipes(filtered);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        setRecipes([]); 
      }
    }
    if (filters.department !== undefined) { 
        loadRecipes();
    }
  }, [filters]); 

  const handleFilterChange = newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleOpenCreateRecipeModal = () => {
    setIsAddRecipeModalOpen(true);
  };

  const handleCloseCreateRecipeModal = () => {
    setIsAddRecipeModalOpen(false);
  };

  const handleAddRecipeFromModal = (newRecipeData) => {
    const currentDepartmentCode = deptObj.department_code || department;
    if (currentDepartmentCode) {
      navigate(`/production/${currentDepartmentCode}/recipes/new`, { 
        state: { title: newRecipeData.title, yield: newRecipeData.yield } 
      });
    } else {
      navigate('/recipes/new', { 
        state: { title: newRecipeData.title, yield: newRecipeData.yield } 
      }); 
      console.log('Attempting to create new recipe without specific department context.');
    }
    handleCloseCreateRecipeModal(); 
  };

  const handleEdit = recipe => {
    const recipeId = recipe.product_code;
    const recipeDeptObj = departments.find(d => d.department && recipe.department && d.department.toUpperCase() === recipe.department.toUpperCase());
    const departmentCodeForNav = recipeDeptObj?.department_code || deptObj.department_code || department;

    if (recipeId && departmentCodeForNav) {
      navigate(`/production/${departmentCodeForNav}/recipes/${recipeId}`);
    } else if (recipeId) {
      navigate(`/recipes/${recipeId}`); 
      console.warn(`Navigating to edit recipe ${recipeId} without clear department context. Recipe's department: ${recipe.department}`);
    } else {
      console.error('Cannot edit recipe: Missing recipe ID or department context.');
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', py: 2 }}> 
      
      <Box sx={{ my: 2 }}>
        <RecipeFilterToolbar
          onFilterChange={handleFilterChange}
          onCreate={handleOpenCreateRecipeModal}
          initialDepartment={deptObj.department || ''} 
          lockDepartment={!!department} 
        />
      </Box>
      
      <Box sx={{ mt: 1 }}>
        <RecipeListTable data={recipes} onEdit={handleEdit} departments={departments} />
      </Box>

      <AddRecipeModal
        open={isAddRecipeModalOpen}
        onClose={handleCloseCreateRecipeModal}
        onAddRecipe={handleAddRecipeFromModal}
      />
    </Box>
  );
};

export default RecipeListPage;
