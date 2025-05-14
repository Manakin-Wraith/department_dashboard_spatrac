import React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button, Typography, Box } from '@mui/material';

const AuditTable = ({ data = [], onView }) => {
  // Add logging to debug the data being received
  console.log('AuditTable received data:', data);
  
  // Check if we have any data to display
  const hasData = Array.isArray(data) && data.length > 0;
  
  return (
    <TableContainer component={Paper} sx={{}}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>UID</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Handler</TableCell>
            <TableCell>Product</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hasData ? (
            data.map((item, index) => {
              // Add logging for each item to debug
              console.log(`Audit item ${index}:`, item);
              
              // Safely get product name from various possible fields
              const productName = item.productDescription || 
                                 item.description || 
                                 (item.product_name && Array.isArray(item.product_name) ? item.product_name[0] : item.product_name) || 
                                 '-';
              
              return (
                <TableRow hover key={item.uid || `audit-${index}`}>
                  <TableCell>{item.uid || `-`}</TableCell>
                  <TableCell>{item.date || '-'}</TableCell>
                  <TableCell>{item.department_manager || '-'}</TableCell>
                  <TableCell>{item.food_handler_responsible || '-'}</TableCell>
                  <TableCell>{productName}</TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => onView(item)}
                      color="primary"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Box sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No audit records found. Create a new production document to generate audit records.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AuditTable;
