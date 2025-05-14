/**
 * Script to convert completed production items to audit records
 * 
 * This script finds all completed production items in the schedules collection
 * and converts them to audit records in the audits collection.
 */

const fs = require('fs');
const path = require('path');
const { normalizeDepartmentCode } = require('../utils/supplierIngredientUtils');

// Path to the database file
const DB_PATH = path.join(__dirname, '../../mock/db.json');

// Load the database
console.log('Loading database...');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// Track statistics
let completedItemsFound = 0;
let auditRecordsCreated = 0;

// Function to create audit data from a production item
function createAuditData(item, recipe, department) {
  const { 
    recipeCode, plannedQty, handlerName, date, actualQty, 
    qualityScore, notes, deviations, batchCodes, sellByDates, 
    receivingDates, managerName, status, id: productionId,
    productDescription
  } = item;
  
  // Get ingredient information from the recipe
  const ingredientList = recipe?.ingredients?.map(ing => ing.description) || [];
  
  // Create supplier details arrays
  const supplierDetails = [];
  const supplierNames = [];
  const addressOfSupplier = [];
  const countryOfOrigin = [];
  
  // Process ingredients and supplier details
  if (recipe?.ingredients && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach(ing => {
      // Add supplier details
      const supplierDetail = {
        name: ing.supplier_name || 'Unknown',
        supplier_code: ing.supplier_code || '',
        address: ing.supplier_address || '',
        contact_person: '',
        email: '',
        phone: '',
        product_code: ing.supplier_product_code || ing.prod_code || '',
        ean: ing.ean || '',
        description: ing.description || '',
        pack_size: ing.pack_size || ''
      };
      
      supplierDetails.push(supplierDetail);
      supplierNames.push(supplierDetail.name);
      addressOfSupplier.push(supplierDetail.address);
      countryOfOrigin.push(ing.country_of_origin || 'Unknown');
    });
  }
  
  // Process batch codes, sell-by dates, and receiving dates
  const finalBatchCodes = [];
  const finalSellByDates = [];
  const finalReceivingDates = [];
  
  if (ingredientList.length > 0) {
    ingredientList.forEach((_, idx) => {
      // Use batch codes if available, or generate new ones
      const batchCode = batchCodes && batchCodes[idx] ? 
        batchCodes[idx] : 
        `BC-${Date.now()}-${idx}`;
      finalBatchCodes.push(batchCode);
      
      // Use sell-by dates if available, or generate new ones
      const sellByDate = sellByDates && sellByDates[idx] ? 
        sellByDates[idx] : 
        (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date.toISOString().split('T')[0];
        })();
      finalSellByDates.push(sellByDate);
      
      // Use receiving dates if available, or use today
      const receivingDate = receivingDates && receivingDates[idx] ? 
        receivingDates[idx] : 
        new Date().toISOString().split('T')[0];
      finalReceivingDates.push(receivingDate);
    });
  }
  
  // Map department codes to manager names
  const managerMap = {
    '1154': 'Monica',  // Bakery
    1154: 'Monica',
    'BAKERY': 'Monica',
    '1152': 'Clive',   // Butchery
    1152: 'Clive',
    'BUTCHERY': 'Clive',
    '1155': 'Monica',  // HMR
    1155: 'Monica',
    'HMR': 'Monica'
  };
  
  // Create the audit data object
  const auditData = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    uid: `${date}-${recipeCode}-${Date.now()}`,
    department: department,
    department_manager: managerName || managerMap[department] || '',
    food_handler_responsible: handlerName,
    packing_batch_code: ['test'], // Placeholder
    product_name: [productDescription || recipe?.description || 'Unknown'],
    ingredient_list: ingredientList,
    supplier_details: supplierDetails,
    supplier_name: supplierNames,
    address_of_supplier: addressOfSupplier,
    batch_code: finalBatchCodes,
    sell_by_date: finalSellByDates,
    receiving_date: finalReceivingDates,
    country_of_origin: countryOfOrigin,
    planned_qty: Number(plannedQty) || 0,
    actual_qty: Number(actualQty) || Number(plannedQty) || 0,
    notes: notes || '',
    quality_score: Number(qualityScore) || 1,
    deviations: deviations || ['none'],
    confirmation_timestamp: new Date().toISOString(),
    date: date,
    status: status,
    originalScheduleId: productionId,
  };
  
  return auditData;
}

// Find all recipes
console.log('Finding recipes...');
const recipes = {};
db.recipes.forEach(recipe => {
  recipes[recipe.product_code] = recipe;
});
console.log(`Found ${Object.keys(recipes).length} recipes`);

// Process each schedule
console.log('Processing schedules...');
db.schedules.forEach(schedule => {
  // Handle both nested and flat schedule structures
  const scheduleData = schedule["0"] || schedule;
  const department = scheduleData.department;
  
  // Skip if no items
  if (!scheduleData.items || !Array.isArray(scheduleData.items)) {
    return;
  }
  
  // Find completed items
  const completedItems = scheduleData.items.filter(item => item.status === 'completed');
  completedItemsFound += completedItems.length;
  
  // Convert completed items to audit records
  completedItems.forEach(item => {
    const recipe = recipes[item.recipeCode];
    if (!recipe) {
      console.warn(`Recipe not found for completed item: ${item.recipeCode}`);
      return;
    }
    
    const auditData = createAuditData(item, recipe, department);
    db.audits.push(auditData);
    auditRecordsCreated++;
  });
});

// Save the updated database
console.log('Saving updated database...');
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log(`
Conversion complete:
- Found ${completedItemsFound} completed production items
- Created ${auditRecordsCreated} audit records
`);
