import React from 'react';

const IngredientRow = ({ row, onChange, onRemove }) => {
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
          placeholder="Select Ingredient"
        />
      </td>
      <td>
        <input type="text" name="supplier_name" value={row.supplier_name} readOnly />
      </td>
      <td>
        <input
          type="text"
          name="batch_code"
          value={row.batch_code}
          onChange={handleChange}
          placeholder="Select Batch"
        />
      </td>
      <td>
        <input
          type="number"
          name="qty_used"
          value={row.qty_used}
          onChange={handleChange}
        />
      </td>
      <td>
        <input type="date" name="receiving_date" value={row.receiving_date} readOnly />
      </td>
      <td>
        <input type="date" name="sell_by_date" value={row.sell_by_date} readOnly />
      </td>
      <td>
        <input
          type="text"
          name="country_of_origin"
          value={row.country_of_origin}
          readOnly
        />
      </td>
      <td>
        <button type="button" onClick={onRemove}>
          Remove
        </button>
      </td>
    </tr>
  );
};

export default IngredientRow;
