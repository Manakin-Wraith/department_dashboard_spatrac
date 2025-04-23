import React from 'react';
import IngredientRow from './IngredientRow';

const IngredientDetailsSection = ({ ingredients, setIngredients }) => {
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
      {
        ingredient: '',
        batch_code: '',
        qty_used: '',
        supplier_name: '',
        receiving_date: '',
        sell_by_date: '',
        country_of_origin: ''
      }
    ]);
  };

  const handleRemove = index => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="ingredient-details-section">
      <h2>Ingredients Required</h2>
      <table>
        <thead>
          <tr>
            <th>Ingredient Name/ID</th>
            <th>Supplier</th>
            <th>Input Batch Code</th>
            <th>Qty Used</th>
            <th>Received Date</th>
            <th>Batch Sell-by</th>
            <th>Origin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((row, index) => (
            <IngredientRow
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

export default IngredientDetailsSection;
