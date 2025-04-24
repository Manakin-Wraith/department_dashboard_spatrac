import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../services/api';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import RecipeFilterToolbar from '../components/RecipeFilterToolbar';
import RecipeListTable from '../components/RecipeListTable';
import departments from '../data/department_table.json';
import { Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const RecipeListPage = () => {
  const { department } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRecipes(department, filters);
        setRecipes(data);
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, [department, filters]);

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
    // TODO: apply filter to recipes
  };

  const handleCreate = () => navigate(`/production/${department}/recipes/new`);

  const handleEdit = recipe => {
    const id = recipe.id || recipe.uid || '';
    navigate(`/production/${department}/recipes/${id}`);
  };

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <PageHeader title="Recipes" />
        <DepartmentTabs />
        <Box sx={{ mt: 2 }}>
          <RecipeFilterToolbar onFilterChange={handleFilterChange} onCreate={handleCreate} />
        </Box>
        <Box sx={{ mt: 3 }}>
          <RecipeListTable data={recipes} onEdit={handleEdit} />
        </Box>
      </Box>
    </Box>
  );
};

export default RecipeListPage;
