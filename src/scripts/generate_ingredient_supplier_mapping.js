/**
 * Script to generate ingredient-supplier mapping from department CSV files
 * This script parses the CSV files in the DEPT_DATA directory and creates a mapping
 * between ingredients and their suppliers to maintain data integrity.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Paths to CSV files
const CSV_FILES = {
  BAKERY: '../public/DEPT_DATA/Bakery.csv',
  HMR: '../public/DEPT_DATA/HMR.csv',
  BUTCHERY: '../public/DEPT_DATA/Butchery.csv'
};

// Path to the mock database
const DB_PATH = '../mock/db.json';

// Function to read a CSV file and return its contents as an array of objects
function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to read the mock database
function readDatabase() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, DB_PATH), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const db = JSON.parse(data);
        resolve(db);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Function to write the updated database back to the file
function writeDatabase(db) {
  return new Promise((resolve, reject) => {
    const dbJson = JSON.stringify(db, null, 2);
    fs.writeFile(path.resolve(__dirname, DB_PATH), dbJson, 'utf8', (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// Main function to generate the ingredient-supplier mapping
async function generateIngredientSupplierMapping() {
  try {
    console.log('Reading CSV files...');
    
    // Read all CSV files
    const bakeryData = await readCsvFile(CSV_FILES.BAKERY);
    const hmrData = await readCsvFile(CSV_FILES.HMR);
    const butcheryData = await readCsvFile(CSV_FILES.BUTCHERY);
    
    console.log(`Read ${bakeryData.length} rows from Bakery.csv`);
    console.log(`Read ${hmrData.length} rows from HMR.csv`);
    console.log(`Read ${butcheryData.length} rows from Butchery.csv`);
    
    // Combine all data
    const allData = [
      ...bakeryData.map(item => ({ ...item, department: 'BAKERY' })),
      ...hmrData.map(item => ({ ...item, department: 'HMR' })),
      ...butcheryData.map(item => ({ ...item, department: 'BUTCHERY' }))
    ];
    
    console.log(`Combined ${allData.length} total rows from all CSV files`);
    
    // Create the mapping
    const mapping = allData.map((item, index) => ({
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
    
    console.log(`Created ${mapping.length} ingredient-supplier mappings`);
    
    // Read the database
    const db = await readDatabase();
    
    // Update the ingredient-supplier mapping
    db.ingredient_supplier_mapping = mapping;
    
    // Write the updated database back to the file
    await writeDatabase(db);
    
    console.log('Successfully updated the ingredient-supplier mapping in the database');
  } catch (error) {
    console.error('Error generating ingredient-supplier mapping:', error);
  }
}

// Execute the main function
generateIngredientSupplierMapping();
