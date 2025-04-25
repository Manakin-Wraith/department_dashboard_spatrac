import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import InfoCard from '../components/InfoCard';
import { Box, Avatar, Typography, Button } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchSchedules, fetchAudits } from '../services/api';
import departments from '../data/department_table.json';

// Map JSON icon key to component
const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const CreateProductionDocumentPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  // Keep full-department color for accents
  const accentColor = deptObj.color;
  const [schedules, setSchedules] = useState([]);
  const [audits, setAudits] = useState([]);
  useEffect(() => {
    async function loadData() {
      const [sch, aud] = await Promise.all([
        fetchSchedules(department),
        fetchAudits(department)
      ]);
      setSchedules(sch);
      setAudits(aud);
    }
    loadData();
  }, [department]);
  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button component={Link} to='/' startIcon={<ArrowBackIcon />} sx={{ color: accentColor, textTransform: 'none' }}>
            Back to Dashboard
          </Button>
        </Box>
        <PageHeader title="Department Overview" />
        <DepartmentTabs />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 2 }}>
        </Box>
        <Box className="info-cards-row">
          <InfoCard
            title="Department"
            value={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: accentColor, color: theme.palette.getContrastText(accentColor), width: 24, height: 24 }}>
                  {(() => {
                    const IconComponent = iconMap[deptObj.icon];
                    return IconComponent ? <IconComponent fontSize="small" /> : deptObj.department.charAt(0);
                  })()}
                </Avatar>
                <Typography variant="body2" sx={{ ml: 1 }}>{deptObj.department}</Typography>
              </Box>
            }
          />
          <InfoCard title="Scheduled Recipes" value={schedules.length} />
          <InfoCard title="Audits" value={audits.length} />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateProductionDocumentPage;
