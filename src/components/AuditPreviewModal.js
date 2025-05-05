import React, { useRef } from 'react';
import { GridLegacy as Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, CardHeader, CardContent, Typography, Chip, Stack } from '@mui/material';

const AuditPreviewModal = ({ item, onClose }) => {
  const previewRef = useRef(null);

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
    country_of_origin = []
  } = item || {};

  const handleExportCsv = () => {
    if (!item) return;
    // recipe name heading
    const recipeName = product_name.join(', ');
    // CSV structure: heading, blank line, headers, data rows
    const headers = ['UID','Department','Department Manager','Scheduled Date','Food Handler','Ingredient','Ingredient Quantity','Supplier Name','Supplier Address','Batch Code','Sell-by Date','Receiving Date','Country of Origin','Planned Quantity'];
    const rows = ingredient_list.map((ing, idx) => {
      // Extract name and quantity (e.g., 'FROZEN MDM (25kg)' => name: 'FROZEN MDM', qty: '25kg')
      const match = ing.match(/^(.*)\s*\(([^)]+)\)$/);
      const name = match ? match[1] : ing;
      const qty = match ? match[2] : '';
      return [
        uid, department, department_manager, date || '', food_handler_responsible, name, qty, supplier_name[idx]||'', address_of_supplier[idx]||'', batch_code[idx]||'', sell_by_date[idx]||'', receiving_date[idx]||'', country_of_origin[idx]||'', planned_qty !== undefined && planned_qty !== null ? planned_qty : '-'
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
    link.setAttribute('download', `audit_${uid}.csv`);
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
                    {ingredient_list.map((ing, idx) => (
                      <Card variant="outlined" key={idx}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{ing}</Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" fontWeight="bold">Supplier Name</Typography>
                              <Typography variant="body2">{supplier_name[idx]}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" fontWeight="bold">Supplier Address</Typography>
                              <Typography variant="body2">{address_of_supplier[idx]}</Typography>
                            </Grid>
                            <Grid item xs={4} sm={3}>
                              <Typography variant="subtitle2" fontWeight="bold">Batch Code</Typography>
                              <Typography variant="body2">{batch_code[idx]}</Typography>
                            </Grid>
                            <Grid item xs={4} sm={3}>
                              <Typography variant="subtitle2" fontWeight="bold">Sell-by Date</Typography>
                              <Typography variant="body2">{sell_by_date[idx]}</Typography>
                            </Grid>
                            <Grid item xs={4} sm={3}>
                              <Typography variant="subtitle2" fontWeight="bold">Receiving Date</Typography>
                              <Typography variant="body2">{receiving_date[idx]}</Typography>
                            </Grid>
                            <Grid item xs={4} sm={3}>
                              <Typography variant="subtitle2" fontWeight="bold">Country of Origin</Typography>
                              <Typography variant="body2">{country_of_origin[idx]}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
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
