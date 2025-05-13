import { useMutation } from '@tanstack/react-query';
import { saveAudit, deleteAudit, fetchAudits } from '../services/api';

/**
 * Prepare audit entries for production schedule items
 * @param {Array} items - Scheduled items
 * @param {Object} context - { date, department, managerName, handlerName, supplierTable }
 * @returns {Array} Array of audit payloads
 */
export function prepareAuditEntries(items, { date, department, managerName, handlerName, supplierTable }) {
  return items.map((item, idx) => {
    const uid = `${date}-${item.recipeCode}-${idx}`;
    return {
      uid,
      department,
      date,
      department_manager: managerName,
      food_handler_responsible: handlerName,
      planned_qty: item.plannedQty,
      packing_batch_code: [], // to be populated
      product_name: [item.productDescription || item.recipeCode],
      ingredient_list: (item.ingredients || []).map(ing => ing.description),
      supplier_name: item.ingredientSuppliers || [],
      address_of_supplier: [],
      batch_code: [],
      sell_by_date: [],
      receiving_date: [],
      country_of_origin: []
    };
  });
}

/**
 * Hook to save multiple audit records
 */
export function useSaveAuditRecords() {
  return useMutation(
    async ({ department, records }) => {
      await Promise.all(records.map(rec => saveAudit(department, rec)));
    }
  );
}

/**
 * Hook to delete audit records by filter function
 */
export function useDeleteAuditRecords() {
  return useMutation(
    async ({ department, filterFn }) => {
      const all = await fetchAudits(department);
      const toDelete = all.filter(filterFn);
      await Promise.all(toDelete.map(a => deleteAudit(a.id)));
    }
  );
}
