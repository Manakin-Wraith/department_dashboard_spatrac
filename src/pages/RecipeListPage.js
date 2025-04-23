import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipes } from '../services/api';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import RecipeFilterToolbar from '../components/RecipeFilterToolbar';
import RecipeListTable from '../components/RecipeListTable';

const RecipeListPage = () => {
  const { department } = useParams();
  const navigate = useNavigate();
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
    <div>
      <PageHeader title="Recipes" />
      <DepartmentTabs />
      <RecipeFilterToolbar onFilterChange={handleFilterChange} onCreate={handleCreate} />
      <RecipeListTable data={recipes} onEdit={handleEdit} />
    </div>
  );
};

export default RecipeListPage;
