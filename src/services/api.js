const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export async function fetchRecipes(department, filters = {}) {
  const params = new URLSearchParams({ ...filters });
  if (department && department !== 'undefined' && department !== '') {
    params.append('department', department);
  }
  const query = params.toString();
  const url = query ? `${API_BASE}/api/recipes?${query}` : `${API_BASE}/api/recipes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/handlers?department=${department}`);
  if (!res.ok) throw new Error('Failed to fetch handlers');
  return res.json();
}

export async function saveHandler(department, handler) {
  const method = handler.id ? 'PUT' : 'POST';
  const url = handler.id
    ? `${API_BASE}/api/handlers/${handler.id}`
    : `${API_BASE}/api/handlers?department=${department}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department, name: handler.name })
  });
  if (!res.ok) throw new Error('Failed to save handler');
  return res.json();
}

export async function deleteHandler(handlerId) {
  const res = await fetch(`${API_BASE}/api/handlers/${handlerId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete handler');
  return res.json();
}
