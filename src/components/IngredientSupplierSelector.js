import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import supplierTable from '../data/supplier_table.json';

/**
 * IngredientSupplierSelector
 * Props:
 *   value: supplier_name (string)
 *   onChange: (newSupplierName) => void
 *   ingredient: ingredient object (for context, not required)
 */
const IngredientSupplierSelector = ({ value, onChange, ingredient }) => {
  // Optionally filter suppliers based on ingredient/department
  return (
    <Autocomplete
      options={supplierTable}
      getOptionLabel={opt => opt.supplier_name}
      value={supplierTable.find(s => s.supplier_name === value) || null}
      onChange={(_, v) => onChange(v ? v.supplier_name : '')}
      renderInput={params => (
        <TextField {...params} label="Supplier" variant="standard" size="small" margin="dense" />
      )}
      isOptionEqualToValue={(opt, val) => opt.supplier_name === val.supplier_name}
    />
  );
};

export default IngredientSupplierSelector;
