/**
 * Supplier Lookup Service
 * 
 * This service provides functions to look up supplier information for ingredients
 * based on the department CSV data files.
 */

import { useState, useEffect } from 'react';
import { normalizeDepartmentCode, findSupplierForIngredient as findSupplier } from '../utils/supplierIngredientUtils';

// Cache for parsed CSV data to avoid repeated parsing
let csvCache = {
  BAKERY: null,
  HMR: null,
  BUTCHERY: null
};

/**
 * Parse CSV data into an array of objects
 * @param {string} csvText - Raw CSV text content
 * @returns {Array} Array of objects representing CSV rows
 */
function parseCSV(csvText) {
  // Split by lines and get headers from first line
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Parse each line into an object
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

/**
 * Load CSV data for a specific department
 * @param {string} department - Department code (BAKERY, HMR, BUTCHERY)
 * @returns {Promise<Array>} Promise resolving to parsed CSV data
 */
async function loadCSVData(department) {
  const normalizedDept = normalizeDepartmentCode(department);
  
  // If we already have cached data, return it
  if (csvCache[normalizedDept]) {
    return csvCache[normalizedDept];
  }
  
  try {
    // Determine the CSV file path based on department
    const csvPath = `/DEPT_DATA/${normalizedDept}.csv`;
    
    // Fetch the CSV file
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${csvPath}: ${response.status} ${response.statusText}`);
    }
    
    // Parse the CSV content
    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    
    // Cache the parsed data
    csvCache[normalizedDept] = parsedData;
    
    return parsedData;
  } catch (error) {
    console.error(`Error loading CSV data for ${normalizedDept}:`, error);
    return [];
  }
}

/**
 * Find supplier details for a specific ingredient in a department
 * @param {string} ingredientCode - The ingredient product code or search term
 * @param {string} department - Department code (BAKERY, HMR, BUTCHERY)
 * @returns {Promise<Object|null>} Promise resolving to supplier details or null if not found
 */
export async function findSupplierForIngredient(ingredientCode, department) {
  if (!ingredientCode) {
    console.log('No ingredient code provided to findSupplierForIngredient');
    return null;
  }
  
  const normalizedDept = normalizeDepartmentCode(department);
  console.log(`Looking up supplier for ingredient code/term ${ingredientCode} in department ${normalizedDept}`);
  
  try {
    // Load CSV data for the department
    const csvData = await loadCSVData(normalizedDept);
    
    if (!csvData || csvData.length === 0) {
      console.log(`No CSV data found for department ${normalizedDept}`);
      return null;
    }
    
    console.log(`Loaded ${csvData.length} rows of CSV data for ${normalizedDept}`);
    
    // Use the shared utility function to find the supplier
    const result = findSupplier(ingredientCode, normalizedDept, csvData);
    
    if (result) {
      console.log(`Found supplier match for ingredient ${ingredientCode}:`, result);
    } else {
      console.log(`No supplier found for ingredient ${ingredientCode} in department ${normalizedDept}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error finding supplier for ingredient ${ingredientCode}:`, error);
    return null;
  }
}

/**
 * React hook to look up supplier details for ingredients
 * @param {Array<string>} ingredientCodes - Array of ingredient codes
 * @param {string} department - Department code
 * @returns {Object} Object containing supplier details and loading state
 */
export function useSupplierLookup(ingredientCodes, department) {
  const [supplierDetails, setSupplierDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function lookupSuppliers() {
      try {
        setLoading(true);
        
        // Look up supplier details for each ingredient
        const details = await Promise.all(
          ingredientCodes.map(code => findSupplierForIngredient(code, department))
        );
        
        setSupplierDetails(details);
        setLoading(false);
      } catch (err) {
        console.error('Error looking up suppliers:', err);
        setError(err);
        setLoading(false);
      }
    }
    
    if (ingredientCodes && ingredientCodes.length > 0) {
      lookupSuppliers();
    } else {
      setSupplierDetails([]);
      setLoading(false);
    }
  }, [ingredientCodes, department]);
  
  return { supplierDetails, loading, error };
}

/**
 * Extract ingredient codes from ingredient names
 * @param {Array<string>} ingredientNames - Array of ingredient names (may include quantities in parentheses)
 * @returns {Array<string>} Array of extracted ingredient codes
 */
export function extractIngredientCodes(ingredientNames) {
  return ingredientNames.map(name => {
    // Try to extract code from format like "INGREDIENT NAME (CODE)"
    const match = name.match(/\(([^)]+)\)$/);
    return match ? match[1] : null;
  }).filter(Boolean); // Remove null values
}

// Create a named object before exporting to fix ESLint warning
const supplierLookupService = {
  findSupplierForIngredient,
  useSupplierLookup,
  extractIngredientCodes
};

export default supplierLookupService;
