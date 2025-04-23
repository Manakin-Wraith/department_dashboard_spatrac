import React from 'react';

const AuditFilterToolbar = ({ onOpenPreview, onOpenExport }) => (
  <div className="audit-filter-toolbar">
    <label>
      Start Date:
      <input type="date" name="startDate" />
    </label>
    <label>
      End Date:
      <input type="date" name="endDate" />
    </label>
    <label>
      Product:
      <select name="productFilter">
        <option value="">All Products</option>
        {/* TODO: dynamic options */}
      </select>
    </label>
    <label>
      Status:
      <select name="statusFilter">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
      </select>
    </label>
    <button onClick={onOpenPreview}>Preview</button>
    <button onClick={onOpenExport}>Export</button>
  </div>
);

export default AuditFilterToolbar;
