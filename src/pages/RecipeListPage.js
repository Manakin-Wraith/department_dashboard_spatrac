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
  
  // Find the department object from the department_table.json
  const deptObj = React.useMemo(() => {
    // Try to find by exact match first
    let dept = departments.find(d => d.department_code === department);
    
    // If not found, try case-insensitive match
    if (!dept && department) {
      dept = departments.find(d => 
        d.department_code.toLowerCase() === department.toLowerCase() ||
        d.department.toLowerCase() === department.toLowerCase()
      );
    }
    
    console.log(`Department lookup for '${department}':`, dept || 'Not found');
    return dept || {};
  }, [department]);
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ department: deptObj.department || '' });
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);

  useEffect(() => {
    setFilters(prevFilters => ({ ...prevFilters, department: deptObj.department || '' }));
  }, [deptObj.department]);

  useEffect(() => {
    async function loadRecipes() {
      // Don't attempt to load if we don't have a department
      if (!department && !filters.department) {
        console.warn('Cannot load recipes: No department specified');
        setRecipes([]);
        return;
      }
      
      // Use the department from URL params or from filters
      const deptCode = department || filters.department;
      console.log(`Loading recipes for department: ${deptCode}`);
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the enhanced fetchRecipes function with department parameter
        const recipesData = await fetchRecipes(deptCode);
        console.log(`Fetched ${recipesData.length} recipes for department ${deptCode}`);
        
        // The fetchRecipes function now handles department filtering, so we don't need to filter again
        setRecipes(recipesData);
      } catch (error) {
        console.error(`Failed to fetch recipes for department ${deptCode}:`, error);
        setError(`Error loading recipes: ${error.message}`);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadRecipes();
  }, [department, filters.department]); 

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
          initialDepartment={deptObj.department || ''} 
          lockDepartment={!!department} 
        />
      </Box>
      
      <Box sx={{ mt: 1 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <p>Loading recipes...</p>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
            <p>{error}</p>
          </Box>
        ) : recipes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <p>No recipes found for {deptObj.department || department}. Try creating a new recipe.</p>
          </Box>
        ) : (
          <RecipeListTable data={recipes} onEdit={handleEdit} departments={departments} onAddRecipe={handleOpenCreateRecipeModal} />
        )}
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
