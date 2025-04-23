import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import departments from '../data/department_table.json';

const DepartmentTabs = () => {
  const { department } = useParams();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const color = deptObj.color || '#007bff';
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
              ? { borderBottomColor: color, color: color }
              : {}
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DepartmentTabs;
