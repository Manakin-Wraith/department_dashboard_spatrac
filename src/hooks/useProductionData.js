import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRecipes, fetchSchedules, fetchAudits } from '../services/api';

/**
 * Custom hook for managing production data including recipes, schedules, and audits
 * @param {string} department - The department code
 * @returns {Object} Production data and related state/functions
 */
// Cache for recipes by department
const recipeCache = {};

const useProductionData = (department) => {
  const [recipes, setRecipes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState({
    recipes: true,
    schedules: true,
    audits: true
  });
  const [error, setError] = useState(null);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // Track the current department for debugging
  const currentDepartmentRef = useRef(department);
  
  // Fetch recipes for the department with caching
  const loadRecipes = useCallback(async () => {
    if (!department) return;
    
    try {
      setLoading(prev => ({ ...prev, recipes: true }));
      
      // Update the current department reference
      currentDepartmentRef.current = department;
      console.log(`Loading recipes for department: ${department}`);
      
      // Normalize department code for consistent caching
      const normalizedDepartment = department.toLowerCase();
      
      // Check if we have cached data for this department
      if (recipeCache[normalizedDepartment]) {
        console.log(`Using cached recipes for department: ${department} (normalized: ${normalizedDepartment})`);
        setRecipes(recipeCache[normalizedDepartment]);
      } else {
        // Fetch from API with explicit department parameter
        console.log(`Fetching recipes from API for department: ${department}`);
        const data = await fetchRecipes(department);
        
        // Verify the department is still the same (in case it changed during the fetch)
        if (currentDepartmentRef.current === department) {
          // The fetchRecipes function already filters by department, so we don't need to filter again
          // Just log the count for debugging purposes
          console.log(`Received ${data.length} recipes for department ${department} (normalized: ${normalizedDepartment})`);
          
          // Cache the data using normalized department key
          recipeCache[normalizedDepartment] = data;
          setRecipes(data);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch recipes for department ${department}:`, err);
      setError('Failed to load recipes. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, recipes: false }));
    }
  }, [department]);
  
  // Fetch schedules for the department
  const loadSchedules = useCallback(async () => {
    if (!department) return;
    
    try {
      setLoading(prev => ({ ...prev, schedules: true }));
      const data = await fetchSchedules(department);
      setSchedules(data || []);
      setFilteredSchedules(data || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('Failed to load schedules. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, schedules: false }));
    }
  }, [department]);
  
  // Fetch audits for the department
  const loadAudits = useCallback(async () => {
    if (!department) return;
    
    try {
      setLoading(prev => ({ ...prev, audits: true }));
      const data = await fetchAudits(department);
      setAudits(data || []);
    } catch (err) {
      console.error('Failed to fetch audits:', err);
      setError('Failed to load audit records. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, audits: false }));
    }
  }, [department]);
  
  // Filter schedules based on date range and search term
  const filterSchedules = useCallback((startDate, endDate, searchTerm) => {
    if (!schedules.length) return;
    
    let filtered = [...schedules];
    
    if (startDate && endDate) {
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.weekStartDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return scheduleDate >= start && scheduleDate <= end;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(schedule => {
        // Search in schedule properties
        if (schedule.managerName?.toLowerCase().includes(term)) return true;
        
        // Search in schedule items
        return schedule.items?.some(item => {
          return (
            item.recipeCode?.toLowerCase().includes(term) ||
            item.handlerName?.toLowerCase().includes(term) ||
            item.productDescription?.toLowerCase().includes(term)
          );
        });
      });
    }
    
    setFilteredSchedules(filtered);
  }, [schedules]);
  
  // Load all data on component mount
  useEffect(() => {
    if (department) {
      console.log(`useProductionData: Loading data for department: ${department}`);
      loadRecipes();
      loadSchedules();
      loadAudits();
    } else {
      console.warn('useProductionData: No department provided, cannot load data');
    }
  }, [department, loadRecipes, loadSchedules, loadAudits]);
  
  // Debug current state
  useEffect(() => {
    console.log(`useProductionData: Current state for department ${department}:`, {
      recipesCount: recipes.length,
      schedulesCount: schedules.length,
      auditsCount: audits.length,
      loading,
      error: error || 'No errors'
    });
  }, [recipes, schedules, audits, loading, error, department]);
  
  // Reload data function for manual refreshes
  const reloadData = useCallback(() => {
    loadRecipes();
    loadSchedules();
    loadAudits();
  }, [loadRecipes, loadSchedules, loadAudits]);
  
  return {
    recipes,
    schedules,
    audits,
    filteredSchedules,
    setFilteredSchedules,
    setSchedules,
    loading,
    error,
    filterSchedules,
    reloadData
  };
};

export default useProductionData;
