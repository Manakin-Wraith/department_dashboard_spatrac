import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

const DepartmentTabs = () => {
  const { department } = useParams();
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
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DepartmentTabs;
