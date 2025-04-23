import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import AuditFilterToolbar from '../components/AuditFilterToolbar';
import AuditTable from '../components/AuditTable';
import AuditPreviewModal from '../components/AuditPreviewModal';
import { fetchAudits } from '../services/api';

const AuditProductionDocumentsPage = () => {
  const { department } = useParams();
  const [data, setData] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const audits = await fetchAudits(department);
        setData(audits);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [department]);

  const handleOpenPreview = () => setPreviewItem({ uid: 'All Records', items: data });
  const handleOpenExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleView = item => setPreviewItem(item);
  const handleClosePreview = () => setPreviewItem(null);

  return (
    <div>
      <PageHeader title="Audit Production Documents" />
      <DepartmentTabs />
      <AuditFilterToolbar onOpenPreview={handleOpenPreview} onOpenExport={handleOpenExport} />
      <AuditTable data={data} onView={handleView} />
      <AuditPreviewModal item={previewItem} onClose={handleClosePreview} />
    </div>
  );
};

export default AuditProductionDocumentsPage;
