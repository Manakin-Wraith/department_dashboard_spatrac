import React from 'react';

const RecipeDetailsSection = ({ details, setDetails }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="recipe-details-section">
      <h2>Recipe Details</h2>
      <label>
        Recipe Title:
        <input
          type="text"
          name="title"
          value={details.title}
          onChange={handleChange}
        />
      </label>
      <label>
        Yield:
        <input
          type="text"
          name="yield"
          value={details.yield}
          onChange={handleChange}
        />
      </label>
      <label>
        Instructions:
        <textarea
          name="instructions"
          value={details.instructions}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};

export default RecipeDetailsSection;
