/**
 * Script to populate the ingredient-supplier mapping table from CSV files
 * 
 * This script reads the department CSV files and creates a comprehensive
 * mapping between ingredients and their suppliers to ensure a robust
 * chain of custody in the audit system.
 * 
 * Usage: node populate_ingredient_supplier_mapping.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Paths to CSV files
const CSV_PATHS = {
  BAKERY: path.resolve(__dirname, '../../public/DEPT_DATA/Bakery.csv'),
  HMR: path.resolve(__dirname, '../../public/DEPT_DATA/HMR.csv'),
  BUTCHERY: path.resolve(__dirname, '../../public/DEPT_DATA/Butchery.csv')
};

// Path to the mock database
const DB_PATH = path.resolve(__dirname, '../../mock/db.json');

// Function to read a CSV file
function readCsvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

// Function to read the database
function readDatabase() {
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database:', error);
    throw error;
  }
}

// Function to write the database
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

// Main function to populate the ingredient-supplier mapping
function populateIngredientSupplierMapping() {
  console.log('Starting to populate ingredient-supplier mapping...');
  
  // Read CSV files
  console.log('Reading CSV files...');
  const bakeryData = readCsvFile(CSV_PATHS.BAKERY);
  const hmrData = readCsvFile(CSV_PATHS.HMR);
  const butcheryData = readCsvFile(CSV_PATHS.BUTCHERY);
  
  console.log(`Read ${bakeryData.length} records from Bakery.csv`);
  console.log(`Read ${hmrData.length} records from HMR.csv`);
  console.log(`Read ${butcheryData.length} records from Butchery.csv`);
  
  // Combine data with department information
  const allData = [
    ...bakeryData.map(item => ({ ...item, department: 'BAKERY' })),
    ...hmrData.map(item => ({ ...item, department: 'HMR' })),
    ...butcheryData.map(item => ({ ...item, department: 'BUTCHERY' }))
  ];
  
  console.log(`Combined ${allData.length} total records`);
  
  // Create mapping entries
  const mappings = allData.map((item, index) => ({
    id: index + 1,
    supplier_code: item.supplier_code,
    supplier_name: item.supplier_name,
    supplier_product_code: item.supplier_product_code,
    ingredient_code: item['ing.prod_code'],
    ean: item.ean || '',
    product_description: item.product_description,
    pack_size: item.pack_size,
    department: item.department
  }));
  
  console.log(`Created ${mappings.length} mapping entries`);
  
  // Read the database
  console.log('Reading database...');
  const db = readDatabase();
  
  // Update the ingredient-supplier mapping
  db.ingredient_supplier_mapping = mappings;
  
  // Write back to the database
  console.log('Writing updated database...');
  writeDatabase(db);
  
  console.log('Ingredient-supplier mapping populated successfully!');
}

// Run the script
try {
  populateIngredientSupplierMapping();
} catch (error) {
  console.error('Failed to populate ingredient-supplier mapping:', error);
  process.exit(1);
}
