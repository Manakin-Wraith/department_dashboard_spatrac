/**
 * Service for managing ingredient-supplier relationships
 * This service provides functions to retrieve and manage the relationships
 * between ingredients and their suppliers based on the mapping data.
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

/**
 * Fetch all ingredient-supplier mappings
 * @returns {Promise<Array>} Array of ingredient-supplier mapping objects
 */
export async function fetchIngredientSupplierMappings() {
  try {
    const res = await fetch(`${API_BASE}/api/ingredient-supplier-mapping`);
    if (!res.ok) throw new Error('Failed to fetch ingredient-supplier mappings');
    return res.json();
  } catch (error) {
    console.error('Error fetching ingredient-supplier mappings:', error);
    return [];
  }
}

/**
 * Find supplier details for a specific ingredient
 * @param {string} ingredientCode - The ingredient code to look up
 * @param {string} department - The department code
 * @returns {Promise<Object|null>} Supplier details for the ingredient or null if not found
 */
export async function findSupplierForIngredient(ingredientCode, department) {
  try {
    // Fetch all mappings
    const mappings = await fetchIngredientSupplierMappings();
    
    // Find the mapping for this ingredient in this department
    const mapping = mappings.find(m => 
      m.ingredient_code === ingredientCode && 
      m.department === department
    );
    
    if (!mapping) return null;
    
    // Return the supplier details
    return {
      supplier_code: mapping.supplier_code,
      name: mapping.supplier_name,
      address: '', // This would need to be populated from the suppliers table
      contact_person: '',
      email: '',
      phone: '',
      supplier_product_code: mapping.supplier_product_code,
      ean: mapping.ean,
      pack_size: mapping.pack_size,
      product_description: mapping.product_description
    };
  } catch (error) {
    console.error(`Error finding supplier for ingredient ${ingredientCode}:`, error);
    return null;
  }
}

/**
 * Find supplier details for multiple ingredients
 * @param {Array<string>} ingredientCodes - Array of ingredient codes to look up
 * @param {string} department - The department code
 * @returns {Promise<Array>} Array of supplier details objects, with null for ingredients without suppliers
 */
export async function findSuppliersForIngredients(ingredientCodes, department) {
  try {
    // Fetch all mappings
    const mappings = await fetchIngredientSupplierMappings();
    
    // For each ingredient code, find the corresponding supplier
    return Promise.all(ingredientCodes.map(async (code) => {
      // Find the mapping for this ingredient in this department
      const mapping = mappings.find(m => 
        m.ingredient_code === code && 
        m.department === department
      );
      
      if (!mapping) return null;
      
      // Fetch full supplier details if available
      try {
        const supplierRes = await fetch(`${API_BASE}/api/suppliers/${mapping.supplier_code}`);
        if (supplierRes.ok) {
          const supplierDetails = await supplierRes.json();
          return {
            ...supplierDetails,
            supplier_product_code: mapping.supplier_product_code,
            ean: mapping.ean,
            pack_size: mapping.pack_size,
            product_description: mapping.product_description
          };
        }
      } catch (e) {
        console.warn(`Could not fetch full supplier details for ${mapping.supplier_code}`, e);
      }
      
      // Return basic supplier details from the mapping
      return {
        supplier_code: mapping.supplier_code,
        name: mapping.supplier_name,
        address: '', // This would need to be populated from the suppliers table
        contact_person: '',
        email: '',
        phone: '',
        supplier_product_code: mapping.supplier_product_code,
        ean: mapping.ean,
        pack_size: mapping.pack_size,
        product_description: mapping.product_description
      };
    }));
  } catch (error) {
    console.error(`Error finding suppliers for ingredients:`, error);
    return ingredientCodes.map(() => null);
  }
}

/**
 * Enhance an audit record with supplier details for each ingredient
 * @param {Object} auditRecord - The audit record to enhance
 * @returns {Promise<Object>} Enhanced audit record with supplier details
 */
