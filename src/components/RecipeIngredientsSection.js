import React from 'react';
import RecipeIngredientRow from './RecipeIngredientRow';

const RecipeIngredientsSection = ({ ingredients, setIngredients }) => {
  const handleRowChange = (index, name, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const handleAdd = () => {
    setIngredients(prev => [
      ...prev,
      { ingredient: '', quantity: '', unit: '' }
    ]);
  };

  const handleRemove = index => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="recipe-ingredients-section">
      <h2>Recipe Ingredients</h2>
      <table>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((row, index) => (
            <RecipeIngredientRow
              key={index}
              row={row}
              onChange={(name, value) => handleRowChange(index, name, value)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </tbody>
      </table>
      <button type="button" onClick={handleAdd}>+ Add Ingredient</button>
    </div>
  );
};

export default RecipeIngredientsSection;
