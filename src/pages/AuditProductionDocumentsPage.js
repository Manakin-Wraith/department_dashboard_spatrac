import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bus } from '../utils/eventBus';
import PageHeader from '../components/PageHeader';
import AuditFilterToolbar from '../components/AuditFilterToolbar';
import AuditTable from '../components/AuditTable';
import AuditPreviewModal from '../components/AuditPreviewModal';
import { fetchAudits } from '../services/api';
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
        console.log('Loading audits for department:', department);
        
        // Fetch audits for the department
        const audits = await fetchAudits(department);
        console.log('Fetched audits:', audits);
        
        // Verify that we received valid audit data
        if (Array.isArray(audits) && audits.length > 0) {
          console.log('Audit data sample:', audits[0]);
          console.log('Supplier details available:', !!audits[0].supplier_details);
        } else {
          console.log('No audit records found for department:', department);
        }
        
        // Set all audits - we're no longer filtering by UIDs from schedules
        // since confirmed productions automatically create valid audits
        setData(audits);
      } catch (err) {
        console.error('Failed to load audits', err);
      }
    }
    load();
  }, [department]);

  useEffect(() => {
    // Listen for new audit records coming from the confirmation process
    const handleNewAudit = rec => {
      console.log('New audit received in AuditProductionDocumentsPage:', rec);
      setData(prev => [rec, ...prev]);
    };
    
    // Listen to both 'audit' and 'new-audit' events
    bus.on('audit', handleNewAudit);
    bus.on('new-audit', handleNewAudit);
    
    return () => {
      bus.off('audit', handleNewAudit);
      bus.off('new-audit', handleNewAudit);
    };
  }, []);

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
