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
  
  // Normalize input by trimming and handling case
  const normalizedDept = String(urlDepartment).trim();
  
  // Check direct mapping first (case-insensitive)
  const lowerDept = normalizedDept.toLowerCase();
  if (DEPARTMENT_CODE_MAP[lowerDept]) {
    console.log(`Mapped department code ${urlDepartment} to ${DEPARTMENT_CODE_MAP[lowerDept]} via lowercase mapping`);
    return DEPARTMENT_CODE_MAP[lowerDept];
  }
  
  // Check uppercase mapping
  const upperDept = normalizedDept.toUpperCase();
  if (DEPARTMENT_CODE_MAP[upperDept]) {
    console.log(`Mapped department code ${urlDepartment} to ${DEPARTMENT_CODE_MAP[upperDept]} via uppercase mapping`);
    return DEPARTMENT_CODE_MAP[upperDept];
  }
  
  // Check if it's a numeric department code directly in the mapping
  if (DEPARTMENT_CODE_MAP[normalizedDept]) {
    console.log(`Mapped department code ${urlDepartment} to ${DEPARTMENT_CODE_MAP[normalizedDept]} via direct mapping`);
    return DEPARTMENT_CODE_MAP[normalizedDept];
  }
  
  // If not in mapping but is numeric, return as is (for compatibility with numeric department codes)
  if (/^\d+$/.test(normalizedDept)) {
    console.log(`Using numeric department code as is: ${normalizedDept}`);
    return normalizedDept;
  }
  
  // Default to uppercase version if no mapping found
  console.log(`No mapping found for ${urlDepartment}, defaulting to uppercase: ${upperDept}`);
  return upperDept;
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

export async function fetchAudits(department) {
  const res = await fetch(`${API_BASE}/api/audits?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch audits');
  return res.json();
}

export async function saveAudit(department, auditRecord) {
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
