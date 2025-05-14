/**
 * Supplier-Ingredient Mapping Utilities
 * 
 * This module provides shared utility functions for working with supplier-ingredient mappings,
 * used by both the frontend application and utility scripts.
 */

/**
 * Normalize department code to a standard format
 * @param {string|number} departmentCode - The department code to normalize
 * @returns {string} Normalized department code
 */
function normalizeDepartmentCode(departmentCode) {
  if (!departmentCode) return 'BUTCHERY'; // Default to BUTCHERY if no department provided
  
  // Convert to string and trim
  const code = String(departmentCode).trim();
  
  // Map department codes to standard names
  const departmentMap = {};
  
  // Add mappings for both string and number formats
  // Bakery department
  departmentMap['1154'] = 'BAKERY';
  departmentMap[1154] = 'BAKERY';
  
  // Butchery department
  departmentMap['1152'] = 'BUTCHERY';
  departmentMap[1152] = 'BUTCHERY';
  
  // HMR department
  departmentMap['1155'] = 'HMR';
  departmentMap[1155] = 'HMR';
  
  // Add more mappings as needed
  
  // Check if it's a mapped code
  if (departmentMap[code]) {
    return departmentMap[code];
  }
  
  // Check if it's a department name
  const upperInput = code.toUpperCase();
  if (['BAKERY', 'BUTCHERY', 'HMR'].includes(upperInput)) {
    return upperInput;
  }
  
  // If we can't normalize, return the default
  return 'BUTCHERY';
}

/**
 * Extract ingredient code from an ingredient description
 * @param {string} ingredientDesc - Ingredient description
 * @returns {object} Object containing extracted code and cleaned description
 */
function extractIngredientInfo(ingredientDesc) {
  if (!ingredientDesc) return { code: null, description: '' };
  
  const cleanDesc = ingredientDesc.trim();
  let code = null;
  
  // Method 1: Look for code in parentheses at the end: "INGREDIENT NAME (CODE)"
  const codeMatch = cleanDesc.match(/\(([^)]+)\)$/);
  if (codeMatch) {
    code = codeMatch[1].trim();
    return { 
      code, 
      description: cleanDesc.replace(/\s*\([^)]+\)$/, '').trim() 
    };
  }
  
  // Method 2: Check if the ingredient name contains numeric parts
  const numericMatch = cleanDesc.match(/\b(\d{4,})\b/); // Look for 4+ digit numbers
  if (numericMatch) {
    code = numericMatch[1];
    return { code, description: cleanDesc };
  }
  
  // No code found
  return { code: null, description: cleanDesc };
}

/**
 * Create a searchable version of text for fuzzy matching
 * @param {string} text - Text to prepare for searching
 * @returns {string} Searchable version of the text
 */
function createSearchableText(text) {
  if (!text) return '';
  
  return text
    .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
    .trim()                   // Remove leading/trailing spaces
    .toLowerCase();           // Convert to lowercase
}

/**
 * Find supplier for an ingredient in CSV data
 * @param {string} ingredientInput - Ingredient name or code to look up
 * @param {string} department - Department code
 * @param {Array} csvData - CSV data to search
 * @param {Object} options - Search options
 * @returns {Object|null} Supplier details or null if not found
 */
function findSupplierForIngredient(ingredientInput, department, csvData, options = {}) {
  const { ignoreDepartment = false } = options;
  
  if (!ingredientInput || !csvData || !Array.isArray(csvData)) {
    console.log(`Invalid input for findSupplierForIngredient: ingredientInput=${ingredientInput}, csvData length=${csvData?.length}`);
    return null;
  }
  
  // Normalize department
  const normalizedDept = normalizeDepartmentCode(department);
  console.log(`Looking up supplier for ingredient "${ingredientInput}" in department ${normalizedDept}`);
  
  // Try to extract ingredient code from the ingredient name
  // Format could be "INGREDIENT NAME (CODE)" or just "INGREDIENT NAME"
  const codeMatch = String(ingredientInput).match(/\(([^)]+)\)$/);
  const ingredientCode = codeMatch ? codeMatch[1] : null;
  
  // Clean the ingredient name for text search
  const cleanName = String(ingredientInput).replace(/\([^)]+\)$/, '').trim().toUpperCase();
  
  // Filter by department if required
  const deptFilteredData = ignoreDepartment 
    ? csvData 
    : csvData.filter(row => normalizeDepartmentCode(row._department) === normalizedDept);
  
  // First try exact match by ingredient code
  if (ingredientCode) {
    console.log(`Trying exact code match for "${ingredientCode}"`);
    
    // Look for exact code match
    const exactMatch = deptFilteredData.find(row => {
      const rowCode = row['ing.prod_code'] || '';
      return rowCode === ingredientCode;
    });
    
    if (exactMatch) {
      console.log(`Found exact code match for "${ingredientCode}": ${exactMatch.supplier_name}`);
      return createSupplierDetail(exactMatch);
    }
  }
  
  // If no exact match by code, try partial text match on description
  console.log(`Trying text match for "${cleanName}"`);
  
  // Look for partial text match
  const textMatch = deptFilteredData.find(row => {
    const rowDesc = (row.product_description || '').toUpperCase();
    return rowDesc.includes(cleanName) || cleanName.includes(rowDesc);
  });
  
  if (textMatch) {
    console.log(`Found text match for "${cleanName}": ${textMatch.supplier_name}`);
    return createSupplierDetail(textMatch);
  }
  
  // If still no match and we're not already ignoring department, try again ignoring department
  if (!ignoreDepartment) {
    console.log(`No match found in department ${normalizedDept}, trying all departments...`);
    return findSupplierForIngredient(ingredientInput, department, csvData, { ignoreDepartment: true });
  }
  
  console.log(`No supplier found for "${ingredientInput}"`);
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
    product_code: row.supplier_product_code || row['ing.prod_code'] || '',
    ean: row.ean || '',
    description: row.product_description || '',
    pack_size: row.pack_size || ''
  };
}

module.exports = {
  normalizeDepartmentCode,
  extractIngredientInfo,
  createSearchableText,
  findSupplierForIngredient
};
