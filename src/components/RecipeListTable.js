import React from 'react';

const RecipeListTable = ({ data = [], onEdit }) => (
  <table className="recipe-list-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Yield</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map(r => (
        <tr key={r.id || r.uid}>
          <td>{r.name || r.title}</td>
          <td>{r.yield || '-'}</td>
          <td>
            <button onClick={() => onEdit(r)}>Edit</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default RecipeListTable;
