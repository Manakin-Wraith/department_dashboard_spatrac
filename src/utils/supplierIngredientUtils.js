/**
 * Supplier-Ingredient Mapping Utilities
 * 
 * This module provides shared utility functions for working with supplier-ingredient mappings,
 * used by both the frontend application and utility scripts.
 */

/**
 * Normalize a department code to a standard format
 * @param {string} department - Department code to normalize
 * @returns {string} Normalized department code
 */
function normalizeDepartmentCode(department) {
  if (!department) return 'BUTCHERY'; // Default to BUTCHERY if no department provided
  
  // Map numeric codes to department names
  const deptCodeMap = {
    '1154': 'BAKERY',
    '1152': 'BUTCHERY',
    '1155': 'HMR'
  };
  
  // Normalize input
  const normalizedInput = String(department).trim();
  
  // Check if it's a numeric code
  if (deptCodeMap[normalizedInput]) {
    return deptCodeMap[normalizedInput];
  }
  
  // Check if it's a lowercase department name
  const upperInput = normalizedInput.toUpperCase();
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
 * Find supplier details for an ingredient using various matching strategies
 * @param {string} ingredientCode - Ingredient code or search term
 * @param {string} department - Department code
 * @param {Array} data - Array of supplier data (from CSV or mapping table)
 * @param {object} options - Options for the search
 * @returns {object|null} Supplier details or null if not found
 */
function findSupplierForIngredient(ingredientCode, department, data, options = {}) {
  if (!ingredientCode || !data || data.length === 0) {
    return null;
  }
  
  // Normalize inputs
  const normalizedDept = normalizeDepartmentCode(department);
  const normalizedCode = String(ingredientCode).trim();
  
  // Filter data by department if specified
  let filteredData = data;
  if (!options.ignoreDeparmtent) {
    filteredData = data.filter(item => {
      const itemDept = item.department || '';
      return normalizeDepartmentCode(itemDept) === normalizedDept;
    });
    
    // If no items for this department, fall back to all data
    if (filteredData.length === 0) {
      filteredData = data;
    }
  }
  
  // Extract ingredient info if it's a full description
  const { code: extractedCode, description: extractedDesc } = extractIngredientInfo(normalizedCode);
  const searchCode = extractedCode || normalizedCode;
  
  // Determine if we're dealing with a numeric code or text search
  const isNumeric = /^\d+$/.test(searchCode);
  const isLongText = normalizedCode.length > 10;
  
  let match = null;
  
  // Strategy 1: If it's a numeric code, try exact matches on various code fields
  if (isNumeric) {
    // Try exact match on ing.prod_code
    match = filteredData.find(item => 
      (item['ing.prod_code'] === searchCode) || 
      (item.ingredient_code === searchCode)
    );
    
    // If no match, try supplier_product_code
    if (!match) {
      match = filteredData.find(item => item.supplier_product_code === searchCode);
    }
    
    // If no match, try ean
    if (!match) {
      match = filteredData.find(item => item.ean === searchCode);
    }
  }
  
  // Strategy 2: If it's a text search term, try matching on product description
  if (!match && isLongText) {
    const searchableText = createSearchableText(normalizedCode);
    const searchWords = searchableText.split(/\s+/).filter(word => word.length > 2);
    
    if (searchWords.length > 0) {
      // Find products where the description contains all the search words
      match = filteredData.find(item => {
        const itemDesc = createSearchableText(item.product_description || item.description || '');
        return searchWords.every(word => itemDesc.includes(word));
      });
      
      // If no match, try a more lenient approach - match any of the words
      if (!match) {
        match = filteredData.find(item => {
          const itemDesc = createSearchableText(item.product_description || item.description || '');
          return searchWords.some(word => word.length > 2 && itemDesc.includes(word));
        });
      }
    }
  }
  
  // Strategy 3: Try case-insensitive match on ing.prod_code or ingredient_code
  if (!match) {
    match = filteredData.find(item => {
      const itemCode = String(item['ing.prod_code'] || item.ingredient_code || '').toLowerCase();
      return itemCode === searchCode.toLowerCase();
    });
  }
  
  // Strategy 4: Try partial match on ing.prod_code or ingredient_code
  if (!match) {
    match = filteredData.find(item => {
      const itemCode = String(item['ing.prod_code'] || item.ingredient_code || '').toLowerCase();
      return itemCode.includes(searchCode.toLowerCase()) || searchCode.toLowerCase().includes(itemCode);
    });
  }
  
  // Strategy 5: Try partial match on product_description
  if (!match) {
    match = filteredData.find(item => {
      const itemDesc = createSearchableText(item.product_description || item.description || '');
      const searchTerm = createSearchableText(normalizedCode);
      return itemDesc.includes(searchTerm) || searchTerm.includes(itemDesc);
    });
  }
  
  if (!match) {
    return null;
  }
  
  // Standardize the supplier details format
  return {
    name: match.supplier_name || '',
    supplier_code: match.supplier_code || '',
    address: match.address || '',
    contact_person: match.contact_person || '',
    email: match.email || '',
    phone: match.phone || '',
    product_code: match.supplier_product_code || '',
    ean: match.ean || '',
    description: match.product_description || match.description || '',
    pack_size: match.pack_size || ''
  };
}

module.exports = {
  normalizeDepartmentCode,
  extractIngredientInfo,
  createSearchableText,
  findSupplierForIngredient
};
