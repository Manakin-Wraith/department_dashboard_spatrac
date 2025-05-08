import { useState, useEffect, useCallback } from 'react';
import { fetchRecipes, fetchSchedules, fetchAudits } from '../services/api';

/**
 * Custom hook for managing production data including recipes, schedules, and audits
 * @param {string} department - The department code
 * @returns {Object} Production data and related state/functions
 */
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
  
  // Fetch recipes for the department
  const loadRecipes = useCallback(async () => {
    if (!department) return;
    
    try {
      setLoading(prev => ({ ...prev, recipes: true }));
      const data = await fetchRecipes(department);
      setRecipes(data || []);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
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
      loadRecipes();
      loadSchedules();
      loadAudits();
    }
  }, [department, loadRecipes, loadSchedules, loadAudits]);
  
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
