import React from 'react';

const AuditPreviewModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Audit Preview - {item.uid}</h2>
        <pre>{JSON.stringify(item, null, 2)}</pre>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AuditPreviewModal;
