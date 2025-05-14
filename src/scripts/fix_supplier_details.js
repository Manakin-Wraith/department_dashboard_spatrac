/**
 * Script to fix supplier details in audit records
 * 
 * This script focuses on finding and updating the supplier details for all
 * ingredients in the audit records, ensuring proper population of supplier
 * names, codes, and other information.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { normalizeDepartmentCode } = require('../utils/supplierIngredientUtils');

// Path to the database file
const DB_PATH = path.join(__dirname, '../../mock/db.json');

// Path to CSV files
const CSV_PATHS = {
  BAKERY: path.join(__dirname, '../../public/DEPT_DATA/Bakery.csv'),
  HMR: path.join(__dirname, '../../public/DEPT_DATA/HMR.csv'),
  BUTCHERY: path.join(__dirname, '../../public/DEPT_DATA/Butchery.csv')
};

// Map department codes to manager names
const DEPARTMENT_MANAGERS = {
  '1154': 'Monica',  // Bakery
  1154: 'Monica',
  'BAKERY': 'Monica',
  '1152': 'Clive',   // Butchery
  1152: 'Clive',
  'BUTCHERY': 'Clive',
  '1155': 'Monica',  // HMR
  1155: 'Monica',
  'HMR': 'Monica'
};

/**
 * Load CSV data for a specific department
 * @param {string} department - Department name (BAKERY, BUTCHERY, HMR)
 * @returns {Promise<Array>} Promise resolving to array of CSV rows
 */
