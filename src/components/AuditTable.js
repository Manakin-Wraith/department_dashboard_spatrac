import React from 'react';

const AuditTable = ({ data = [], onView }) => (
  <table className="audit-table">
    <thead>
      <tr>
        <th>UID</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.uid}>
          <td>{item.uid}</td>
          <td>{item.date || '-'}</td>
          <td>
            <button onClick={() => onView(item)}>View</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default AuditTable;
