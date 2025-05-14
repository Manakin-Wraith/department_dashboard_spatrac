import { normalizeDepartmentCode, findSupplierForIngredient } from '../utils/supplierIngredientUtils';

// Path to CSV files
const CSV_PATHS = {
  BAKERY: `${process.env.PUBLIC_URL}/DEPT_DATA/Bakery.csv`,
  HMR: `${process.env.PUBLIC_URL}/DEPT_DATA/HMR.csv`,
  BUTCHERY: `${process.env.PUBLIC_URL}/DEPT_DATA/Butchery.csv`
};

// Constants for internal departments
const INTERNAL_DEPARTMENT_CODES = ['1152', '1154', '1155'];

// API base URL
const API_BASE = process.env.REACT_APP_API_BASE || '';

/**
 * Parse CSV data into an array of objects
 * @param {string} csvText - Raw CSV text content
 * @returns {Array} Array of objects representing CSV rows
 */
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    console.error('Invalid CSV text:', csvText);
    return [];
  }
  
  try {
    // Split by lines and get headers from first line
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      console.warn('CSV has fewer than 2 lines, might be empty or invalid');
      return [];
    }
    
    const headers = lines[0].split(',');
    console.log(`CSV headers: ${headers.join(', ')}`);
    
    // Parse each line into an object
    return lines.slice(1).map((line, lineIndex) => {
      const values = line.split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return row;
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * Load CSV data for a specific department with caching
 * @param {string} department - Department code (BAKERY, BUTCHERY, HMR)
 * @returns {Promise<Array>} - Parsed CSV data
 */
export async function loadCSVData(department) {
  const normalizedDept = department.toUpperCase();
  
  // Define CSV paths for each department
  const CSV_PATHS = {
    'BAKERY': `${process.env.PUBLIC_URL}/DEPT_DATA/Bakery.csv`,
    'BUTCHERY': `${process.env.PUBLIC_URL}/DEPT_DATA/Butchery.csv`,
    'HMR': `${process.env.PUBLIC_URL}/DEPT_DATA/HMR.csv`
  };
  
  if (!CSV_PATHS[normalizedDept]) {
    throw new Error(`Unknown department: ${normalizedDept}`);
  }
  
  // Fetch the CSV file
  const csvPath = CSV_PATHS[normalizedDept];
  console.log(`Loading data from CSV: ${csvPath}`);
  
  const response = await fetch(csvPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
  }
  
  // Parse the CSV data
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    console.warn(`CSV file ${csvPath} has fewer than 2 lines, might be empty or invalid`);
    return [];
  }
  
  // Get headers from the first line
  const headers = lines[0].split(',');
  
  // Parse each line into an object
  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const item = {};
    
    headers.forEach((header, i) => {
      item[header] = values[i] || '';
    });
    
    // Add additional fields
    item.id = `${normalizedDept}-${index}`;
    item.department = normalizedDept;
    
    return item;
  });
}

/**
 * Load all CSV data from all departments
 * @returns {Promise<Array>} Promise resolving to combined CSV data from all departments
 */
async function loadAllCSVData() {
  const allData = [];
  
  try {
    console.log('Loading CSV data from all departments...');
    
    // Load data from each department in parallel
    const departmentPromises = ['BAKERY', 'HMR', 'BUTCHERY'].map(async (dept) => {
      try {
        const deptData = await loadCSVData(dept);
        
        // Add department field to each row
        return deptData.map(row => ({
          ...row,
          department: dept
        }));
      } catch (error) {
        console.error(`Error loading data for ${dept}:`, error);
        return [];
      }
    });
    
    // Wait for all departments to load
    const departmentData = await Promise.all(departmentPromises);
    
    // Combine all department data
    departmentData.forEach(deptRows => {
      allData.push(...deptRows);
    });
    
    console.log(`Successfully loaded ${allData.length} total rows from all CSV files`);
  } catch (error) {
    console.error('Error loading all CSV data:', error);
  }
  
  return allData;
}

// API base URL already defined at the top of the file

// Department code mapping between URL parameters and database values
// eslint-disable-next-line no-unused-vars
const DEPARTMENT_CODE_MAP = {
  // Text-based codes (URL parameter to database value)
  'bakery': 'BAKERY',
  'butchery': 'BUTCHERY',
  'hmr': 'HMR',
  
  // Numeric department codes from department_table.json
  '1154': 'BAKERY',
  '1152': 'BUTCHERY',
  '1155': 'HMR',
  
  // Reverse mappings (database value to standard format)
  'BAKERY': 'BAKERY',
  'BUTCHERY': 'BUTCHERY',
  'HMR': 'HMR'
};