function loadCSVData(department) {
  return new Promise((resolve, reject) => {
    const normalizedDept = normalizeDepartmentCode(department);
    const csvPath = CSV_PATHS[normalizedDept];
    
    if (!csvPath) {
      console.error(`No CSV path found for department: ${normalizedDept}`);
      return resolve([]);
    }
    
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Loaded ${results.length} rows from ${csvPath}`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error(`Error loading CSV for ${normalizedDept}:`, error);
        reject(error);
      });
  });
}

/**
 * Load CSV data for all departments
 * @returns {Promise<Array>} Promise resolving to array of all CSV rows
 */
async function loadAllCSVData() {
  try {
    const [bakeryData, hmrData, butcheryData] = await Promise.all([
      loadCSVData('BAKERY'),
      loadCSVData('HMR'),
      loadCSVData('BUTCHERY')
    ]);
    
    // Add department info to each row
    const taggedBakeryData = bakeryData.map(row => ({ ...row, _department: 'BAKERY' }));
    const taggedHmrData = hmrData.map(row => ({ ...row, _department: 'HMR' }));
    const taggedButcheryData = butcheryData.map(row => ({ ...row, _department: 'BUTCHERY' }));
    
    // Combine all data
    const allData = [...taggedBakeryData, ...taggedHmrData, ...taggedButcheryData];
    console.log(`Loaded ${allData.length} total rows from all CSV files`);
    
    return allData;
  } catch (error) {
    console.error('Error loading all CSV data:', error);
    return [];
  }
}

/**
 * Find supplier details for an ingredient
 * @param {string} ingredientName - Ingredient name or code
 * @param {string} department - Department code or name
 * @param {Array} csvData - CSV data to search in
 * @param {Object} options - Search options
 * @returns {Object|null} Supplier details or null if not found
 */
function findSupplierForIngredient(ingredientName, department, csvData, options = {}) {
  const { ignoreDepartment = false } = options;
  
  if (!ingredientName || !csvData || !Array.isArray(csvData)) {
    return null;
  }
  
  // Normalize department
  const normalizedDept = normalizeDepartmentCode(department);
  
  // Try to extract ingredient code from the ingredient name
  // Format could be "INGREDIENT NAME (CODE)" or just "INGREDIENT NAME"
  const codeMatch = ingredientName.match(/\(([^)]+)\)$/);
  const ingredientCode = codeMatch ? codeMatch[1] : null;
  
  // Clean the ingredient name for text search
  const cleanName = ingredientName.replace(/\([^)]+\)$/, '').trim().toUpperCase();
  
  // First try exact match by ingredient code
  if (ingredientCode) {
    // Filter by department if required
    const deptFilteredData = ignoreDepartment 
      ? csvData 
      : csvData.filter(row => normalizeDepartmentCode(row._department) === normalizedDept);
    
    // Look for exact code match
    const exactMatch = deptFilteredData.find(row => {
      const rowCode = row['ing.prod_code'] || '';
      return rowCode === ingredientCode;
    });
    
    if (exactMatch) {
      return createSupplierDetail(exactMatch);
    }
  }
  
  // If no exact match by code, try partial text match on description
  // Filter by department if required
  const deptFilteredData = ignoreDepartment 
    ? csvData 
    : csvData.filter(row => normalizeDepartmentCode(row._department) === normalizedDept);
  
  // Look for partial text match
  const textMatch = deptFilteredData.find(row => {
    const rowDesc = (row.product_description || '').toUpperCase();
    return rowDesc.includes(cleanName) || cleanName.includes(rowDesc);
  });
  
  if (textMatch) {
    return createSupplierDetail(textMatch);
  }
  
  // If still no match and we're not already ignoring department, try again ignoring department
  if (!ignoreDepartment) {
    return findSupplierForIngredient(ingredientName, department, csvData, { ignoreDepartment: true });
  }
  
  // No match found
  return null;
}

/**
 * Create a supplier detail object from CSV row
 * @param {Object} row - CSV row
 * @returns {Object} Supplier detail object
 */
function createSupplierDetail(row) {
  return {
    name: row.supplier_name || 'Unknown',
    supplier_code: row.supplier_code || '',
    address: row.supplier_address || '',
    contact_person: '',
    email: '',
    phone: '',
    product_code: row.supplier_product_code || row.ing_prod_code || row['ing.prod_code'] || '',
    ean: row.ean || '',
    description: row.product_description || '',
    pack_size: row.pack_size || ''
  };
}

/**
 * Get department manager name
 * @param {string} departmentCode - Department code
 * @returns {string} Department manager name
 */
function getDepartmentManager(departmentCode) {
  if (!departmentCode) return '';
  
  // Try direct lookup
  if (DEPARTMENT_MANAGERS[departmentCode]) {
    return DEPARTMENT_MANAGERS[departmentCode];
  }
  
  // Try normalized lookup
  const normalizedDept = normalizeDepartmentCode(departmentCode);
  if (DEPARTMENT_MANAGERS[normalizedDept]) {
    return DEPARTMENT_MANAGERS[normalizedDept];
  }
  
  // Default
  return '';
}

/**
 * Update supplier details in audit records
 */
async function updateSupplierDetails() {
  try {
    console.log('Loading database...');
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    
    console.log('Loading CSV data...');
    const allCSVData = await loadAllCSVData();
    
    if (!allCSVData || allCSVData.length === 0) {
      console.error('Failed to load CSV data');
      return;
    }
    
    console.log(`Found ${db.audits.length} audit records`);
    
    // Track statistics
    let totalIngredientsUpdated = 0;
    let totalManagersUpdated = 0;
    
    // Process each audit record
    db.audits = db.audits.map(audit => {
      // Ensure department_manager is populated
      if (!audit.department_manager || audit.department_manager === '') {
        const managerName = getDepartmentManager(audit.department);
        if (managerName) {
          audit.department_manager = managerName;
          totalManagersUpdated++;
        }
      }
      
      // Skip if no ingredients
      if (!audit.ingredient_list || !Array.isArray(audit.ingredient_list) || audit.ingredient_list.length === 0) {
        return audit;
      }
      
      console.log(`Processing audit ${audit.id || audit.uid} with ${audit.ingredient_list.length} ingredients for department ${audit.department}`);
      
      // Ensure supplier_details array exists
      if (!audit.supplier_details) {
        audit.supplier_details = [];
      }
      
      // Ensure supplier_name and address_of_supplier arrays exist
      if (!audit.supplier_name) audit.supplier_name = [];
      if (!audit.address_of_supplier) audit.address_of_supplier = [];
      
      // Process each ingredient
      audit.ingredient_list.forEach((ingredient, index) => {
        if (!ingredient) return;
        
        // First try to find supplier in the same department
        let supplierDetail = findSupplierForIngredient(ingredient, audit.department, allCSVData, { ignoreDepartment: false });
        
        // If not found, try searching across all departments
        if (!supplierDetail) {
          console.log(`No supplier found for "${ingredient}" in department ${audit.department}, searching all departments...`);
          supplierDetail = findSupplierForIngredient(ingredient, audit.department, allCSVData, { ignoreDepartment: true });
        }
        
        if (supplierDetail) {
          console.log(`Found supplier details for ingredient "${ingredient}": ${supplierDetail.name}`);
          
          // Update supplier_details
          audit.supplier_details[index] = supplierDetail;
          
          // Also update supplier_name and address_of_supplier for backward compatibility
          audit.supplier_name[index] = supplierDetail.name;
          audit.address_of_supplier[index] = supplierDetail.address || '';
          
          totalIngredientsUpdated++;
        } else {
          console.log(`No supplier details found for ingredient "${ingredient}"`);
          
          // If we don't have supplier details for this index, create a placeholder
          if (!audit.supplier_details[index]) {
            const placeholderSupplier = {
              name: 'Unknown',
              supplier_code: '',
              address: '',
              contact_person: '',
              email: '',
              phone: '',
              product_code: '',
              ean: '',
              description: ingredient,
              pack_size: ''
            };
            
            audit.supplier_details[index] = placeholderSupplier;
            audit.supplier_name[index] = 'Unknown';
            audit.address_of_supplier[index] = '';
          }
        }
      });
      
      return audit;
    });
    
    console.log(`Updated ${totalIngredientsUpdated} ingredient supplier details and ${totalManagersUpdated} department manager names`);
    
    // Save the updated database
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('Database updated successfully');
    
  } catch (error) {
    console.error('Error updating supplier details:', error);
  }
}

// Run the update
updateSupplierDetails().then(() => {
  console.log('Supplier details update completed');
});
