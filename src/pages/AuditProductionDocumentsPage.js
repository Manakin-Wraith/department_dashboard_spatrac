import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import AuditFilterToolbar from '../components/AuditFilterToolbar';
import AuditTable from '../components/AuditTable';
import AuditPreviewModal from '../components/AuditPreviewModal';
import { fetchAudits, fetchSchedules, deleteAudit } from '../services/api';
import departments from '../data/department_table.json';
import { Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme, alpha } from '@mui/material/styles';

const AuditProductionDocumentsPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const accentColor = deptObj.color;
  const [data, setData] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // fetch both schedules and audits
        const [schedules, audits] = await Promise.all([
          fetchSchedules(department),
          fetchAudits(department)
        ]);
        // build valid UIDs from schedules
        const validUids = schedules.flatMap(s =>
          s.items.map((item, idx) => `${s.weekStartDate}-${item.recipeCode}-${idx}`)
        );
        // delete stale audits
        const stale = audits.filter(a => !validUids.includes(a.uid));
        await Promise.all(stale.map(a => deleteAudit(a.id)));
        // set only valid audits
        const filtered = audits.filter(a => validUids.includes(a.uid));
        setData(filtered);
      } catch (err) {
        console.error('Failed to load audits', err);
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
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button component={Link} to='/' startIcon={<ArrowBackIcon />} sx={{ color: accentColor, textTransform: 'none' }}>
            Back to Dashboard
          </Button>
        </Box>
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
