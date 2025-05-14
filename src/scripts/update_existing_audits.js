/**
 * Script to update existing audit records with supplier information
 * 
 * This script reads the ingredient-supplier mapping and updates all existing
 * audit records with the correct supplier information for each ingredient.
 */

const fs = require('fs');
const path = require('path');

// Path to the mock database
const DB_PATH = path.resolve(__dirname, '../../mock/db.json');

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

// Function to extract ingredient code from ingredient description
function extractIngredientCode(ingredientDesc, recipeIngredients) {
  // First, try to find a direct match in the recipe ingredients
  if (recipeIngredients) {
    const matchingIngredient = recipeIngredients.find(ing => 
      ing.description === ingredientDesc
    );
    
    if (matchingIngredient && matchingIngredient.prod_code) {
      return matchingIngredient.prod_code;
    }
  }
  
  // If no direct match, try to extract from parentheses if present
  const match = ingredientDesc.match(/\(([^)]+)\)$/);
  if (match) {
    return match[1];
  }
  
  // Otherwise, just return the ingredient description for fuzzy matching
  return ingredientDesc;
}

// Function to find a supplier for an ingredient in a specific department
function findSupplierForIngredient(ingredientCode, department, mappings) {
  // Try exact match first
  let mapping = mappings.find(m => 
    m.ingredient_code === ingredientCode && 
    (m.department === department || m.department === mapDepartmentCode(department))
  );
  
  // If no exact match, try fuzzy match on product description
  if (!mapping) {
    mapping = mappings.find(m => 
      m.product_description.toUpperCase().includes(ingredientCode.toUpperCase()) && 
      (m.department === department || m.department === mapDepartmentCode(department))
    );
  }
  
  // If still no match, try across all departments
  if (!mapping) {
    mapping = mappings.find(m => m.ingredient_code === ingredientCode);
  }
  
  if (!mapping) {
    return null;
  }
  
  return {
    name: mapping.supplier_name,
    supplier_code: mapping.supplier_code,
    address: '', // We don't have this in the mapping
    contact_person: '',
    email: '',
    phone: '',
    supplier_product_code: mapping.supplier_product_code,
    ean: mapping.ean,
    pack_size: mapping.pack_size,
    product_description: mapping.product_description
  };
}

// Map department codes
function mapDepartmentCode(department) {
  const DEPARTMENT_CODE_MAP = {
    '1154': 'BAKERY',
    '1152': 'BUTCHERY',
    '1155': 'HMR',
    'BAKERY': 'BAKERY',
    'BUTCHERY': 'BUTCHERY',
    'HMR': 'HMR'
  };
  
  return DEPARTMENT_CODE_MAP[department] || department;
}

// Main function to update existing audit records
function updateExistingAudits() {
  console.log('Starting to update existing audit records...');
  
  // Read the database
  console.log('Reading database...');
  const db = readDatabase();
  
  // Get the ingredient-supplier mappings
  const mappings = db.ingredient_supplier_mapping || [];
  if (mappings.length === 0) {
    console.error('No ingredient-supplier mappings found. Run populate_ingredient_supplier_mapping.js first.');
    return;
  }
  
  console.log(`Found ${mappings.length} ingredient-supplier mappings`);
  
  // Get the recipes for ingredient lookup
  const recipes = db.recipes || [];
  console.log(`Found ${recipes.length} recipes`);
  
  // Get the audit records
  const audits = db.audits || [];
  console.log(`Found ${audits.length} audit records`);
  
  if (audits.length === 0) {
    console.log('No audit records to update');
    return;
  }
  
  // Update each audit record
  const updatedAudits = audits.map(audit => {
    // Skip if no ingredients
    if (!audit.ingredient_list || audit.ingredient_list.length === 0) {
      return audit;
    }
    
    // Find the recipe for this audit
    const recipeCode = audit.originalScheduleId ? 
      audit.originalScheduleId.split('-')[2] : null;
    
    const recipe = recipeCode ? 
      recipes.find(r => r.product_code === recipeCode || r.id === recipeCode) : null;
    
    const recipeIngredients = recipe ? recipe.ingredients : null;
    
    // Create supplier_details array if it doesn't exist
    if (!audit.supplier_details) {
      audit.supplier_details = [];
    }
    
    // Update supplier information for each ingredient
    audit.ingredient_list.forEach((ingredient, index) => {
      // Extract ingredient code
      const ingredientCode = extractIngredientCode(ingredient, recipeIngredients);
      
      // Find supplier for this ingredient
      const supplier = findSupplierForIngredient(
        ingredientCode, 
        audit.department, 
        mappings
      );
      
      if (supplier) {
        // Update supplier name
        if (!audit.supplier_name) {
          audit.supplier_name = [];
        }
        audit.supplier_name[index] = supplier.name;
        
        // Update supplier address if empty
        if (!audit.address_of_supplier) {
          audit.address_of_supplier = [];
        }
        if (!audit.address_of_supplier[index] || audit.address_of_supplier[index] === 'Unknown') {
          audit.address_of_supplier[index] = supplier.address || 'See supplier details';
        }
        
        // Update supplier details
        audit.supplier_details[index] = supplier;
      }
    });
    
    return audit;
  });
  
  // Update the database
  db.audits = updatedAudits;
  
  // Write back to the database
  console.log('Writing updated database...');
  writeDatabase(db);
  
  console.log('Audit records updated successfully!');
}

// Run the script
try {
  updateExistingAudits();
} catch (error) {
  console.error('Failed to update audit records:', error);
  process.exit(1);
}
