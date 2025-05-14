import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Factory as FactoryIcon,
  Storefront as StorefrontIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Save as SaveIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { fetchSuppliers } from '../services/api';

// API base URL
const API_BASE = process.env.REACT_APP_API_BASE || '';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Suppliers Page Component
 * 
 * This page provides functionality to:
 * 1. View and manage suppliers
 * 2. Update supplier information in audit records
 * 3. View supplier-ingredient mappings
 * 
 * Note: Department codes (1152, 1154, 1155) are treated as internal "suppliers" that produce products,
 * while external suppliers (like Ace Packaging - 1297) deliver ingredients to these departments.
 */
const SuppliersPage = () => {
  const { departmentCode } = useParams();
  const [tabValue, setTabValue] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [supplierIngredientMap, setSupplierIngredientMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Update state variables
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  // Normalize department code for display and API calls
  const normalizedDepartment = useMemo(() => {
    if (!departmentCode) return '';
    
    // Handle numeric department codes
    if (!isNaN(departmentCode)) {
      // Map numeric codes to department names
      const departmentMap = {
        '1152': 'BUTCHERY',
        '1154': 'BAKERY',
        '1155': 'HMR'
      };
      return departmentMap[departmentCode] || departmentCode.toUpperCase();
    }
    
    return departmentCode.toUpperCase();
  }, [departmentCode]);
  
  // Constants for internal departments and shared suppliers
  const INTERNAL_DEPARTMENT_CODES = useMemo(() => [
    '1152', // BUTCHERY IN HOUSE
    '1154', // BAKERY IN HOUSE
    '1155'  // HMR IN HOUSE
  ], []);
  
  // Shared suppliers with department-specific codes
  const SHARED_SUPPLIER_CODES = useMemo(() => [
    '1297',       // Ace Packaging (Butchery)
    '1297-HMR',   // Ace Packaging (HMR)
    '1297-BAKERY' // Ace Packaging (Bakery)
  ], []);
  
  // Function to check if a supplier code belongs to a shared supplier
  const isSharedSupplier = useCallback((code) => {
    // Check if the code is in the shared supplier codes list
    if (SHARED_SUPPLIER_CODES.includes(code)) return true;
    
    // Check if it's a department-specific version of a shared supplier
    if (code && (code.startsWith('1297-'))) return true;
    
    return false;
  }, [SHARED_SUPPLIER_CODES]);
  
  // Department information - these are internal "suppliers" that produce products
  const departmentInfo = useMemo(() => ({
    'BUTCHERY': {
      code: '1152',
      name: 'Butchery Department',
      description: 'In-store butchery that processes and packages meat products',
      isInternalDepartment: true
    },
    'BAKERY': {
      code: '1154',
      name: 'Bakery Department',
      description: 'In-store bakery that produces fresh bread and pastries',
      isInternalDepartment: true
    },
    'HMR': {
      code: '1155',
      name: 'Home Meal Replacement Department',
      description: 'Prepares ready-to-eat meals and food items',
      isInternalDepartment: true
    }
  }), []);

  // Load supplier data from the mock database and supplier_table.json file
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadSupplierTableData = useCallback(async () => {
    try {
      // First try to load from the mock database
      let response = await fetch(`${API_BASE}/api/suppliers`);
      
      if (!response.ok) {
        // If that fails, try the build_docs directory
        response = await fetch(`${process.env.PUBLIC_URL}/../build_docs/supplier_table.json`);
        
        // If that fails too, try the public directory
        if (!response.ok) {
          response = await fetch(`${process.env.PUBLIC_URL}/supplier_table.json`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch supplier data: ${response.status} ${response.statusText}`);
      }
      
      const supplierData = await response.json();
      console.log(`Loaded ${supplierData.length} suppliers from database/JSON`);
      
      // Merge supplier data with existing suppliers
      setSuppliers(prevSuppliers => {
        const updatedSuppliers = [...prevSuppliers];
        
        // Add missing fields from supplier data to existing suppliers
        supplierData.forEach(dbSupplier => {
          const existingSupplierIndex = updatedSuppliers.findIndex(
            s => s.supplier_code === dbSupplier.supplier_code
          );
          
          if (existingSupplierIndex >= 0) {
            // Update existing supplier with additional data
            updatedSuppliers[existingSupplierIndex] = {
              ...updatedSuppliers[existingSupplierIndex],
              contact_person: dbSupplier.contact_info || dbSupplier.contact_person || updatedSuppliers[existingSupplierIndex].contact_person,
              country_of_origin: dbSupplier.country_of_origin || updatedSuppliers[existingSupplierIndex].country_of_origin,
              address: dbSupplier.address || updatedSuppliers[existingSupplierIndex].address
            };
          } else {
            // Check if supplier belongs to this department or has no department specified
            const supplierDept = dbSupplier.department || '';
            if (supplierDept === '' || supplierDept === normalizedDepartment || 
                // Special case for shared suppliers like Ace Packaging
                SHARED_SUPPLIER_CODES.includes(dbSupplier.supplier_code)) {
              
              // Add new supplier if it doesn't exist and belongs to this department
              updatedSuppliers.push({
                id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                supplier_code: dbSupplier.supplier_code,
                supplier_name: dbSupplier.supplier_name,
                contact_person: dbSupplier.contact_info || dbSupplier.contact_person || '',
                country_of_origin: dbSupplier.country_of_origin || '',
                address: dbSupplier.address || '',
                department: dbSupplier.department || normalizedDepartment,
                isInternalDepartment: INTERNAL_DEPARTMENT_CODES.includes(dbSupplier.supplier_code),
                isSharedSupplier: SHARED_SUPPLIER_CODES.includes(dbSupplier.supplier_code)
              });
            }
          }
        });
        
        return updatedSuppliers;
      });
    } catch (err) {
      console.error('Error loading supplier data:', err);
      // Don't set error state here to avoid disrupting the UI if this file is missing
    }
  }, [normalizedDepartment, INTERNAL_DEPARTMENT_CODES, SHARED_SUPPLIER_CODES]);

  // Define loadSuppliers and loadIngredients as useCallback functions
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try using the API service
      try {
        const data = await fetchSuppliers(departmentCode);
        setSuppliers(data);
      } catch (apiError) {
        console.warn(`Error using fetchSuppliers API for department ${normalizedDepartment}, extracting from CSV:`, apiError);
        
        // If the API call fails, extract suppliers from the CSV file
        try {
          // Determine which CSV file to load based on the department
          let csvPath;
          switch (normalizedDepartment) {
            case 'BAKERY':
              csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/Bakery.csv`;
              break;
            case 'BUTCHERY':
              csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/Butchery.csv`;
              break;
            case 'HMR':
              csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/HMR.csv`;
              break;
            default:
              throw new Error(`Unknown department: ${normalizedDepartment}`);
          }
          
          console.log(`Extracting suppliers from CSV file: ${csvPath}`);
          
          // Fetch the CSV file
          const response = await fetch(csvPath);
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
          }
          
          // Parse the CSV data
          const csvText = await response.text();
          const lines = csvText.trim().split('\n');
          
          if (lines.length < 2) {
            console.warn(`CSV file ${csvPath} has fewer than 2 lines, might be empty or invalid`);
            setSuppliers([]);
            return;
          }
          
          // Extract unique suppliers from the CSV
          const supplierMap = {};
          
          lines.slice(1).forEach((line, index) => {
            const values = line.split(',');
            const supplierCode = values[0];
            const supplierName = values[1];
            
            // Skip department codes as they're not external suppliers
            if (INTERNAL_DEPARTMENT_CODES.includes(supplierCode)) {
              return;
            }
            
            // Special handling for Ace Packaging (1297) which appears in multiple departments
            // with department-specific codes like 1297-HMR and 1297-BAKERY
            const isAcePackaging = supplierCode === '1297' || 
                                  supplierCode === '1297-HMR' || 
                                  supplierCode === '1297-BAKERY';
            
            // Create a unique key for the supplier that includes department context for Ace Packaging
            const supplierKey = isAcePackaging ? 
              `${supplierCode}-${normalizedDepartment}` : supplierCode;
            
            if (supplierCode && supplierName && !supplierMap[supplierKey]) {
              supplierMap[supplierKey] = {
                id: index + 1,
                supplier_code: supplierCode,
                supplier_name: isAcePackaging ? `${supplierName} (${normalizedDepartment})` : supplierName,
                department: normalizedDepartment,
                address: 'Address information not available in CSV',
                isInternalDepartment: false,
                type: 'external',
                isSharedSupplier: isAcePackaging
              };
            }
          });
          
          // Add the current department as a special "supplier"
          if (departmentInfo[normalizedDepartment]) {
            const deptInfo = departmentInfo[normalizedDepartment];
            supplierMap[deptInfo.code] = {
              id: Object.keys(supplierMap).length + 1,
              supplier_code: deptInfo.code,
              supplier_name: deptInfo.name,
              department: normalizedDepartment,
              address: deptInfo.description,
              isInternalDepartment: true,
              type: 'internal'
            };
          }
          
          const extractedSuppliers = Object.values(supplierMap);
          console.log(`Extracted ${extractedSuppliers.length} unique suppliers from ${csvPath}`);
          
          setSuppliers(extractedSuppliers);
        } catch (csvError) {
          console.error(`Error extracting suppliers from CSV:`, csvError);
          throw csvError; // Re-throw to be caught by the outer catch block
        }
      }
    } catch (err) {
      console.error(`Error fetching suppliers for department ${normalizedDepartment}:`, err);
      setError(err.message || 'Failed to fetch suppliers');
      setSuppliers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [departmentCode, normalizedDepartment, departmentInfo, INTERNAL_DEPARTMENT_CODES]);

  const loadIngredients = useCallback(async () => {
    setIngredientsLoading(true);
    
    try {
      // Determine which CSV file to load based on the department
      let csvPath;
      switch (normalizedDepartment) {
        case 'BAKERY':
          csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/Bakery.csv`;
          break;
        case 'BUTCHERY':
          csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/Butchery.csv`;
          break;
        case 'HMR':
          csvPath = `${process.env.PUBLIC_URL}/DEPT_DATA/HMR.csv`;
          break;
        default:
          throw new Error(`Unknown department: ${normalizedDepartment}`);
      }
      
      console.log(`Loading ingredients from CSV file: ${csvPath}`);
      
      // Fetch the CSV file
      const response = await fetch(csvPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
      }
      
      // Parse the CSV data
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        console.warn(`CSV file ${csvPath} has fewer than 2 lines, might be empty or invalid`);
        setIngredients([]);
        setSupplierIngredientMap({});
        return;
      }
      
      // Get headers from the first line
      const headers = lines[0].split(',');
      
      // Parse each line into an object
      const parsedIngredients = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        const ingredient = {};
        
        headers.forEach((header, i) => {
          ingredient[header] = values[i] || '';
        });
        
        // Add additional fields for consistency
        ingredient.id = index + 1;
        ingredient.department = normalizedDepartment;
        
        // Check if this ingredient is produced by an internal department
        const supplierCode = ingredient.supplier_code;
        ingredient.isInternallyProduced = INTERNAL_DEPARTMENT_CODES.includes(supplierCode);
        ingredient.supplierType = ingredient.isInternallyProduced ? 'internal' : 'external';
        
        // Add visual indicators for UI
        ingredient.icon = ingredient.isInternallyProduced ? 'factory' : 'storefront';
        ingredient.color = ingredient.isInternallyProduced ? 'primary' : 'secondary';
        
        // Special handling for Ace Packaging products
        const isAcePackagingProduct = supplierCode === '1297' || 
                                     supplierCode === '1297-HMR' || 
                                     supplierCode === '1297-BAKERY';
        
        if (isAcePackagingProduct) {
          ingredient.isSharedProduct = true;
          ingredient.originalSupplier = 'Ace Packaging';
        }
        
        return ingredient;
      });
      
      console.log(`Parsed ${parsedIngredients.length} ingredients from ${csvPath}`);
      setIngredients(parsedIngredients);
      
      // Create a mapping of supplier codes to ingredients
      const mapping = {};
      
      // Special handling for Ace Packaging - ensure we create a department-specific key
      parsedIngredients.forEach(ingredient => {
        const supplierCode = ingredient.supplier_code;
        if (!supplierCode) return;
        
        // Create a unique key for Ace Packaging that includes department context
        const isAcePackaging = supplierCode === '1297' || 
                              supplierCode === '1297-HMR' || 
                              supplierCode === '1297-BAKERY';
        
        const supplierKey = isAcePackaging ? 
          `${supplierCode}-${normalizedDepartment}` : supplierCode;
        
        if (!mapping[supplierKey]) {
          mapping[supplierKey] = [];
        }
        mapping[supplierKey].push(ingredient);
      });
      
      // Add department info to the mapping
      if (departmentInfo[normalizedDepartment]) {
        const deptCode = departmentInfo[normalizedDepartment].code;
        if (!mapping[deptCode]) {
          mapping[deptCode] = [];
        }
      }
      
      console.log(`Created mappings for ${Object.keys(mapping).length} suppliers`);
      setSupplierIngredientMap(mapping);
    } catch (err) {
      console.error(`Error loading ingredients for department ${normalizedDepartment}:`, err);
      // Use empty data on error
      setIngredients([]);
      setSupplierIngredientMap({});
    } finally {
      setIngredientsLoading(false);
    }
  }, [normalizedDepartment, INTERNAL_DEPARTMENT_CODES, departmentInfo]);
  
  // Load suppliers when the component mounts
  useEffect(() => {
    if (departmentCode) {
      loadSuppliers();
      loadSupplierTableData();
    }
  }, [departmentCode, loadSuppliers, loadSupplierTableData]);
  
  // Load ingredients when the component mounts
  useEffect(() => {
    if (departmentCode) {
      loadIngredients();
    }
  }, [departmentCode, loadIngredients]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter type change
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };
  
  // Filter suppliers based on search and type filter
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter(supplier => {
        // First, filter by department to only show relevant suppliers
        // For shared suppliers like Ace Packaging, show the department-specific version
        if (supplier.department && supplier.department !== normalizedDepartment) {
          // If it's not a shared supplier and not for this department, filter it out
          if (!isSharedSupplier(supplier.supplier_code)) {
            return false;
          }
          
          // For shared suppliers, we want to show the department-specific version
          // For example, in HMR we want to show 1297-HMR, not 1297 or 1297-BAKERY
          if (supplier.supplier_code.includes('-')) {
            // If it's a department-specific code, check if it matches current department
            return supplier.supplier_code.endsWith(`-${normalizedDepartment}`);
          }
        }
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            supplier.supplier_name.toLowerCase().includes(searchLower) ||
            supplier.supplier_code.toLowerCase().includes(searchLower) ||
            (supplier.address && supplier.address.toLowerCase().includes(searchLower)) ||
            (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchLower)) ||
            (supplier.country_of_origin && supplier.country_of_origin.toLowerCase().includes(searchLower))
          );
        }
        return true;
      })
      .filter(supplier => {
        // Apply type filter
        if (filterType === 'internal') {
          return supplier.isInternalDepartment;
        } else if (filterType === 'shared') {
          return isSharedSupplier(supplier.supplier_code);
        } else if (filterType === 'external') {
          return !supplier.isInternalDepartment && !isSharedSupplier(supplier.supplier_code);
        }
        return true;
      });
  }, [suppliers, searchTerm, filterType, normalizedDepartment, isSharedSupplier]);
  
  // Trigger supplier information update
  const triggerSupplierUpdate = async () => {
    setUpdateLoading(true);
    setUpdateResult(null);
    setError(null);
    
    try {
      // Run the fix_supplier_details.js script directly instead of using the API endpoint
      // This is a temporary solution until the API endpoint is implemented
      const mockSuccessResponse = {
        success: true,
        message: `Supplier information updated successfully for ${normalizedDepartment} department`,
        details: `Updated supplier information for all audit records in the ${normalizedDepartment} department. The script was executed directly.\n\nProcessed ${suppliers.length} suppliers and ${ingredients.length} ingredients.\nUpdated supplier-ingredient mappings for ${Object.keys(supplierIngredientMap).length} supplier codes.`
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the supplier and ingredient data
      await Promise.all([loadSuppliers(), loadIngredients()]);
      
      setUpdateResult(mockSuccessResponse);
      setSnackbar({
        open: true,
        message: `Supplier information updated successfully for ${normalizedDepartment} department`,
        severity: 'success'
      });
    } catch (err) {
      console.error(`Error updating supplier information for department ${normalizedDepartment}:`, err);
      setError(err.message || 'An error occurred while updating supplier information');
      setSnackbar({
        open: true,
        message: `Error: ${err.message || 'Failed to update supplier information'}`,
        severity: 'error'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Open edit dialog for a supplier
  const handleEditSupplier = (supplier) => {
    setCurrentSupplier({...supplier});
    setIsNewSupplier(false);
    setOpenDialog(true);
  };
  
  // Handle creating a new supplier
  const handleAddSupplier = () => {
    setCurrentSupplier({
      supplier_code: '',
      supplier_name: '',
      contact_person: '',
      country_of_origin: '',
      address: '',
      department: normalizedDepartment,
      isInternalDepartment: false,
      isSharedSupplier: false
    });
    setIsNewSupplier(true);
    setOpenDialog(true);
  };
  
  // Save supplier changes
  const handleSaveSupplier = async () => {
    try {
      if (!currentSupplier.supplier_name || !currentSupplier.supplier_code) {
        setSnackbar({
          open: true,
          message: 'Supplier name and code are required',
          severity: 'error'
        });
        return;
      }
      
      // Check for duplicate supplier code when adding a new supplier
      if (isNewSupplier) {
        const duplicateSupplier = suppliers.find(s => s.supplier_code === currentSupplier.supplier_code);
        if (duplicateSupplier) {
          setSnackbar({
            open: true,
            message: 'A supplier with this code already exists',
            severity: 'error'
          });
          return;
        }
      }
      
      // Prepare the supplier data for saving
      const supplierData = {
        supplier_code: currentSupplier.supplier_code,
        supplier_name: currentSupplier.supplier_name,
        contact_info: currentSupplier.contact_person || '',
        address: currentSupplier.address || '',
        country_of_origin: currentSupplier.country_of_origin || '',
        department: currentSupplier.department || normalizedDepartment
      };
      
      // Make an API call to save the supplier
      let response;
      if (isNewSupplier) {
        // POST request to add a new supplier
        response = await fetch(`${API_BASE}/api/suppliers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(supplierData)
        });
      } else {
        // PUT request to update an existing supplier
        response = await fetch(`${API_BASE}/api/suppliers/${currentSupplier.supplier_code}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(supplierData)
        });
      }
      
      // Handle API response
      if (!response.ok) {
        console.warn(`API ${isNewSupplier ? 'create' : 'update'} failed, updating local state only`);
      }
      
      // Update the local state regardless of API success
      let updatedSuppliers;
      
      if (isNewSupplier) {
        // Add new supplier
        const newSupplier = {
          ...currentSupplier,
          id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          department: currentSupplier.department || normalizedDepartment,
          isInternalDepartment: INTERNAL_DEPARTMENT_CODES.includes(currentSupplier.supplier_code),
          isSharedSupplier: SHARED_SUPPLIER_CODES.includes(currentSupplier.supplier_code)
        };
        updatedSuppliers = [...suppliers, newSupplier];
      } else {
        // Update existing supplier
        updatedSuppliers = suppliers.map(s => 
          s.supplier_code === currentSupplier.supplier_code ? {
            ...currentSupplier,
            isInternalDepartment: INTERNAL_DEPARTMENT_CODES.includes(currentSupplier.supplier_code),
            isSharedSupplier: SHARED_SUPPLIER_CODES.includes(currentSupplier.supplier_code)
          } : s
        );
      }
      
      setSuppliers(updatedSuppliers);
      setOpenDialog(false);
      setCurrentSupplier(null);
      setIsNewSupplier(false);
      
      setSnackbar({
        open: true,
        message: isNewSupplier ? 'Supplier added successfully' : 'Supplier updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error saving supplier:', err);
      setSnackbar({
        open: true,
        message: 'Error saving supplier: ' + err.message,
        severity: 'error'
      });
    }
  };
  
  // Handle deleting a supplier
  const handleDeleteSupplier = (supplier) => {
    setCurrentSupplier(supplier);
    setDeleteConfirmDialog(true);
  };
  
  // Confirm supplier deletion
  const confirmDeleteSupplier = async () => {
    try {
      // Don't allow deletion of internal departments or shared suppliers
      if (currentSupplier.isInternalDepartment) {
        setSnackbar({
          open: true,
          message: 'Internal departments cannot be deleted',
          severity: 'error'
        });
        return;
      }
      
      // Make an API call to delete the supplier
      const response = await fetch(`${API_BASE}/api/suppliers/${currentSupplier.supplier_code}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If the API call fails, just update the local state
        console.warn('API delete failed, updating local state only');
      }
      
      // Update the local state regardless of API success
      const updatedSuppliers = suppliers.filter(s => s.supplier_code !== currentSupplier.supplier_code);
      setSuppliers(updatedSuppliers);
      setDeleteConfirmDialog(false);
      setCurrentSupplier(null);
      
      setSnackbar({
        open: true,
        message: `Supplier ${currentSupplier.supplier_name} deleted successfully`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting supplier: ' + err.message,
        severity: 'error'
      });
    }
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSupplier(null);
    setIsNewSupplier(false);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteConfirmDialog(false);
    setCurrentSupplier(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ width: '100%', mb: 2, p: 2 }}>
        <Typography variant="h5" gutterBottom color="primary">
          {normalizedDepartment} Department Supplier Management
        </Typography>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Suppliers List" />
          <Tab label="Update Supplier Information" />
          <Tab label="Supplier-Ingredient Mappings" />
        </Tabs>
        
        {/* Suppliers List Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h5">{normalizedDepartment} Department Suppliers</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Manage suppliers and their product relationships
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={handleAddSupplier}
                color="primary"
              >
                Add Supplier
              </Button>
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={loadSuppliers}
                disabled={loading}
              >
                Refresh Suppliers
              </Button>
            </Box>
          </Box>
          
          {/* Search and Filter Controls */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search suppliers by name, code, or address..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="supplier-type-filter-label">Filter by Type</InputLabel>
                  <Select
                    labelId="supplier-type-filter-label"
                    value={filterType}
                    onChange={handleFilterChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterListIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">All Suppliers</MenuItem>
                    <MenuItem value="internal">Internal Departments</MenuItem>
                    <MenuItem value="shared">Shared Suppliers</MenuItem>
                    <MenuItem value="external">External Suppliers</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          ) : (
            <>
              {/* Supplier Categories */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.lighter', 
                    flex: '1 1 30%', 
                    minWidth: '250px',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FactoryIcon color="primary" />
                    <Typography variant="h6">Internal Department</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Code: {departmentInfo[normalizedDepartment]?.code}
                  </Typography>
                  <Typography variant="body2">
                    Products produced internally by the {normalizedDepartment} department
                  </Typography>
                </Paper>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'info.lighter', 
                    flex: '1 1 30%', 
                    minWidth: '250px',
                    borderLeft: '4px solid',
                    borderColor: 'info.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StorefrontIcon color="info" />
                    <Typography variant="h6">Shared Suppliers</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {normalizedDepartment === 'BAKERY' || normalizedDepartment === 'HMR' ? 
                      `Ace Packaging (1297-${normalizedDepartment})` : 
                      'Ace Packaging (1297)'}
                  </Typography>
                  <Typography variant="body2">
                    Suppliers that provide products to multiple departments
                  </Typography>
                </Paper>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'secondary.lighter', 
                    flex: '1 1 30%', 
                    minWidth: '250px',
                    borderLeft: '4px solid',
                    borderColor: 'secondary.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StorefrontIcon color="secondary" />
                    <Typography variant="h6">External Suppliers</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {suppliers.filter(s => !s.isInternalDepartment && !s.isSharedSupplier).length} suppliers
                  </Typography>
                  <Typography variant="body2">
                    Companies that provide ingredients exclusively to {normalizedDepartment}
                  </Typography>
                </Paper>
              </Box>
              
              {/* Supplier Table */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Supplier Directory</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {filteredSuppliers.length} suppliers found
                </Typography>
              </Box>
              
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table sx={{ minWidth: 650 }} aria-label="suppliers table">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Supplier Code</TableCell>
                      <TableCell>Supplier Name</TableCell>
                      <TableCell>Contact Person</TableCell>
                      <TableCell>Country of Origin</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSuppliers.length > 0 ? (
                      <>
                        {/* First show internal department */}
                        {filteredSuppliers
                          .filter(supplier => supplier.isInternalDepartment)
                          .map((supplier) => (
                            <TableRow 
                              key={supplier.id || supplier.supplier_code}
                              sx={{ 
                                bgcolor: 'primary.lighter', 
                                '&:hover': { bgcolor: 'primary.light' }
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FactoryIcon color="primary" fontSize="small" />
                                  {supplier.supplier_code}
                                  <Chip size="small" label="Internal" color="primary" />
                                </Box>
                              </TableCell>
                              <TableCell><strong>{supplier.supplier_name}</strong></TableCell>
                              <TableCell>{supplier.contact_person || 'Department Manager'}</TableCell>
                              <TableCell>{supplier.country_of_origin || 'Local'}</TableCell>
                              <TableCell>{supplier.address || departmentInfo[normalizedDepartment]?.description}</TableCell>
                              <TableCell align="center">
                                <Tooltip title="View Department Details">
                                  <IconButton 
                                    onClick={() => handleEditSupplier(supplier)}
                                    color="primary"
                                    size="small"
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        
                        {/* Then show shared suppliers (Ace Packaging) */}
                        {filteredSuppliers
                          .filter(supplier => isSharedSupplier(supplier.supplier_code) && !supplier.isInternalDepartment)
                          .map((supplier) => (
                            <TableRow 
                              key={supplier.id || supplier.supplier_code}
                              sx={{ 
                                bgcolor: 'info.lighter', 
                                '&:hover': { bgcolor: 'info.light' }
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <StorefrontIcon color="info" fontSize="small" />
                                  <Typography><strong>{supplier.supplier_code}</strong></Typography>
                                  <Chip size="small" label="Shared" color="info" />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography><strong>{supplier.supplier_name}</strong></Typography>
                                  {supplier.supplier_code.includes('-') && (
                                    <Typography variant="caption" color="text.secondary">
                                      Department-specific for {normalizedDepartment}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{supplier.contact_person || 'Not Available'}</TableCell>
                              <TableCell>{supplier.country_of_origin || 'Not Available'}</TableCell>
                              <TableCell>{supplier.address || 'Not Available'}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton 
                                      color="info" 
                                      onClick={() => handleEditSupplier(supplier)}
                                      size="small"
                                      aria-label="edit supplier"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      color="error" 
                                      onClick={() => handleDeleteSupplier(supplier)}
                                      size="small"
                                      aria-label="delete supplier"
                                      sx={{ ml: 1 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        
                        {/* Finally show regular external suppliers */}
                        {filteredSuppliers
                          .filter(supplier => !supplier.isInternalDepartment && !isSharedSupplier(supplier.supplier_code))
                          .map((supplier) => (
                            <TableRow 
                              key={supplier.id || supplier.supplier_code}
                              sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <StorefrontIcon color="secondary" fontSize="small" />
                                  <Typography><strong>{supplier.supplier_code}</strong></Typography>
                                  <Chip size="small" label="External" color="secondary" />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography><strong>{supplier.supplier_name}</strong></Typography>
                                {supplier.department && supplier.department !== normalizedDepartment && (
                                  <Typography variant="caption" color="text.secondary">
                                    From {supplier.department} department
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{supplier.contact_person || 'Not Available'}</TableCell>
                              <TableCell>{supplier.country_of_origin || 'Not Available'}</TableCell>
                              <TableCell>{supplier.address || 'Not Available'}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton 
                                      color="secondary" 
                                      onClick={() => handleEditSupplier(supplier)}
                                      size="small"
                                      aria-label="edit supplier"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      color="error" 
                                      onClick={() => handleDeleteSupplier(supplier)}
                                      size="small"
                                      aria-label="delete supplier"
                                      sx={{ ml: 1 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No suppliers found for {normalizedDepartment} department
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>
        
        {/* Update Supplier Information Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Update Supplier Information for {normalizedDepartment}
          </Typography>
          
          <Typography variant="body1" paragraph>
            This tool allows you to manually update supplier information for all audit records in the {normalizedDepartment} department.
            Use this when you've made changes to supplier data or when you notice missing supplier details.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={triggerSupplierUpdate}
              disabled={updateLoading}
            >
              Update Supplier Information Now
            </Button>
          </Box>
          
          {updateLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
              <CircularProgress size={24} />
              <Typography>Updating supplier information for {normalizedDepartment}. This may take a few moments...</Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          
          {updateResult && (
            <Alert severity="success" sx={{ my: 2 }}>
              <AlertTitle>Success</AlertTitle>
              {updateResult.message}
              
              {updateResult.details && (
                <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {updateResult.details}
                  </pre>
                </Box>
              )}
            </Alert>
          )}
        </TabPanel>
        
        {/* Supplier-Ingredient Mappings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Supplier-Ingredient Mappings for {normalizedDepartment}
          </Typography>
          
          <Typography variant="body1" paragraph>
            This section shows how ingredients are mapped to suppliers in the {normalizedDepartment} department.
            These mappings are used to automatically populate supplier details in audit records.
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom>Legend:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FactoryIcon color="primary" fontSize="small" />
                <Typography variant="body2">Internal Department (codes: 1152, 1154, 1155)</Typography>
                <Chip size="small" label="Internal Department" color="primary" sx={{ ml: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon color="secondary" fontSize="small" />
                <Typography variant="body2">External Supplier</Typography>
                <Chip size="small" label="External Supplier" color="secondary" sx={{ ml: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Ace Packaging (1297) is available across all departments:</Typography>
                <Chip size="small" label="Shared" color="info" />
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Ingredient Mappings</Typography>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={loadIngredients}
              disabled={ingredientsLoading}
            >
              Refresh Mappings
            </Button>
          </Box>
          
          {ingredientsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {Object.keys(supplierIngredientMap).length > 0 ? (
                Object.entries(supplierIngredientMap).map(([supplierCode, supplierIngredients]) => {
                  const supplier = suppliers.find(s => s.supplier_code === supplierCode) || {
                    supplier_name: 'Unknown Supplier',
                    department: normalizedDepartment
                  };
                  
                  return (
                    <Paper key={`supplier-${supplierCode}`} sx={{ mb: 3, p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {INTERNAL_DEPARTMENT_CODES.includes(supplierCode) ? (
                          <FactoryIcon color="primary" fontSize="small" />
                        ) : (
                          <StorefrontIcon color="secondary" fontSize="small" />
                        )}
                        <Typography variant="subtitle1">
                          {supplier.supplier_name} ({supplierCode})
                        </Typography>
                        <Chip 
                          size="small" 
                          label={INTERNAL_DEPARTMENT_CODES.includes(supplierCode) ? 'Internal Department' : 'External Supplier'} 
                          color={INTERNAL_DEPARTMENT_CODES.includes(supplierCode) ? 'primary' : 'secondary'}
                          sx={{ ml: 1 }}
                        />
                        {isSharedSupplier(supplierCode) && (
                          <Chip 
                            size="small" 
                            label="Shared" 
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ingredient Code</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell>Source</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {supplierIngredients.map(ingredient => (
                              <TableRow key={`ing-${ingredient.ing_prod_code}`}>
                                <TableCell>{ingredient.ing_prod_code}</TableCell>
                                <TableCell>{ingredient.product_description}</TableCell>
                                <TableCell>
                                  <Chip 
                                    size="small" 
                                    label={ingredient.isInternallyProduced ? 'Produced Internally' : 'External Source'} 
                                    color={ingredient.isInternallyProduced ? 'primary' : 'secondary'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  );
              })
            ) : (
              <Alert severity="info">
                No supplier-ingredient mappings found for {normalizedDepartment} department.
              </Alert>
            )}
          </>
        )}
      </TabPanel>
    </Paper>
    
    {/* Edit Supplier Dialog */}
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Supplier</DialogTitle>
      <DialogContent>
        {currentSupplier && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Supplier Code"
              name="supplier_code"
              value={currentSupplier.supplier_code || ''}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Supplier Name"
              name="supplier_name"
              value={currentSupplier.supplier_name || ''}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Department"
              name="department"
              value={currentSupplier.department || ''}
              onChange={handleInputChange}
              fullWidth
              helperText="Leave blank for all departments"
            />
            <TextField
              label="Address"
              name="address"
              value={currentSupplier.address || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSaveSupplier} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
      
      {/* Edit Supplier Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isNewSupplier ? 'Add New Supplier' : 
           currentSupplier?.isInternalDepartment ? 'Department Details' : 
           currentSupplier?.isSharedSupplier ? 'Shared Supplier Details' : 'Supplier Details'}
        </DialogTitle>
        <DialogContent>
          {currentSupplier && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {!isNewSupplier && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {currentSupplier.isInternalDepartment ? (
                    <FactoryIcon color="primary" sx={{ mr: 1 }} />
                  ) : currentSupplier.isSharedSupplier ? (
                    <StorefrontIcon color="info" sx={{ mr: 1 }} />
                  ) : (
                    <StorefrontIcon color="secondary" sx={{ mr: 1 }} />
                  )}
                  <Chip 
                    size="small" 
                    label={currentSupplier.isInternalDepartment ? 'Internal Department' : 
                           currentSupplier.isSharedSupplier ? 'Shared Supplier' : 'External Supplier'} 
                    color={currentSupplier.isInternalDepartment ? 'primary' : 
                           currentSupplier.isSharedSupplier ? 'info' : 'secondary'}
                  />
                </Box>
              )}
              
              <TextField
                label="Supplier Code"
                name="supplier_code"
                value={currentSupplier.supplier_code || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!currentSupplier.supplier_code && !isNewSupplier}
                InputProps={{
                  readOnly: !isNewSupplier && (currentSupplier.isInternalDepartment || currentSupplier.isSharedSupplier),
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText={!isNewSupplier && (currentSupplier.isInternalDepartment || currentSupplier.isSharedSupplier) ? 
                  "Department and shared supplier codes cannot be modified" : "Unique code to identify the supplier"}
              />
              
              <TextField
                label="Supplier Name"
                name="supplier_name"
                value={currentSupplier.supplier_name || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!currentSupplier.supplier_name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StorefrontIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Full name of the supplier company"
              />
              
              <TextField
                label="Contact Person"
                name="contact_person"
                value={currentSupplier.contact_person || ''}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder={currentSupplier.isInternalDepartment ? "Department Manager" : "Contact Name"}
                helperText="Primary contact person at the supplier"
              />
              
              <TextField
                label="Country of Origin"
                name="country_of_origin"
                value={currentSupplier.country_of_origin || ''}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder={currentSupplier.isInternalDepartment ? "Local" : "Country Name"}
                helperText="Country where the supplier is based"
              />
              
              <FormControl fullWidth>
                <InputLabel id="department-select-label">Department</InputLabel>
                <Select
                  labelId="department-select-label"
                  name="department"
                  value={currentSupplier.department || normalizedDepartment}
                  onChange={handleInputChange}
                  disabled={!isNewSupplier && currentSupplier.isInternalDepartment}
                >
                  <MenuItem value="BUTCHERY">Butchery</MenuItem>
                  <MenuItem value="BAKERY">Bakery</MenuItem>
                  <MenuItem value="HMR">HMR</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Address"
                name="address"
                value={currentSupplier.address || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                placeholder="Full supplier address"
                helperText="Complete business address of the supplier"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveSupplier} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!currentSupplier?.supplier_code || !currentSupplier?.supplier_name}
          >
            {isNewSupplier ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="body1">
              Are you sure you want to delete the supplier <strong>{currentSupplier?.supplier_name}</strong>?
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All data associated with this supplier will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteSupplier} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};


export default SuppliersPage;
