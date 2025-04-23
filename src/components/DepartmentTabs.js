import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import departments from '../data/department_table.json';
import { useTheme } from '@mui/material/styles';

const DepartmentTabs = () => {
  const { department } = useParams();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const color = deptObj.color || '#007bff';
  const theme = useTheme();
  const contrastText = theme.palette.getContrastText(color);
  const base = `/production/${department}`;
  const tabs = [
    { label: 'Create', to: `${base}/create` },
    { label: 'Audit', to: `${base}/audit` },
    { label: 'Recipes', to: `${base}/recipes` },
  ];

  return (
    <nav className="department-tabs">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
          style={({ isActive }) =>
            isActive
              ? { borderBottom: `2px solid ${contrastText}`, color: contrastText }
              : { color: contrastText }
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DepartmentTabs;
