import { useState, useEffect } from 'react';

/**
 * Hook to load department-specific product->supplier mapping
 * Expects CSV files placed under public/DEPT_DATA/{department}.csv
 * with header: supplier_code,supplier_name,product_code
 */
export default function useDeptProductSupplier(department) {
  const [mapping, setMapping] = useState({});
  useEffect(() => {
    // Return early if department is undefined, null, or not a string
    if (!department || typeof department !== 'string') {
      console.log('[useDeptProductSupplier] Invalid department value:', department);
      return;
    }
    
    // determine exact filename for case-sensitive public assets
    let fileName;
    if (department.length <= 3 && department === department.toUpperCase()) {
      // acronyms like HMR
      fileName = department;
    } else {
      // title-case for multi-word department names
      fileName = department.charAt(0).toUpperCase() + department.slice(1).toLowerCase();
    }
    console.log(`[useDeptProductSupplier] fetching CSV at /DEPT_DATA/${fileName}.csv`);
    fetch(`/DEPT_DATA/${fileName}.csv`)
      .then(res => {
        console.log(`[useDeptProductSupplier] fetch status for '/DEPT_DATA/${fileName}.csv':`, res.status);
        if (!res.ok) {
          throw new Error(`Failed to fetch CSV for department ${department}: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        const lines = text.split('\n').filter(l => l.trim());
        // detect header row if it includes prod_code or product_code
        let headers = null;
        let dataLines = lines;
        const first = lines[0].toLowerCase();
        if (first.includes('prod_code') || first.includes('product_code')) {
          headers = lines[0].split(',').map(h => h.trim());
          dataLines = lines.slice(1);
        }
        const map = {};
        dataLines.forEach(line => {
          const cols = line.split(',');
          // dynamic header indices
          const supplierNameIdx = headers
            ? headers.findIndex(h => h.toLowerCase().includes('supplier_name'))
            : 1;
          const supplierCodeIdx = headers
            ? headers.findIndex(h => h.toLowerCase().includes('supplier_code'))
            : 0;
          // determine prod_code column index: exact 'ing.prod_code', then 'prod_code', then 'product_code', fallback to static col 3
          let codeIdx = headers
            ? (() => {
                let idx = headers.findIndex(h => h.trim().toLowerCase() === 'ing.prod_code');
                if (idx < 0) idx = headers.findIndex(h => h.trim().toLowerCase() === 'prod_code');
                if (idx < 0) idx = headers.findIndex(h => h.trim().toLowerCase() === 'product_code');
                return idx;
              })()
            : 3;
          const supplier_name = cols[supplierNameIdx]?.trim();
          const supplier_code = cols[supplierCodeIdx]?.trim();
          const product_code = cols[codeIdx]?.trim();
          // fallback on description matching
          const descIdx = headers
            ? headers.findIndex(h => h.trim().toLowerCase().includes('description'))
            : cols.length - 2;
          const product_description = cols[descIdx]?.trim();
          if (product_code) map[product_code] = { supplier_code, supplier_name };
          if (product_description) map[product_description] = { supplier_code, supplier_name };
        });
        console.log(`[useDeptProductSupplier] Loaded mapping for department '${department}':`, map);
        setMapping(map);
      })
      .catch(err => console.error('Failed to load dept product supplier mapping', err));
  }, [department]);
  return mapping;
}
