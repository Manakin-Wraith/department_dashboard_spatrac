import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import departments from '../data/department_table.json';
import { Box, Tabs, Tab, useTheme } from '@mui/material';

const DepartmentTabs = () => {
  const { department } = useParams();
  const location = useLocation();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const color = deptObj.color || theme.palette.primary.main;
  const base = `/production/${department}`;
  const tabs = [
    { label: 'Overview', to: `${base}/overview` },
    { label: 'Schedule', to: `${base}/schedule` },
    { label: 'Audit', to: `${base}/audit` },
    { label: 'Recipes', to: `${base}/recipes` },
    { label: 'Staff', to: `${base}/staff` },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={location.pathname}
        textColor="inherit"
        variant="fullWidth"
        centered
        sx={{
          '& .MuiTab-root': { color: '#000', fontWeight: 600 },
          '& .MuiTabs-indicator': { backgroundColor: color, height: 3 },
        }}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.to}
            component={NavLink}
            to={tab.to}
            value={tab.to}
            label={tab.label}
            sx={{ textTransform: 'none' }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default DepartmentTabs;
