import React from 'react';

const RecipeIngredientRow = ({ row, onChange, onRemove }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <tr>
      <td>
        <input
          type="text"
          name="ingredient"
          value={row.ingredient}
          onChange={handleChange}
          placeholder="Ingredient"
        />
      </td>
      <td>
        <input
          type="number"
          name="quantity"
          value={row.quantity}
          onChange={handleChange}
          placeholder="Qty"
        />
      </td>
      <td>
        <input
          type="text"
          name="unit"
          value={row.unit}
          onChange={handleChange}
          placeholder="Unit"
        />
      </td>
      <td>
        <button type="button" onClick={onRemove}>Remove</button>
      </td>
    </tr>
  );
};

export default RecipeIngredientRow;
