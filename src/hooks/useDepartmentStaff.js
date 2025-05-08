import { useState, useEffect, useCallback } from 'react';
import { fetchHandlers } from '../services/api';
import useNotifications from './useNotifications';

// Cache for department staff data to prevent repeated API calls
const staffCache = {};

/**
 * Custom hook to manage department staff data with caching
 * @param {string} department - Department code
 * @param {object} departmentInfo - Department information object with manager details
 * @returns {object} - Staff data and loading state
 */
export const useDepartmentStaff = (department, departmentInfo) => {
  const [departmentStaff, setDepartmentStaff] = useState([]);
  const [foodHandlers, setFoodHandlers] = useState([]);
  const [departmentManagers, setDepartmentManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();

  // Load department staff data with caching
  const loadDepartmentStaff = useCallback(async () => {
    if (!department) return;

    setLoading(true);
    try {
      // Check if we have cached data for this department
      let data;
      if (staffCache[department]) {
        console.log(`Using cached staff data for department ${department}`);
        data = staffCache[department];
      } else {
        // Fetch department staff from API
        console.log(`Fetching staff data for department ${department}`);
        data = await fetchHandlers(department);
        // Cache the data
        staffCache[department] = data;
      }

      setDepartmentStaff(data || []);
      
      // Separate food handlers and department managers
      const handlersData = data.filter(person => person.role === 'Handler');
      let managersData = data.filter(person => person.role === 'Manager');
      
      // Also check if we have department managers in the department info
      if (departmentInfo && departmentInfo.department_manager) {
        const managerName = departmentInfo.department_manager;
        
        // Handle both string and array formats for department_manager
        const managerNames = Array.isArray(managerName) ? managerName : [managerName];
        
        if (managerNames.length > 0) {
          // Create manager objects from department_manager if they don't already exist
          const existingManagerNames = managersData.map(m => m.name);
          
          const additionalManagers = managerNames
            .filter(name => name && !existingManagerNames.includes(name))
            .map((name, idx) => ({
              id: `dept-manager-${idx}`,
              name: name,
              department: department,
              role: 'Manager',
              email: `${name.toLowerCase().replace(/\\s+/g, '.')}@example.com`,
              phone: ''
            }));
          
          // Combine both sources of managers
          managersData = [...managersData, ...additionalManagers];
        }
      }
      
      setFoodHandlers(handlersData);
      setDepartmentManagers(managersData);
    } catch (err) {
      console.error('Failed to fetch department staff:', err);
      showError('Failed to load department staff data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [department, departmentInfo, showError]);

  // Load staff data when department changes
  useEffect(() => {
    if (department) {
      loadDepartmentStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, JSON.stringify(departmentInfo?.department_manager)]);

  // Method to force refresh the data (bypassing cache)
  const refreshStaffData = useCallback(async () => {
    if (!department) return;
    
    setLoading(true);
    try {
      // Force fetch from API
      const data = await fetchHandlers(department);
      // Update cache
      staffCache[department] = data;
      
      // Process the data as before
      setDepartmentStaff(data || []);
      
      const handlersData = data.filter(person => person.role === 'Handler');
      let managersData = data.filter(person => person.role === 'Manager');
      
      if (departmentInfo && departmentInfo.department_manager) {
        const managerName = departmentInfo.department_manager;
        const managerNames = Array.isArray(managerName) ? managerName : [managerName];
        
        if (managerNames.length > 0) {
          const existingManagerNames = managersData.map(m => m.name);
          
          const additionalManagers = managerNames
            .filter(name => name && !existingManagerNames.includes(name))
            .map((name, idx) => ({
              id: `dept-manager-${idx}`,
              name: name,
              department: department,
              role: 'Manager',
              email: `${name.toLowerCase().replace(/\\s+/g, '.')}@example.com`,
              phone: ''
            }));
          
          managersData = [...managersData, ...additionalManagers];
        }
      }
      
      setFoodHandlers(handlersData);
      setDepartmentManagers(managersData);
    } catch (err) {
      console.error('Failed to refresh department staff:', err);
      showError('Failed to refresh department staff data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [department, departmentInfo, showError]);

  // Clear cache for testing or when needed
  const clearCache = useCallback(() => {
    Object.keys(staffCache).forEach(key => {
      delete staffCache[key];
    });
    console.log('Department staff cache cleared');
  }, []);

  return {
    departmentStaff,
    foodHandlers,
    departmentManagers,
    loading,
    refreshStaffData,
    clearCache
  };
};