export async function enhanceAuditWithSupplierDetails(auditRecord) {
  console.log('Enhancing audit record with supplier details:', auditRecord.uid);
  
  if (!auditRecord || !auditRecord.ingredient_list || auditRecord.ingredient_list.length === 0) {
    console.log('No ingredients found in audit record:', auditRecord.uid);
    return auditRecord;
  }
  
  try {
    console.log('Ingredient list:', auditRecord.ingredient_list);
    
    // Extract ingredient information from the audit record
    // This handles both formats: "INGREDIENT NAME (PRODUCT CODE)" and plain ingredient names
    const ingredientInfo = auditRecord.ingredient_list.map(ing => {
      // Try to extract product code from parentheses
      const match = ing.match(/(.+?)\s*\(([^)]+)\)$/);
      
      if (match) {
        // Format: "INGREDIENT NAME (PRODUCT CODE)"
        return {
          name: match[1].trim(),
          code: match[2].trim(),
          fullText: ing
        };
      } else {
        // Format: Just the ingredient name without code
        return {
          name: ing.trim(),
          code: null,
          fullText: ing
        };
      }
    });
    
    console.log('Extracted ingredient info:', ingredientInfo);
    
    // Get the ingredient codes that we can use for lookup
    const ingredientCodes = ingredientInfo
      .map(info => info.code)
      .filter(Boolean);
    
    console.log('Ingredient codes for supplier lookup:', ingredientCodes);
    
    if (ingredientCodes.length === 0) {
      console.log('No valid ingredient codes found for supplier lookup');
      // If we don't have any codes, try to use the supplier names if available
      if (auditRecord.supplier_name && auditRecord.supplier_name.length > 0) {
        console.log('Using existing supplier names:', auditRecord.supplier_name);
        
        // Create basic supplier details from the names
        const basicSupplierDetails = auditRecord.supplier_name.map(name => ({
          name: name || '',
          supplier_code: '',
          address: '',
          contact_person: '',
          email: '',
          phone: ''
        }));
        
        return {
          ...auditRecord,
          supplier_details: basicSupplierDetails
        };
      }
      
      return auditRecord;
    }
    
    // Find suppliers for these ingredients
    console.log('Finding suppliers for ingredients in department:', auditRecord.department);
    const supplierDetails = await findSuppliersForIngredients(
      ingredientCodes, 
      auditRecord.department
    );
    
    console.log('Found supplier details:', supplierDetails);
    
    // Update the audit record with supplier details
    const enhancedAudit = {
      ...auditRecord,
      supplier_details: ingredientInfo.map((info, index) => {
        // Get the corresponding supplier detail if available
        const supplier = supplierDetails[ingredientCodes.indexOf(info.code)];
        
        if (!supplier) {
          // If no supplier found, use existing supplier info if available
          return {
            name: auditRecord.supplier_name && auditRecord.supplier_name[index] ? auditRecord.supplier_name[index] : 'Unknown',
            supplier_code: '',
            address: auditRecord.address_of_supplier && auditRecord.address_of_supplier[index] ? auditRecord.address_of_supplier[index] : 'Unknown',
            contact_person: '',
            email: '',
            phone: ''
          };
        }
        
        return supplier;
      })
    };
    
    console.log('Enhanced audit with supplier details:', enhancedAudit.uid, 'supplier_details count:', enhancedAudit.supplier_details.length);
    return enhancedAudit;
  } catch (error) {
    console.error('Error enhancing audit with supplier details:', error);
    return auditRecord;
  }
}

/**
 * Get a list of all suppliers for a department
 * @param {string} department - The department code
 * @returns {Promise<Array>} Array of unique suppliers for the department
 */
export async function getSuppliersForDepartment(department) {
  try {
    // Fetch all mappings
    const mappings = await fetchIngredientSupplierMappings();
    
    // Filter mappings for this department
    const departmentMappings = mappings.filter(m => m.department === department);
    
    // Extract unique suppliers
    const uniqueSuppliers = Array.from(
      new Map(
        departmentMappings.map(m => [
          m.supplier_code, 
          {
            supplier_code: m.supplier_code,
            name: m.supplier_name
          }
        ])
      ).values()
    );
    
    return uniqueSuppliers;
  } catch (error) {
    console.error(`Error getting suppliers for department ${department}:`, error);
    return [];
  }
}

// Create a named export object to fix the ESLint warning
const ingredientSupplierService = {
  fetchIngredientSupplierMappings,
  findSupplierForIngredient,
  findSuppliersForIngredients,
  enhanceAuditWithSupplierDetails,
  getSuppliersForDepartment
};

export default ingredientSupplierService;
