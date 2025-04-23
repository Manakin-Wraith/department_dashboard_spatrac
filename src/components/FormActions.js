import React from 'react';
import { useNavigate } from 'react-router-dom';

const FormActions = () => {
  const navigate = useNavigate();
  return (
    <div className="form-actions">
      <button type="submit">Submit</button>
      <button type="button" onClick={() => navigate(-1)}>Cancel</button>
    </div>
  );
};

export default FormActions;
