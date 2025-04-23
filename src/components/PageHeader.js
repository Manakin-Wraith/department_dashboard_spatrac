import React from 'react';

const PageHeader = ({ title, breadcrumbs }) => (
  <div className="page-header">
    <h1>{title}</h1>
    {breadcrumbs && <nav>{breadcrumbs}</nav>}
  </div>
);

export default PageHeader;
