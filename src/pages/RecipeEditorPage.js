import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipe, saveRecipe } from '../services/api';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import InfoCard from '../components/InfoCard';
import RecipeDetailsSection from '../components/RecipeDetailsSection';
import RecipeIngredientsSection from '../components/RecipeIngredientsSection';
import FormActions from '../components/FormActions';

const RecipeEditorPage = () => {
  const { department, recipeId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState({ title: '', yield: '', instructions: '' });
  const [ingredients, setIngredients] = useState([{ ingredient: '', quantity: '', unit: '' }]);
  const [lastModified, setLastModified] = useState('');

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

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await saveRecipe(department, recipeId, { ...details, ingredients });
      navigate(`/production/${department}/recipes`);
    } catch (err) {
      console.error(err);
    }
  };

  const pageTitle = recipeId ? `Edit Recipe (${recipeId})` : 'Create New Recipe';
  return (
    <div className="recipe-editor-page">
      <PageHeader title={pageTitle} />
      <DepartmentTabs />
      <div className="info-cards-row">
        <InfoCard title="Recipe Title" value={details.title} />
        <InfoCard title="Yield" value={details.yield} />
        <InfoCard title="Last Modified" value={lastModified} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid two-column">
          <RecipeDetailsSection details={details} setDetails={setDetails} />
          <RecipeIngredientsSection ingredients={ingredients} setIngredients={setIngredients} />
        </div>
        <FormActions />
      </form>
    </div>
  );
};

export default RecipeEditorPage;
