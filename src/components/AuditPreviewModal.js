import React, { useRef } from 'react';
import { GridLegacy as Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, CardHeader, CardContent, Typography, Chip, Stack, Divider, Box, Link } from '@mui/material';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CodeIcon from '@mui/icons-material/Code';

const AuditPreviewModal = ({ item, onClose }) => {
  const previewRef = useRef(null);
  
  // Log the item data for debugging
  React.useEffect(() => {
    if (item) {
      console.log('AuditPreviewModal received item:', item);
      console.log('Supplier details available:', !!item.supplier_details);
      
      // Check if supplier_details exists and is an array
      if (item.supplier_details && Array.isArray(item.supplier_details)) {
        console.log('Number of supplier details:', item.supplier_details.length);
        console.log('First supplier detail:', item.supplier_details[0]);
      } else if (item.supplier_name && Array.isArray(item.supplier_name)) {
        // If no supplier_details but we have supplier_name, log that
        console.log('No supplier_details array, but supplier_name is available:', item.supplier_name);
        console.log('Will create basic supplier details from supplier_name');
      }
      
      // Log ingredient list if available
      if (item.ingredient_list && Array.isArray(item.ingredient_list)) {
        console.log('Ingredient list available, count:', item.ingredient_list.length);
        console.log('First ingredient:', item.ingredient_list[0]);
      }
    }
  }, [item]);
  
  // Create supplier_details if it doesn't exist but supplier_name does
  React.useEffect(() => {
    if (item && !item.supplier_details && item.supplier_name && Array.isArray(item.supplier_name)) {
      console.log('Creating supplier_details from supplier_name');
      item.supplier_details = item.supplier_name.map(name => ({
        name: name || 'Unknown',
        supplier_code: '',
        address: '',
        contact_person: '',
        email: '',
        phone: ''
      }));
    }
  }, [item]);

  const {
    date,
    uid,
    department,
    department_manager,
    food_handler_responsible,
    planned_qty,
    packing_batch_code = [],
    product_name = [],
    ingredient_list = [],
    supplier_name = [],
    address_of_supplier = [],
    batch_code = [],
    sell_by_date = [],
    receiving_date = [],
    country_of_origin = [],
    supplier_details = []
  } = item || {};

  const handleExportCsv = () => {
    if (!item) return;
    console.log('Exporting CSV for audit:', item);
    
    // Recipe name heading
    const recipeName = product_name.join(', ');
    
    // CSV structure: heading, blank line, headers, data rows
    const headers = [
      'UID',
      'Department',
      'Department Manager',
      'Scheduled Date',
      'Food Handler',
      'Ingredient',
      'Ingredient Quantity',
      'Supplier Name',
      'Supplier Code',
      'Supplier Address',
      'Supplier Contact Person',
      'Supplier Email',
      'Supplier Phone',
      'Batch Code',
      'Sell-by Date',
      'Receiving Date',
      'Country of Origin',
      'Planned Quantity',
      'Actual Quantity'
    ];
    
    // Get department name from department code if needed
    const getDepartmentName = (deptCode) => {
      // Map of department codes to names
      const deptMap = {
        '1154': 'BAKERY',
        '1152': 'BUTCHERY',
        '1155': 'HMR'
      };
      return deptMap[deptCode] || deptCode;
    };
    
    // Get department manager name - always use the specific name
    const getDepartmentManager = () => {
      // If department_manager is already set, use it
      if (department_manager && department_manager.trim() !== '') {
        return department_manager;
      }
      
      // Otherwise, use the specific department manager name based on department
      const deptName = getDepartmentName(department);
      
      // Map of specific department manager names
      const managerMap = {
        // Use actual manager names from the database
        'BAKERY': 'Monica',  // Monica is the Bakery department manager
        'BUTCHERY': 'John',  // Specific butchery manager name
        'HMR': 'Sarah',      // Specific HMR manager name
        '1154': 'Monica',    // Monica is the Bakery department manager (numeric code)
        '1152': 'John',      // Butchery manager (numeric code)
        '1155': 'Sarah'      // HMR manager (numeric code)
      };
      
      return managerMap[deptName] || 'Monica'; // Default to Monica if department not found
    };
    
    // Calculate ingredient quantity based on planned quantity
    const calculateIngredientQuantity = (baseQty, idx) => {
      // If we already have a quantity extracted from the ingredient name, use it
      const match = ingredient_list[idx].match(/^(.*?)\s*\(([^)]+)\)$/);
      if (match && match[2]) {
        const extractedQty = match[2];
        
        // If planned_qty is available, try to scale the quantity
        if (planned_qty !== undefined && planned_qty !== null) {
          // Try to extract numeric value from the quantity string
          const qtyMatch = extractedQty.match(/(\d+(\.\d+)?)/); 
          if (qtyMatch) {
            const baseAmount = parseFloat(qtyMatch[1]);
            const scaledAmount = (baseAmount * planned_qty).toFixed(2);
            // Return both the scaled and base quantities
            return `${scaledAmount} (base: ${extractedQty})`;
          }
        }
        return extractedQty;
      }
      
      // If no quantity in the ingredient name, but planned_qty is available
      if (planned_qty !== undefined && planned_qty !== null) {
        return `Scaled for ${planned_qty} units`;
      }
      
      return '';
    };
    
    const rows = ingredient_list.map((ing, idx) => {
      // Extract name and quantity (e.g., 'FROZEN MDM (25kg)' => name: 'FROZEN MDM', qty: '25kg')
      const match = ing.match(/^(.*?)\s*\(([^)]+)\)$/);
      const name = match ? match[1] : ing;
      
      // Calculate ingredient quantity based on planned production quantity
      const qty = calculateIngredientQuantity(match ? match[2] : '', idx);
      
      // Get supplier details if available
      const supplierDetail = supplier_details[idx] || {};
      
      // Ensure supplier information is properly populated
      // 1. Supplier Name
      const supplierName = supplierDetail.name || supplier_name[idx] || 'Not Specified';
      
      // 2. Supplier Code - Try multiple sources to find it
      const supplierCode = supplierDetail.supplier_code || 
                          (supplierDetail.name && supplierDetail.name.includes('(') ? 
                            supplierDetail.name.match(/\((\d+)\)/)?.[1] : '') || 
                          (supplier_name[idx] && supplier_name[idx].includes('(') ?
                            supplier_name[idx].match(/\((\d+)\)/)?.[1] : '') ||
                          '';
      
      // 3. Supplier Address
      const supplierAddress = supplierDetail.address || address_of_supplier[idx] || 'Not Specified';
      
      console.log(`Supplier info for ${name}: Name=${supplierName}, Code=${supplierCode}, Address=${supplierAddress}`);
      
      // Get department manager name
      const managerName = getDepartmentManager();
      
      return [
        uid, 
        getDepartmentName(department), 
        managerName, 
        date || '', 
        food_handler_responsible || 'Not Specified', 
        name, 
        qty, 
        supplierName, 
        supplierCode, 
        supplierAddress, 
        supplierDetail.contact_person || '', 
        supplierDetail.email || '', 
        supplierDetail.phone || '', 
        batch_code[idx] || '', 
        sell_by_date[idx] || '', 
        receiving_date[idx] || '', 
        country_of_origin[idx] || '', 
        planned_qty !== undefined && planned_qty !== null ? planned_qty : '-',
        item.actual_qty !== undefined && item.actual_qty !== null ? item.actual_qty : '-'
      ];
    });
    
    const csvArray = [
      [`Recipe: ${recipeName}`],
      [],
      headers,
      ...rows
    ];
    
    const csvContent = csvArray
      .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_${uid}_with_suppliers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  
  return (
    <Dialog open={Boolean(item)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Recipe Audit Form Preview{item ? ` - ${item.uid}` : ''}</DialogTitle>
      <DialogContent dividers>
        {item && (
          <div ref={previewRef}>
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" fontWeight="bold">UID</Typography>
                      <Typography variant="body2">{uid}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" fontWeight="bold">Department</Typography>
                      <Typography variant="body2">{department}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" fontWeight="bold">Department Manager</Typography>
                      <Typography variant="body2">{department_manager}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" fontWeight="bold">Scheduled Date</Typography>
                      <Typography variant="body2">{date || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" fontWeight="bold">Product Name</Typography>
                      <Typography variant="body2">{product_name.join(', ')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Planned Quantity: {planned_qty !== undefined && planned_qty !== null ? planned_qty : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold">Food Handler Responsible</Typography>
                      <Typography variant="body2">{food_handler_responsible}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Packaging & Product" />
                <CardContent>
                  <Typography variant="subtitle2" fontWeight="bold">Packaging Batch Codes</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                    {packing_batch_code.map(code => <Chip key={code} label={code} size="small" />)}
                  </Stack>
                  <Typography variant="subtitle2" fontWeight="bold">Product Names</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {product_name.map(prod => <Chip key={prod} label={prod} size="small" />)}
                  </Stack>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Ingredients" />
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Chip label={`Planned Quantity: ${planned_qty !== undefined && planned_qty !== null ? planned_qty : '-'}`} color="info" />
                  </Stack>
                  <Stack spacing={2}>
                    {ingredient_list.map((ing, idx) => {
                      // Get supplier details if available
                      const supplierDetail = supplier_details[idx] || {};
                      const hasDetailedSupplierInfo = supplierDetail && Object.keys(supplierDetail).length > 0;
                      
                      // Extract name and quantity (e.g., 'FROZEN MDM (25kg)' => name: 'FROZEN MDM', qty: '25kg')
                      const match = ing.match(/^(.*?)\s*\(([^)]+)\)$/);
                      const name = match ? match[1] : ing;
                      const qty = match ? match[2] : '';
                      
                      return (
                        <Card variant="outlined" key={idx}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {name}
                              {qty && <Typography component="span" variant="subtitle1" color="text.secondary"> ({qty})</Typography>}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              {/* Ingredient Tracking Information */}
                              <Grid item xs={12}>
                                <Card variant="outlined" sx={{ mb: 2, backgroundColor: '#f9f9f9' }}>
                                  <CardHeader 
                                    title="Ingredient Tracking" 
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                    sx={{ pb: 0 }}
                                  />
                                  <CardContent>
                                    <Grid container spacing={1}>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="subtitle2" fontWeight="bold">Batch Code</Typography>
                                        <Typography variant="body2">{batch_code[idx] || '-'}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="subtitle2" fontWeight="bold">Sell-by Date</Typography>
                                        <Typography variant="body2">{sell_by_date[idx] || '-'}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="subtitle2" fontWeight="bold">Receiving Date</Typography>
                                        <Typography variant="body2">{receiving_date[idx] || '-'}</Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="subtitle2" fontWeight="bold">Country of Origin</Typography>
                                        <Typography variant="body2">{country_of_origin[idx] || '-'}</Typography>
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Grid>
                              
                              {/* Supplier Information */}
                              <Grid item xs={12}>
                                <Card variant="outlined" sx={{ backgroundColor: '#f5f5f5' }}>
                                  <CardHeader 
                                    title="Supplier Information" 
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                    sx={{ pb: 0 }}
                                  />
                                  <CardContent>
                                    {hasDetailedSupplierInfo ? (
                                      <Grid container spacing={1}>
                                        <Grid item xs={12} sm={6}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Company</Typography>
                                          </Box>
                                          <Typography variant="body2">{supplierDetail.name || '-'}</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CodeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Supplier Code</Typography>
                                          </Box>
                                          <Chip 
                                            label={supplierDetail.supplier_code || 'No Code'} 
                                            size="small" 
                                            color={supplierDetail.supplier_code ? 'primary' : 'default'}
                                            variant={supplierDetail.supplier_code ? 'filled' : 'outlined'}
                                          />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                          <Divider sx={{ my: 1 }} />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Address</Typography>
                                          </Box>
                                          <Typography variant="body2">{supplierDetail.address || address_of_supplier[idx] || '-'}</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                          <Divider sx={{ my: 1 }} />
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={4}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Contact Person</Typography>
                                          </Box>
                                          <Typography variant="body2">{supplierDetail.contact_person || '-'}</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={4}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
                                          </Box>
                                          {supplierDetail.email ? (
                                            <Link href={`mailto:${supplierDetail.email}`} underline="hover">
                                              {supplierDetail.email}
                                            </Link>
                                          ) : (
                                            <Typography variant="body2">-</Typography>
                                          )}
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={4}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocalPhoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Phone</Typography>
                                          </Box>
                                          {supplierDetail.phone ? (
                                            <Link href={`tel:${supplierDetail.phone}`} underline="hover">
                                              {supplierDetail.phone}
                                            </Link>
                                          ) : (
                                            <Typography variant="body2">-</Typography>
                                          )}
                                        </Grid>
                                      </Grid>
                                    ) : (
                                      <Grid container spacing={1}>
                                        <Grid item xs={12} sm={6}>
                                          <Typography variant="subtitle2" fontWeight="bold">Supplier Name</Typography>
                                          <Typography variant="body2">{supplier_name[idx] || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                          <Typography variant="subtitle2" fontWeight="bold">Supplier Address</Typography>
                                          <Typography variant="body2">{address_of_supplier[idx] || '-'}</Typography>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleExportCsv}>Export CSV</Button>
        <Button variant="outlined" onClick={() => window.print()}>Print</Button>
        <Button variant="contained" onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditPreviewModal;
