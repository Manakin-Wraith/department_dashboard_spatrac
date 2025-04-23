import React from 'react';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import InfoCard from '../components/InfoCard';
import ProductionForm from '../components/ProductionForm';

const CreateProductionDocumentPage = () => (
  <div className="create-production-page">
    <PageHeader title="Create Production Document" />
    <DepartmentTabs />
    <div className="info-cards-row">
      <InfoCard title="Department" value="" />
      <InfoCard title="Product" value="" />
      <InfoCard title="Batch Codes" value="" />
    </div>
    <div className="form-grid two-column">
      <ProductionForm />
    </div>
  </div>
);

export default CreateProductionDocumentPage;
