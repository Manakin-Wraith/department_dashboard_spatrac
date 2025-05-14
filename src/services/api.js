import { findSupplierForIngredient } from './supplierLookupService';
import { normalizeDepartmentCode } from '../utils/supplierIngredientUtils';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

// Department code mapping between URL parameters and database values
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

export async function fetchSuppliers(department) {
  const mappedDepartment = mapDepartmentCode(department);
  const res = await fetch(`${API_BASE}/api/suppliers?department=${mappedDepartment}`);
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  
  // Get suppliers from the database
  const suppliers = await res.json();
  
  // Also fetch ingredient-supplier mappings to enhance the supplier data
  try {
    const mappingsRes = await fetch(`${API_BASE}/api/ingredient-supplier-mapping?department=${mappedDepartment}`);
    if (mappingsRes.ok) {
      const mappings = await mappingsRes.json();
      
      // Group mappings by supplier code
      const supplierMappings = {};
      mappings.forEach(mapping => {
        if (!supplierMappings[mapping.supplier_code]) {
          supplierMappings[mapping.supplier_code] = [];
        }
        supplierMappings[mapping.supplier_code].push(mapping);
      });
      
      // Enhance suppliers with their product mappings
      return suppliers.map(supplier => ({
        ...supplier,
        products: supplierMappings[supplier.supplier_code] || []
      }));
    }
  } catch (err) {
    console.warn('Could not fetch ingredient-supplier mappings:', err);
  }
  
  return suppliers;
}

export async function fetchAudits(department) {
  const mappedDepartment = mapDepartmentCode(department);
  console.log('Fetching audits for department:', mappedDepartment);
  
  // Get all audits first, then filter by department on the client side
  // This is more reliable with json-server which might not handle complex queries well
  const res = await fetch(`${API_BASE}/api/audits`);
  if (!res.ok) throw new Error('Failed to fetch audits');
  
  // Get the audit data
  let auditData = await res.json();
  console.log('Raw audit data fetched, count:', auditData.length);
  
  // Check for numeric department codes (like 1154, 1152, 1155)
  const numericDeptCodes = Object.keys(DEPARTMENT_CODE_MAP).filter(key => /^\d+$/.test(key));
  
  // Get the numeric code for the current department
  const currentDeptNumericCode = numericDeptCodes.find(code => DEPARTMENT_CODE_MAP[code] === mappedDepartment);
  console.log('Current department numeric code:', currentDeptNumericCode);
  
  // Filter audits by department (try both the mapped department and the numeric code)
  auditData = auditData.filter(audit => {
    return audit.department === mappedDepartment || 
           audit.department === currentDeptNumericCode || 
           DEPARTMENT_CODE_MAP[audit.department] === mappedDepartment;
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

export async function saveAudit(department, auditRecord) {
  const mappedDepartment = mapDepartmentCode(department);
  console.log('Saving audit for department:', mappedDepartment, 'with audit record:', auditRecord);
  
  // Ensure we have supplier details for each ingredient
  if (auditRecord.ingredient_list && auditRecord.ingredient_list.length > 0) {
    try {
      console.log('Enhancing audit with supplier details before saving...');
      // Create supplier_details array if it doesn't exist
      if (!auditRecord.supplier_details) {
        auditRecord.supplier_details = [];
      }
      
      // Ensure supplier_name and address_of_supplier arrays exist
      if (!auditRecord.supplier_name) auditRecord.supplier_name = [];
      if (!auditRecord.address_of_supplier) auditRecord.address_of_supplier = [];
      
      // For each ingredient, look up supplier details
      const supplierPromises = auditRecord.ingredient_list.map(async (ingredient, index) => {
        // Try to extract ingredient code from the ingredient name
        const codeMatch = ingredient.match(/\(([^)]+)\)$/);
        const ingredientCode = codeMatch ? codeMatch[1] : null;
        
        console.log(`Processing ingredient ${index}: ${ingredient}, extracted code: ${ingredientCode}`);
        
        if (ingredientCode) {
          try {
            // Look up supplier details for this ingredient code
            const supplierDetail = await findSupplierForIngredient(ingredientCode, auditRecord.department);
            
            if (supplierDetail) {
              console.log(`Found supplier details for ingredient ${ingredientCode}:`, supplierDetail);
              
              // Update supplier_details
              auditRecord.supplier_details[index] = supplierDetail;
              
              // Also update supplier_name and address_of_supplier for backward compatibility
              auditRecord.supplier_name[index] = supplierDetail.name;
              auditRecord.address_of_supplier[index] = supplierDetail.address || '';
              
              return supplierDetail;
            } else {
              console.log(`No supplier details found for ingredient ${ingredientCode}`);
            }
          } catch (error) {
            console.error(`Error looking up supplier for ingredient ${ingredientCode}:`, error);
          }
        }
        
        // If we already have supplier details for this index, return them
        if (auditRecord.supplier_details[index]) {
          return auditRecord.supplier_details[index];
        }
        
        // If we have a supplier name but no details, create a basic supplier detail object
        if (auditRecord.supplier_name && auditRecord.supplier_name[index]) {
          const basicSupplierDetail = {
            name: auditRecord.supplier_name[index],
            supplier_code: '',
            address: auditRecord.address_of_supplier ? auditRecord.address_of_supplier[index] || '' : '',
            contact_person: '',
            email: '',
            phone: ''
          };
          
          auditRecord.supplier_details[index] = basicSupplierDetail;
          return basicSupplierDetail;
        }
        
        // If we have no supplier information at all, create a placeholder
        const placeholderSupplier = {
          name: 'Unknown',
          supplier_code: '',
          address: '',
          contact_person: '',
          email: '',
          phone: ''
        };
        
        auditRecord.supplier_details[index] = placeholderSupplier;
        auditRecord.supplier_name[index] = 'Unknown';
        return placeholderSupplier;
      });
      
      // Wait for all supplier lookups to complete
      await Promise.all(supplierPromises);
      console.log('Enhanced audit record with supplier details:', auditRecord.supplier_details);
    } catch (err) {
      console.error('Error enhancing audit with supplier details:', err);
      // Continue with saving even if we couldn't enhance with supplier details
    }
  }
  
  const url = `${API_BASE}/api/audits`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditRecord)
  });
  if (!res.ok) throw new Error('Failed to save audit');
  return res.json();
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