/**
 * Maps a URL department parameter to the corresponding database department code
 * @param {string} urlDepartment - The department code from URL parameter
 * @returns {string} The corresponding database department code
 */
const mapDepartmentCode = (urlDepartment) => {
  if (!urlDepartment) return '';
  
  const result = normalizeDepartmentCode(urlDepartment);
  console.log(`Mapped department code ${urlDepartment} to ${result}`);
  return result;
};

export async function fetchRecipes(department, filters = {}) {
  // Validate department parameter
  if (!department || department === 'undefined' || department === '') {
    console.warn('fetchRecipes called without a valid department code');
    return [];
  }

  // Map the department code to ensure consistent format
  const mappedDepartment = mapDepartmentCode(department);
  
  // Build query parameters
  const params = new URLSearchParams({ ...filters });
  params.append('department', mappedDepartment);
  
  // Log the request for debugging
  console.log(`Fetching recipes for department: ${department} (mapped to: ${mappedDepartment}) with filters:`, filters);
  
  // Make the API request
  const query = params.toString();
  const url = `${API_BASE}/api/recipes?${query}`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch recipes: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} recipes from API for department: ${mappedDepartment}`);
    
    // Perform case-insensitive filtering to ensure we get all matching recipes
    const filteredRecipes = data.filter(recipe => {
      const recipeDepCode = recipe.department || recipe.department_code;
      if (!recipeDepCode) {
        console.warn(`Recipe ${recipe.id || recipe.product_code} has no department code`);
        return false;
      }
      
      // Case-insensitive comparison using both original and mapped department
      const normalizedRecipeDept = recipeDepCode.toLowerCase();
      const normalizedRequestDept = department.toLowerCase();
      const normalizedMappedDept = mappedDepartment.toLowerCase();
      
      // Check if recipe matches either the original department or the mapped department
      const belongsToDepartment = 
        normalizedRecipeDept === normalizedRequestDept || 
        normalizedRecipeDept === normalizedMappedDept;
      
      if (belongsToDepartment) {
        console.log(`Recipe ${recipe.id || recipe.product_code} (${recipe.description || recipe.name}) matched for department ${department}`);
      } else {
        console.warn(`Recipe ${recipe.id || recipe.product_code} has department ${recipeDepCode} but was requested for department ${department}`);
      }
      
      return belongsToDepartment;
    });
    
    console.log(`After filtering, returning ${filteredRecipes.length} recipes for department ${department}`);
    return filteredRecipes;
  } catch (err) {
    console.error(`Error fetching recipes for department ${department}:`, err);
    throw err;
  }
}

export async function fetchRecipe(department, id) {
  const res = await fetch(`${API_BASE}/api/recipes/${id}?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch recipe');
  return res.json();
}

