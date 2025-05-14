/**
 * Supplier Data Update Utility
 * 
 * This script provides a unified way to update supplier information in audit records.
 * It can use either CSV files or the ingredient_supplier_mapping table as the data source.
 * 
 * Usage:
 *   node update_supplier_data.js --source=csv
 *   node update_supplier_data.js --source=mapping
 */

const fs = require('fs');
const path = require('path');
const { normalizeDepartmentCode, findSupplierForIngredient } = require('../utils/supplierIngredientUtils');

// Path to the mock database file
const DB_PATH = path.join(__dirname, '../../mock/db.json');

// Path to the department table file
const DEPARTMENT_TABLE_PATH = path.join(__dirname, '../data/department_table.json');

// CSV paths for each department
const CSV_PATHS = {
  BAKERY: path.join(__dirname, '../../public/DEPT_DATA/Bakery.csv'),
  HMR: path.join(__dirname, '../../public/DEPT_DATA/HMR.csv'),
  BUTCHERY: path.join(__dirname, '../../public/DEPT_DATA/Butchery.csv')
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: 'csv' // Default to CSV source
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1].toLowerCase();
    }
  });
  
  return options;
}

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
 * @returns {Array} Parsed CSV data
 */
function loadCSVData(department) {
  try {
    // Determine the CSV file path based on department
    const csvPath = CSV_PATHS[department];
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`);
      return [];
    }
    
    // Read and parse the CSV file
    const csvText = fs.readFileSync(csvPath, 'utf8');
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading CSV data for ${department}:`, error);
    return [];
  }
}

/**
 * Load all CSV data from all departments
 * @returns {Array} Combined CSV data from all departments
 */
function loadAllCSVData() {
  const allData = [];
  
  for (const dept of ['BAKERY', 'HMR', 'BUTCHERY']) {
    const deptData = loadCSVData(dept);
    // Add department field to each row
    const enhancedData = deptData.map(row => ({
      ...row,
      department: dept
    }));
    allData.push(...enhancedData);
  }
  
  console.log(`Loaded ${allData.length} total rows from all CSV files`);
  return allData;
}

/**
 * Read the database file
 * @returns {Object} Database content
 */
function readDatabase() {
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database:', error);
    throw error;
  }
}

/**
 * Load the department table
 * @returns {Array} Department table data
 */
