const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function fetchRecipes(department, filters = {}) {
  const params = new URLSearchParams({ department, ...filters });
  const res = await fetch(`${API_BASE}/api/recipes?${params.toString()}`);
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
  const url = schedule.id
    ? `${API_BASE}/api/schedules/${schedule.id}?department=${department}`
    : `${API_BASE}/api/schedules?department=${department}`;
  const method = schedule.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!res.ok) throw new Error('Failed to save schedule');
  return res.json();
}
