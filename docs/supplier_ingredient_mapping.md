# Supplier-Ingredient Mapping System

This document provides an overview of the supplier-ingredient mapping system in the SPATRAC application, including how supplier details are populated in audit records and how department managers are auto-populated.

## Overview

The supplier-ingredient mapping system is responsible for:

1. Mapping ingredients to their suppliers based on department-specific CSV files
2. Populating supplier details in audit records
3. Auto-populating department manager names based on department codes

## Data Sources

The system uses the following data sources:

### CSV Files

Department-specific CSV files located in `public/DEPT_DATA/`:

- `Bakery.csv` - Supplier-ingredient mappings for the Bakery department
- `Butchery.csv` - Supplier-ingredient mappings for the Butchery department
- `HMR.csv` - Supplier-ingredient mappings for the HMR department

These files follow a consistent structure with columns:
- `supplier_code`
- `supplier_name`
- `supplier_product_code`
- `ing.prod_code`
- `ean`
- `product_description`
- `pack_size`

### Department Codes

The system uses the following department codes:

- `1154` - Bakery
- `1152` - Butchery
- `1155` - HMR

### Department Managers

Department managers are mapped to department codes as follows:

- `1154` (Bakery) - Monica
- `1152` (Butchery) - Clive
- `1155` (HMR) - Monica

## Key Components

### Utility Module (`supplierIngredientUtils.js`)

This module provides shared utility functions for working with supplier-ingredient mappings:

- `normalizeDepartmentCode` - Normalizes department codes to standard format
- `extractIngredientInfo` - Extracts ingredient code from an ingredient description
- `createSearchableText` - Creates a searchable version of text for fuzzy matching
- `findSupplierForIngredient` - Finds supplier details for an ingredient using various matching strategies

### Supplier Lookup Service (`supplierLookupService.js`)

This service provides functions to look up supplier information for ingredients:

- `findSupplierForIngredient` - Finds supplier details for a specific ingredient in a department
- `useSupplierLookup` - React hook to look up supplier details for ingredients
- `extractIngredientCodes` - Extracts ingredient codes from ingredient names

### API Service (`api.js`)

The API service includes functions for working with audit records:

- `saveAudit` - Saves an audit record with supplier details and department manager
- `loadAllCSVData` - Loads all CSV data from all departments
- `getDepartmentManager` - Gets the department manager name for a given department code

### Update Script (`update_supplier_data.js`)

This script updates existing audit records with supplier details and department manager names:

- `updateAuditRecords` - Updates both supplier details and department manager names in a single operation
- `loadAllCSVData` - Loads all CSV data from all departments
- `getDepartmentManager` - Gets the department manager name for a given department code

## Supplier Lookup Process

The system uses the following process to look up supplier details for an ingredient:

1. Normalize the department code to a standard format (BAKERY, BUTCHERY, HMR)
2. Load CSV data for the department
3. Try to find a supplier match using various strategies:
   - Exact match on ingredient code
   - Match on supplier product code
   - Match on EAN
   - Fuzzy match on product description
4. If no match is found in the department, try searching across all departments
5. Create a supplier detail object with all necessary fields
6. Update the audit record with the supplier details

## Department Manager Auto-Population

The system auto-populates department manager names based on department codes:

1. Check if the audit record already has a department manager
2. If not, look up the department manager name based on the department code
3. Update the audit record with the department manager name

## Usage Examples

### Creating a New Audit Record

When creating a new audit record, the system automatically populates supplier details and department manager:

```javascript
const auditRecord = {
  department: '1154',
  ingredient_list: ['W/CAPE MILL  MIX WHT BRD', 'YEAST WET']
};

const savedAudit = await api.saveAudit(auditRecord);
```

### Updating Existing Audit Records

To update existing audit records with supplier details and department manager names:

```javascript
// Run from the command line
node src/scripts/update_supplier_data.js --source=csv
```

## Troubleshooting

### Missing Supplier Details

If supplier details are missing for an ingredient:

1. Check if the ingredient exists in the department CSV file
2. Verify that the ingredient name matches the product description in the CSV file
3. Try running the update script with the `--source=csv` option

### Incorrect Department Manager

If the department manager is incorrect:

1. Check the department code in the audit record
2. Verify that the department code is mapped to the correct manager in the `getDepartmentManager` function
3. Try running the update script to update the department manager

## Future Improvements

Potential improvements to the supplier-ingredient mapping system:

1. Add a UI for managing supplier-ingredient mappings
2. Implement a more robust fuzzy matching algorithm for ingredient names
3. Add support for multiple suppliers per ingredient
4. Implement a caching system for supplier lookups to improve performance
