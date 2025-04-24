import React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button } from '@mui/material';

const AuditTable = ({ data = [], onView }) => (
  <TableContainer component={Paper} sx={{}}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>UID</TableCell>
          <TableCell>Date</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => (
          <TableRow hover key={item.uid}>
            <TableCell>{item.uid}</TableCell>
            <TableCell>{item.date || '-'}</TableCell>
            <TableCell align="right">
              <Button variant="text" size="small" onClick={() => onView(item)}>View</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default AuditTable;