function loadDepartmentTable() {
  try {
    const content = fs.readFileSync(DEPARTMENT_TABLE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading department table:', error);
    return [];
  }
}

/**
 * Get the department manager name for a given department code
 * @param {string} departmentCode - Department code
 * @returns {string} Department manager name
 */
function getDepartmentManager(departmentCode) {
  if (!departmentCode) return '';
  
  // Map department codes to manager names
  const managerMap = {
    '1154': 'Monica',  // Bakery
    '1152': 'Clive',   // Butchery
    '1155': 'Monica'   // HMR
  };
  
  // Check if we have a direct mapping
  if (managerMap[departmentCode]) {
    return managerMap[departmentCode];
  }
  
  // If not, try to look up in the department table
  const departments = loadDepartmentTable();
  
  // Find the department with the matching code
  const department = departments.find(dept => 
    dept.department_code === departmentCode || 
    dept.department === normalizeDepartmentCode(departmentCode)
  );
  
  // Return the manager name if found, otherwise empty string
  return department ? department.department_manager : '';
}

/**
 * Write the database file
 * @param {Object} db - Database content
 */
function writeDatabase(db) {
  try {
    const content = JSON.stringify(db, null, 2);
    fs.writeFileSync(DB_PATH, content, 'utf8');
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}

/**
 * Update audit records with supplier details using CSV files as the data source
 */
function updateAuditsFromCSV() {
  console.log('Updating audit records with supplier details from CSV files...');
  
  // Load all CSV data
  const csvData = loadAllCSVData();
  
  if (csvData.length === 0) {
    console.error('No CSV data found. Make sure the CSV files exist.');
    return;
  }
  
  // Read the database
  const db = readDatabase();
  
  if (!db.audits || !Array.isArray(db.audits)) {
    console.error('No audits found in database');
    return;
  }
  
  console.log(`Found ${db.audits.length} audit records`);
  let updatedCount = 0;
  
  // Process each audit record
  db.audits = db.audits.map(audit => {
    if (!audit.ingredient_list || !audit.ingredient_list.length) {
      return audit;
    }
    
    console.log(`Processing audit ${audit.uid} with ${audit.ingredient_list.length} ingredients`);
    
    // Create supplier_details array if it doesn't exist
    if (!audit.supplier_details) {
      audit.supplier_details = [];
    }
    
    // Ensure supplier_name and address_of_supplier arrays exist
    if (!audit.supplier_name) audit.supplier_name = [];
    if (!audit.address_of_supplier) audit.address_of_supplier = [];
    
    // For each ingredient, look up supplier details
    audit.ingredient_list.forEach((ingredient, index) => {
      // Use the shared utility function to find supplier details
      const supplierDetail = findSupplierForIngredient(ingredient, audit.department, csvData);
      
      if (supplierDetail) {
        console.log(`Found supplier details for ingredient "${ingredient}":`, supplierDetail.name);
        
        // Update supplier_details
        audit.supplier_details[index] = supplierDetail;
        
        // Also update supplier_name and address_of_supplier for backward compatibility
        audit.supplier_name[index] = supplierDetail.name;
        audit.address_of_supplier[index] = supplierDetail.address || '';
        
        updatedCount++;
      } else {
        console.log(`No supplier details found for ingredient "${ingredient}"`);
        
        // If we already have supplier details for this index, keep them
        if (!audit.supplier_details[index]) {
          // If we have a supplier name but no details, create a basic supplier detail object
          if (audit.supplier_name && audit.supplier_name[index]) {
            audit.supplier_details[index] = {
              name: audit.supplier_name[index],
              supplier_code: '',
              address: audit.address_of_supplier ? audit.address_of_supplier[index] || '' : '',
              contact_person: '',
              email: '',
              phone: ''
            };
          } else {
            // If we have no supplier information at all, create a placeholder
            audit.supplier_details[index] = {
              name: 'Unknown',
              supplier_code: '',
              address: '',
              contact_person: '',
              email: '',
              phone: ''
            };
            audit.supplier_name[index] = 'Unknown';
          }
        }
      }
    });
    
    return audit;
  });
  
  console.log(`Updated ${updatedCount} ingredient supplier details`);
  
  // Write the updated data back to the database file
  writeDatabase(db);
}

/**
 * Update audit records with supplier details using the ingredient_supplier_mapping table
 */
function updateAuditsFromMapping() {
  console.log('Updating audit records with supplier details from ingredient_supplier_mapping table...');
  
  // Read the database
  const db = readDatabase();
  
  // Get the ingredient-supplier mappings
  const mappings = db.ingredient_supplier_mapping || [];
  if (mappings.length === 0) {
    console.error('No ingredient-supplier mappings found. Run populate_ingredient_supplier_mapping.js first.');
    return;
  }
  
  console.log(`Found ${mappings.length} ingredient-supplier mappings`);
  
  if (!db.audits || !Array.isArray(db.audits)) {
    console.error('No audits found in database');
    return;
  }
  
  console.log(`Found ${db.audits.length} audit records`);
  let updatedCount = 0;
  
  // Process each audit record
  db.audits = db.audits.map(audit => {
    if (!audit.ingredient_list || !audit.ingredient_list.length) {
      return audit;
    }
    
    console.log(`Processing audit ${audit.uid} with ${audit.ingredient_list.length} ingredients`);
    
    // Create supplier_details array if it doesn't exist
    if (!audit.supplier_details) {
      audit.supplier_details = [];
    }
    
    // Ensure supplier_name and address_of_supplier arrays exist
    if (!audit.supplier_name) audit.supplier_name = [];
    if (!audit.address_of_supplier) audit.address_of_supplier = [];
    
    // For each ingredient, look up supplier details
    audit.ingredient_list.forEach((ingredient, index) => {
      // Use the shared utility function to find supplier details
      const supplierDetail = findSupplierForIngredient(ingredient, audit.department, mappings);
      
      if (supplierDetail) {
        console.log(`Found supplier details for ingredient "${ingredient}":`, supplierDetail.name);
        
        // Update supplier_details
        audit.supplier_details[index] = supplierDetail;
        
        // Also update supplier_name and address_of_supplier for backward compatibility
        audit.supplier_name[index] = supplierDetail.name;
        audit.address_of_supplier[index] = supplierDetail.address || '';
        
        updatedCount++;
      } else {
        console.log(`No supplier details found for ingredient "${ingredient}"`);
        
        // If we already have supplier details for this index, keep them
        if (!audit.supplier_details[index]) {
          // If we have a supplier name but no details, create a basic supplier detail object
          if (audit.supplier_name && audit.supplier_name[index]) {
            audit.supplier_details[index] = {
              name: audit.supplier_name[index],
              supplier_code: '',
              address: audit.address_of_supplier ? audit.address_of_supplier[index] || '' : '',
              contact_person: '',
              email: '',
              phone: ''
            };
          } else {
            // If we have no supplier information at all, create a placeholder
            audit.supplier_details[index] = {
              name: 'Unknown',
              supplier_code: '',
              address: '',
              contact_person: '',
              email: '',
              phone: ''
            };
            audit.supplier_name[index] = 'Unknown';
          }
        }
      }
    });
    
    return audit;
  });
  
  console.log(`Updated ${updatedCount} ingredient supplier details`);
  
  // Write the updated data back to the database file
  writeDatabase(db);
}

/**
 * Update department manager names in audit records
 */
function updateDepartmentManagers() {
  console.log('Updating department manager names in audit records...');
  
  // Read the database
  const db = readDatabase();
  
  if (!db.audits || !Array.isArray(db.audits)) {
    console.error('No audits found in database');
    return;
  }
  
  console.log(`Found ${db.audits.length} audit records`);
  let updatedCount = 0;
  
  // Process each audit record
  db.audits = db.audits.map(audit => {
    // Skip if department manager is already set
    if (audit.department_manager && audit.department_manager.trim() !== '') {
      return audit;
    }
    
    // Map department codes to manager names
    const managerMap = {
      '1154': 'Monica',  // Bakery
      '1152': 'Clive',   // Butchery
      '1155': 'Monica'   // HMR
    };
    
    // Get the department manager name
    const managerName = managerMap[audit.department];
    if (managerName) {
      console.log(`Setting department manager for audit ${audit.uid} to ${managerName}`);
      audit.department_manager = managerName;
      updatedCount++;
    }
    
    return audit;
  });
  
  console.log(`Updated ${updatedCount} department manager names`);
  
  // Write the updated data back to the database file
  writeDatabase(db);
}

/**
 * Update both supplier details and department manager names in a single operation
 * @param {string} dataSource - Data source to use ('csv' or 'mapping')
 */
function updateAuditRecords(dataSource) {
  console.log(`Updating audit records using ${dataSource} data source...`);
  
  // Load data based on source
  let sourceData = [];
  if (dataSource === 'csv') {
    sourceData = loadAllCSVData();
    console.log(`Loaded ${sourceData.length} total rows from all CSV files`);
  } else if (dataSource === 'mapping') {
    const db = readDatabase();
    sourceData = db.ingredient_supplier_mapping || [];
    console.log(`Found ${sourceData.length} ingredient-supplier mappings`);
  }
  
  if (sourceData.length === 0) {
    console.error(`No data found for source: ${dataSource}`);
    return;
  }
  
  // Read the database
  const db = readDatabase();
  
  if (!db.audits || !Array.isArray(db.audits)) {
    console.error('No audits found in database');
    return;
  }
  
  console.log(`Found ${db.audits.length} audit records`);
  let updatedSupplierCount = 0;
  let updatedManagerCount = 0;
  
  // Process each audit record
  db.audits = db.audits.map(audit => {
    // Skip records without ingredients
    if (!audit.ingredient_list || !audit.ingredient_list.length) {
      return audit;
    }
    
    console.log(`Processing audit ${audit.uid} with ${audit.ingredient_list.length} ingredients for department ${audit.department}`);
    
    // Update department manager if needed
    if (!audit.department_manager || audit.department_manager.trim() === '') {
      const managerName = getDepartmentManager(audit.department);
      if (managerName) {
        console.log(`Setting department manager for audit ${audit.uid} to ${managerName}`);
        audit.department_manager = managerName;
        updatedManagerCount++;
      }
    }
    
    // Create supplier_details array if it doesn't exist
    if (!audit.supplier_details) {
      audit.supplier_details = [];
    }
    
    // Ensure supplier_name and address_of_supplier arrays exist
    if (!audit.supplier_name) audit.supplier_name = [];
    if (!audit.address_of_supplier) audit.address_of_supplier = [];
    
    // For each ingredient, look up supplier details
    audit.ingredient_list.forEach((ingredient, index) => {
      // First try to find supplier in the same department
      let supplierDetail = findSupplierForIngredient(ingredient, audit.department, sourceData, { ignoreDepartment: false });
      
      // If not found, try searching across all departments
      if (!supplierDetail) {
        console.log(`No supplier found for "${ingredient}" in department ${audit.department}, searching all departments...`);
        supplierDetail = findSupplierForIngredient(ingredient, audit.department, sourceData, { ignoreDepartment: true });
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
        audit.supplier_details[index] = completeSupplierDetail;
        
        // Also update supplier_name and address_of_supplier for backward compatibility
        audit.supplier_name[index] = completeSupplierDetail.name;
        audit.address_of_supplier[index] = completeSupplierDetail.address;
        
        updatedSupplierCount++;
      } else {
        console.log(`No supplier details found for ingredient "${ingredient}"`);
        
        // If we already have supplier details for this index, keep them
        if (!audit.supplier_details[index]) {
          // If we have a supplier name but no details, create a basic supplier detail object
          if (audit.supplier_name && audit.supplier_name[index] && audit.supplier_name[index] !== 'Unknown') {
            audit.supplier_details[index] = {
              name: audit.supplier_name[index],
              supplier_code: '',
              address: audit.address_of_supplier ? audit.address_of_supplier[index] || '' : '',
              contact_person: '',
              email: '',
              phone: '',
              product_code: '',
              ean: '',
              description: ingredient,
              pack_size: ''
            };
          } else {
            // If we have no supplier information at all, create a placeholder
            audit.supplier_details[index] = {
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
            audit.supplier_name[index] = 'Unknown';
            audit.address_of_supplier[index] = '';
          }
        }
      }
    });
    
    return audit;
  });
  
  console.log(`Updated ${updatedSupplierCount} ingredient supplier details and ${updatedManagerCount} department manager names`);
  
  // Write the updated data back to the database file
  writeDatabase(db);
  console.log('Database updated successfully');
}

// Main function
function main() {
  try {
    const options = parseArgs();
    
    console.log(`Using data source: ${options.source}`);
    
    if (options.source === 'csv' || options.source === 'mapping') {
      // Use the combined update function
      updateAuditRecords(options.source);
    } else {
      console.error(`Invalid source: ${options.source}. Use 'csv' or 'mapping'.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error updating supplier data:', error);
    process.exit(1);
  }
}

// Run the script
main();
