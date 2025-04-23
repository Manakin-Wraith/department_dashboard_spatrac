import React, { useState } from 'react';

const RecipeFilterToolbar = ({ onFilterChange, onCreate }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const handleSearch = e => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({ search: value, status });
  };
  const handleStatus = e => {
    const value = e.target.value;
    setStatus(value);
    onFilterChange({ search, status: value });
  };

  return (
    <div className="recipe-filter-toolbar">
      <input
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={handleSearch}
      />
      <select value={status} onChange={handleStatus}>
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <button onClick={onCreate}>Create New Recipe</button>
    </div>
  );
};

export default RecipeFilterToolbar;
