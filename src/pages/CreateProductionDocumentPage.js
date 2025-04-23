import React from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import InfoCard from '../components/InfoCard';
import ProductionForm from '../components/ProductionForm';
import departments from '../data/department_table.json';
import { Box, Avatar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';

// Map JSON icon key to component
const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const CreateProductionDocumentPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const bgColor = deptObj.color || 'transparent';
  const contrastText = theme.palette.getContrastText(bgColor);
  return (
    <div className="create-production-page" style={{ backgroundColor: bgColor, color: contrastText }}>
      <PageHeader title="Create Production Document" />
      <DepartmentTabs />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: deptObj.color, color: theme.palette.getContrastText(deptObj.color) }} aria-label={deptObj.department}>
          {(() => {
            const IconComponent = iconMap[deptObj.icon];
            return IconComponent ? <IconComponent /> : deptObj.department.charAt(0);
          })()}
        </Avatar>
        <Typography variant="h6" sx={{ color: theme.palette.getContrastText(bgColor), fontWeight: 'bold', ml: 1 }}>
          {deptObj.department}
        </Typography>
      </Box>
      <div className="info-cards-row">
        <InfoCard title="Department" value="" />
        <InfoCard title="Product" value="" />
        <InfoCard title="Batch Codes" value="" />
      </div>
      <div className="form-grid two-column">
        <ProductionForm deptColor={bgColor} />
      </div>
    </div>
  );
};

export default CreateProductionDocumentPage;