export async function saveRecipe(department, id, data) {
  const method = id ? 'PUT' : 'POST';
  const url = id
    ? `${API_BASE}/api/recipes/${id}?department=${department}`
    : `${API_BASE}/api/recipes?department=${department}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to save recipe');
  return res.json();
}

/**
 * Fetch ingredient-supplier mappings from CSV files
 * @param {string} department - Department code
 * @returns {Promise<Array>} Promise resolving to ingredient-supplier mappings
 */
export async function fetchIngredientSupplierMappings(department) {
  const mappedDepartment = mapDepartmentCode(department);
  
  try {
    // Load CSV data for the department
    const csvData = await loadCSVData(mappedDepartment);
    
    // Transform CSV data into ingredient-supplier mappings
    const mappings = csvData.map(row => ({
      id: `${row.supplier_code}-${row.ing_prod_code}`,
      supplier_code: row.supplier_code,
      supplier_name: row.supplier_name,
      ingredient_code: row.ing_prod_code,
      product_description: row.product_description,
      supplier_product_code: row.supplier_product_code,
      ean: row.ean,
      pack_size: row.pack_size,
      department: mappedDepartment,
      isInternallyProduced: INTERNAL_DEPARTMENT_CODES.includes(row.supplier_code)
    }));
    
    console.log(`Generated ${mappings.length} ingredient-supplier mappings for ${mappedDepartment}`);
    return mappings;
  } catch (error) {
    console.error(`Error fetching ingredient-supplier mappings for ${mappedDepartment}:`, error);
    return [];
  }
}

export async function fetchSuppliers(department) {
  const mappedDepartment = mapDepartmentCode(department);
  
  try {
    // Get suppliers from the database
    const res = await fetch(`${API_BASE}/api/suppliers?department=${mappedDepartment}`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    const suppliers = await res.json();
    
    // Use our local implementation for ingredient-supplier mappings
    // This completely bypasses the API call that's returning 404 errors
    const mappings = await fetchIngredientSupplierMappings(mappedDepartment);
    
    // Add internal department suppliers if they're not already in the list
    const supplierCodes = new Set(suppliers.map(s => s.supplier_code));
    
    // Add department info as suppliers if they don't exist
    INTERNAL_DEPARTMENT_CODES.forEach(code => {
      if (!supplierCodes.has(code)) {
        let deptName = '';
        if (code === '1152') deptName = 'Butchery Department';
        if (code === '1154') deptName = 'Bakery Department';
        if (code === '1155') deptName = 'HMR Department';
        
        suppliers.push({
          id: `internal-${code}`,
          supplier_code: code,
          supplier_name: deptName,
          department: mappedDepartment,
          address: 'Internal Department',
          isInternalDepartment: true,
          type: 'internal'
        });
      }
    });
    
    // Group mappings by supplier code
    const supplierMappings = {};
    mappings.forEach(mapping => {
      if (!supplierMappings[mapping.supplier_code]) {
        supplierMappings[mapping.supplier_code] = [];
      }
      supplierMappings[mapping.supplier_code].push(mapping);
    });
    
    // Enhance suppliers with their product mappings and internal/external flags
    return suppliers.map(supplier => ({
      ...supplier,
      products: supplierMappings[supplier.supplier_code] || [],
      isInternalDepartment: INTERNAL_DEPARTMENT_CODES.includes(supplier.supplier_code),
      isSharedSupplier: supplier.supplier_code === '1297' || 
                        supplier.supplier_code === '1297-HMR' || 
                        supplier.supplier_code === '1297-BAKERY'
    }));
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    return [];
  }
}

export async function fetchAudits(department) {
  const mappedDepartment = mapDepartmentCode(department);
  console.log('Fetching audits for department:', mappedDepartment, 'Original department:', department);
  
  // Get all audits first, then filter by department on the client side
  // This is more reliable with json-server which might not handle complex queries well
  const res = await fetch(`${API_BASE}/api/audits`);
  if (!res.ok) throw new Error('Failed to fetch audits');
  
  // Get the audit data
  let auditData = await res.json();
  console.log('Raw audit data fetched, count:', auditData.length);
  
  if (auditData.length === 0) {
    console.warn('No audit records found in the database');
    return [];
  }
  
  // Log the first audit to see its structure
  console.log('Sample audit record:', auditData[0]);
  
  // Convert department to various formats for flexible matching
  const departmentFormats = [
    department,                                  // Original format (e.g., "1154")
    mappedDepartment,                           // Mapped format (e.g., "BAKERY")
    parseInt(department, 10),                   // Numeric format (e.g., 1154)
    String(department).toUpperCase(),           // Uppercase string
    normalizeDepartmentCode(department)         // Normalized format
  ];
  
  console.log('Department formats for matching:', departmentFormats);
  
  // Filter audits by department using flexible matching
  auditData = auditData.filter(audit => {
    // Convert audit department to string for comparison
    const auditDept = audit.department;
    
    // Check if the audit department matches any of our department formats
    const matches = departmentFormats.some(format => {
      return auditDept === format || 
             String(auditDept) === String(format) ||
             normalizeDepartmentCode(auditDept) === normalizeDepartmentCode(format);
    });
    
    if (matches) {
      console.log(`Matched audit ${audit.id} with department ${auditDept}`);
    }
    
    return matches;
  });
  
  console.log('Filtered audit data for department, count:', auditData.length);
  
  try {
    console.log('Enhancing audits with supplier details using supplier lookup service');
    // Use the supplier lookup service to enhance audits with supplier details
    const enhancedAudits = await Promise.all(
      auditData.map(async audit => {
        console.log('Enhancing audit:', audit.uid);
        
        // If the audit has ingredient_list, enhance with supplier details
        if (audit.ingredient_list && audit.ingredient_list.length > 0) {
          // Create supplier_details array if it doesn't exist
          if (!audit.supplier_details) {
            audit.supplier_details = [];
          }
          
          // For each ingredient, look up supplier details
          await Promise.all(audit.ingredient_list.map(async (ingredient, index) => {
            // Try to extract ingredient code from the ingredient name
            // Format could be "INGREDIENT NAME (CODE)" or just "INGREDIENT NAME"
            const codeMatch = ingredient.match(/\(([^)]+)\)$/);
            const ingredientCode = codeMatch ? codeMatch[1] : null;
            
            if (ingredientCode) {
              // Look up supplier details for this ingredient code
              const supplierDetail = await findSupplierForIngredient(ingredientCode, audit.department);
              
              if (supplierDetail) {
                audit.supplier_details[index] = supplierDetail;
                
                // Also update supplier_name and address_of_supplier for backward compatibility
                if (!audit.supplier_name) audit.supplier_name = [];
                if (!audit.address_of_supplier) audit.address_of_supplier = [];
                
                audit.supplier_name[index] = supplierDetail.name;
                audit.address_of_supplier[index] = supplierDetail.address || '';
              } else if (!audit.supplier_details[index]) {
                // If no supplier found and no existing details, create a placeholder
                const supplierName = audit.supplier_name && audit.supplier_name[index] ? audit.supplier_name[index] : 'Unknown';
                audit.supplier_details[index] = {
                  name: supplierName,
                  supplier_code: '',
                  address: audit.address_of_supplier && audit.address_of_supplier[index] ? audit.address_of_supplier[index] : '',
                  contact_person: '',
                  email: '',
                  phone: ''
                };
              }
            } else if (!audit.supplier_details[index]) {
              // If no ingredient code and no existing details, create a placeholder
              const supplierName = audit.supplier_name && audit.supplier_name[index] ? audit.supplier_name[index] : 'Unknown';
              audit.supplier_details[index] = {
                name: supplierName,
                supplier_code: '',
                address: audit.address_of_supplier && audit.address_of_supplier[index] ? audit.address_of_supplier[index] : '',
                contact_person: '',
                email: '',
                phone: ''
              };
            }
          }));
        }
        
        console.log('Enhanced audit with supplier details:', audit.uid, 'supplier_details:', !!audit.supplier_details);
        return audit;
      })
    );
    
    console.log('All audits enhanced successfully');
    return enhancedAudits;
  } catch (err) {
    console.error('Error enhancing audits with supplier details:', err);
    
    // Fallback to the original method if the new service fails
    try {
      const suppliers = await fetchSuppliers(mappedDepartment);
      
      // For each audit, enhance ingredient information with supplier details
      return auditData.map(audit => {
        // If the audit has ingredient_list but no supplier_details, add them
        if (audit.ingredient_list && audit.ingredient_list.length > 0) {
          // Create supplier_details array if it doesn't exist
          if (!audit.supplier_details) {
            audit.supplier_details = [];
          }
          
          // For each ingredient, try to find a matching supplier
          audit.ingredient_list.forEach((ingredient, index) => {
            // If we already have supplier_name but no full details
            if (audit.supplier_name && audit.supplier_name[index] && !audit.supplier_details[index]) {
              const supplierName = audit.supplier_name[index];
              const matchingSupplier = suppliers.find(s => s.name === supplierName);
              
              if (matchingSupplier) {
                audit.supplier_details[index] = matchingSupplier;
              } else {
                // Create a placeholder with the name we have
                audit.supplier_details[index] = {
                  name: supplierName,
                  supplier_code: '',
                  address: audit.address_of_supplier ? audit.address_of_supplier[index] || '' : '',
                  contact_person: '',
                  email: '',
                  phone: ''
                };
              }
            }
          });
        }
        return audit;
      });
    } catch (fallbackErr) {
      console.error('Fallback method also failed:', fallbackErr);
      // Return the original audit data if we can't enhance it
      return auditData;
    }
  }
}

export async function saveAudit(auditRecord) {
  console.log('Saving audit record:', auditRecord);
  
  // Ensure department is a number if it's a numeric string
  if (auditRecord.department && !isNaN(auditRecord.department)) {
    auditRecord.department = parseInt(auditRecord.department, 10);
  }
  
  // Ensure we have supplier details for each ingredient
  if (auditRecord.ingredient_list && auditRecord.ingredient_list.length > 0) {
    try {
      // Create supplier_details array if it doesn't exist
      if (!auditRecord.supplier_details) {
        auditRecord.supplier_details = [];
      }
      
      // Ensure supplier_name and address_of_supplier arrays exist
      if (!auditRecord.supplier_name) auditRecord.supplier_name = [];
      if (!auditRecord.address_of_supplier) auditRecord.address_of_supplier = [];
      
      // Set department manager if not already set
      if (!auditRecord.department_manager || auditRecord.department_manager.trim() === '') {
        // Map department codes to manager names
        const managerMap = {
          1154: 'Monica',  // Bakery
          1152: 'Clive',   // Butchery
          1155: 'Monica'   // HMR
        };
        
        const departmentManager = managerMap[auditRecord.department] || '';
        if (departmentManager) {
          console.log(`Setting department manager for new audit to ${departmentManager}`);
          auditRecord.department_manager = departmentManager;
        }
      }
      
      try {
        // Try to load all CSV data for supplier lookup
        console.log('Attempting to load CSV data...');
        const allData = await loadAllCSVData();
        console.log(`Loaded ${allData.length} total rows from all CSV files for supplier lookup`);
        
        // Only proceed with supplier lookup if we have data
        if (allData && allData.length > 0) {
          // Use the supplier lookup service to enhance the audit record
          const supplierPromises = auditRecord.ingredient_list.map(async (ingredient, index) => {
            if (!ingredient) return null;
            
            console.log(`Looking up supplier for ingredient: ${ingredient}`);
            
            // First try to find supplier in the same department
            let supplierDetail = findSupplierForIngredient(ingredient, auditRecord.department, allData, { ignoreDepartment: false });
            
            // If not found, try searching across all departments
            if (!supplierDetail) {
              console.log(`No supplier found for "${ingredient}" in department ${auditRecord.department}, searching all departments...`);
              supplierDetail = findSupplierForIngredient(ingredient, auditRecord.department, allData, { ignoreDepartment: true });
            }
            
            if (supplierDetail) {
              console.log(`Found supplier details for ingredient "${ingredient}": ${supplierDetail.name}`);
              
              // Create a complete supplier detail object
              const completeSupplierDetail = {
                name: supplierDetail.name || 'Unknown',
                supplier_code: supplierDetail.supplier_code || '',
                address: supplierDetail.address || '',
                contact_person: supplierDetail.contact_person || '',
                email: supplierDetail.email || '',
                phone: supplierDetail.phone || '',
                product_code: supplierDetail.supplier_product_code || supplierDetail.product_code || '',
                ean: supplierDetail.ean || '',
                description: supplierDetail.product_description || supplierDetail.description || ingredient,
                pack_size: supplierDetail.pack_size || ''
              };
              
              // Update supplier_details
              auditRecord.supplier_details[index] = completeSupplierDetail;
              
              // Also update supplier_name and address_of_supplier for backward compatibility
              auditRecord.supplier_name[index] = completeSupplierDetail.name;
              auditRecord.address_of_supplier[index] = completeSupplierDetail.address;
              
              return completeSupplierDetail;
            } else {
              console.log(`No supplier details found for ingredient "${ingredient}"`);
              createPlaceholderSupplier(auditRecord, ingredient, index);
            }
          });
          
          // Wait for all supplier lookups to complete
          await Promise.all(supplierPromises);
          console.log('Enhanced audit record with supplier details:', auditRecord.supplier_details);
        } else {
          console.warn('No CSV data available, using placeholder supplier details');
          // Create placeholder supplier details for all ingredients
          auditRecord.ingredient_list.forEach((ingredient, index) => {
            createPlaceholderSupplier(auditRecord, ingredient, index);
          });
        }
      } catch (csvError) {
        console.error('Error loading CSV data:', csvError);
        // Create placeholder supplier details for all ingredients
        auditRecord.ingredient_list.forEach((ingredient, index) => {
          createPlaceholderSupplier(auditRecord, ingredient, index);
        });
      }
    } catch (err) {
      console.error('Error enhancing audit with supplier details:', err);
      // Continue with saving even if we couldn't enhance with supplier details
    }
  }
  
  // Helper function to create placeholder supplier details
  function createPlaceholderSupplier(record, ingredient, index) {
    // If we already have supplier details for this index, keep them
    if (record.supplier_details[index]) {
      return record.supplier_details[index];
    }
    
    // If we have a supplier name but no details, create a basic supplier detail object
    if (record.supplier_name && record.supplier_name[index] && record.supplier_name[index] !== 'Unknown') {
      const basicSupplierDetail = {
        name: record.supplier_name[index],
        supplier_code: '',
        address: record.address_of_supplier ? record.address_of_supplier[index] || '' : '',
        contact_person: '',
        email: '',
        phone: '',
        product_code: '',
        ean: '',
        description: ingredient,
        pack_size: ''
      };
      
      record.supplier_details[index] = basicSupplierDetail;
      return basicSupplierDetail;
    }
    
    // If we have no supplier information at all, create a placeholder
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
    
    record.supplier_details[index] = placeholderSupplier;
    record.supplier_name[index] = 'Unknown';
    record.address_of_supplier[index] = '';
    return placeholderSupplier;
  }
  
  // Prepare the record for sending to the server
  // Create a clean copy of the audit record to avoid JSON parsing issues
  const cleanRecord = JSON.parse(JSON.stringify(auditRecord));
  
  // Ensure all numeric strings are converted to numbers
  if (cleanRecord.department && !isNaN(cleanRecord.department)) {
    cleanRecord.department = parseInt(cleanRecord.department, 10);
  }
  
  // Log the final record being sent
  console.log('Sending audit record to server:', cleanRecord);
  
  const url = `${API_BASE}/api/audits`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanRecord)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to save audit: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error saving audit:', error);
    throw error;
  }
}

export async function deleteAudit(auditId) {
  const url = `${API_BASE}/api/audits/${auditId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete audit');
  return res.json();
}

export async function saveProductionDoc(department, overview, ingredients) {
  const res = await fetch(`${API_BASE}/api/production-documents?department=${department}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overview, ingredients })
  });
  if (!res.ok) throw new Error('Failed to save production document');
  return res.json();
}

export async function fetchSchedules(department) {
  const res = await fetch(`${API_BASE}/api/schedules?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export async function saveSchedule(department, schedule) {
  const baseUrl = `${API_BASE}/api/schedules`;
  
  // Ensure we have a proper ID format for the API
  let processedSchedule = { ...schedule };
  
  // For new schedules, ensure we're using POST
  if (!processedSchedule.id) {
    const method = 'POST';
    const res = await fetch(baseUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedSchedule),
    });
    if (!res.ok) throw new Error('Failed to save schedule');
    return res.json();
  } else {
    // For existing schedules, use PUT
    const method = 'PUT';
    // Use the schedules endpoint without ID for POST requests to let the server assign an ID
    const url = `${baseUrl}/${processedSchedule.id}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedSchedule),
      });
      
      if (!res.ok) {
        // If we get a 404, the schedule might not exist yet, try POST instead
        if (res.status === 404) {
          console.log('Schedule not found with PUT, trying POST instead');
          return saveSchedule(department, { ...processedSchedule, id: null });
        }
        throw new Error(`Failed to save schedule: ${res.status}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Error in saveSchedule:', error);
      throw error;
    }
  }
}

export async function deleteSchedule(scheduleId) {
  const url = `${API_BASE}/api/schedules/${scheduleId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete schedule');
  return res.json();
}

// Handlers CRUD API
export async function fetchHandlers(department) {
  const res = await fetch(`${API_BASE}/api/department_staff?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch department staff');
  return res.json();
}

export async function saveHandler(department, handler) {
  const method = handler.id ? 'PUT' : 'POST';
  const url = handler.id
    ? `${API_BASE}/api/department_staff/${handler.id}`
    : `${API_BASE}/api/department_staff?department=${department}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      department,
      name: handler.name,
      role: handler.role || 'Handler',
      email: handler.email || '',
      phone: handler.phone || ''
    })
  });
  if (!res.ok) throw new Error('Failed to save department staff member');
  return res.json();
}

export async function deleteHandler(handlerId) {
  const res = await fetch(`${API_BASE}/api/department_staff/${handlerId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete department staff member');
  return res.json();
}
