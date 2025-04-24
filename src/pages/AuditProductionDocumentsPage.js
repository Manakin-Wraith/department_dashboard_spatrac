import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import AuditFilterToolbar from '../components/AuditFilterToolbar';
import AuditTable from '../components/AuditTable';
import AuditPreviewModal from '../components/AuditPreviewModal';
import { fetchAudits } from '../services/api';
import departments from '../data/department_table.json';
import { Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const AuditProductionDocumentsPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
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
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <PageHeader title="Audit Production Documents" />
        <DepartmentTabs />
        <Box sx={{ mt: 4 }}>
          <AuditFilterToolbar onOpenPreview={handleOpenPreview} onOpenExport={handleOpenExport} />
        </Box>
        <Box sx={{ mt: 3 }}>
          <AuditTable data={data} onView={handleView} />
        </Box>
        <AuditPreviewModal item={previewItem} onClose={handleClosePreview} />
      </Box>
    </Box>
  );
};

export default AuditProductionDocumentsPage;
