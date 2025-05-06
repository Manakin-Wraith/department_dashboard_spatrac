import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import InfoCard from '../components/InfoCard';
import { Box, Avatar, Grid, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import PeopleIcon from '@mui/icons-material/People';     
import { fetchSchedules, fetchAudits, fetchRecipes, fetchHandlers } from '../services/api'; 
import departments from '../data/department_table.json';

// Map JSON icon key to component
const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const CreateProductionDocumentPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};

  const accentColor = deptObj.color || theme.palette.primary.main; 
  const departmentDisplayName = deptObj.department || 'Department';
  const IconComponent = iconMap[deptObj.icon]; 

  const [schedules, setSchedules] = useState([]);
  const [audits, setAudits] = useState([]);
  const [departmentRecipesCount, setDepartmentRecipesCount] = useState(0); 
  const [departmentStaffCount, setDepartmentStaffCount] = useState(0);     

  useEffect(() => {
    async function loadData() {
      try {
        const [sch, aud, recipesData, staffData] = await Promise.all([
          fetchSchedules(department),
          fetchAudits(department),
          fetchRecipes(department),      
          fetchHandlers(department)      
        ]);
        setSchedules(sch || []);
        setAudits(aud || []);
        setDepartmentRecipesCount(recipesData ? recipesData.length : 0); 
        setDepartmentStaffCount(staffData ? staffData.length : 0);       
      } catch (error) {
        console.error("Failed to load department overview data:", error);
        setSchedules([]);
        setAudits([]);
        setDepartmentRecipesCount(0);
        setDepartmentStaffCount(0);
      }
    }
    if (department) { 
      loadData();
    }
  }, [department]);
  
  const departmentIconContent = (() => {
    return IconComponent ? <IconComponent sx={{ fontSize: '2.5rem', mr: 1.5 }} /> : <Avatar sx={{ bgcolor: 'transparent', color: 'inherit', width: 40, height: 40, mr: 1.5, fontSize: '1.5rem' }}>{departmentDisplayName.charAt(0)}</Avatar>;
  })();

  return (
    <Box sx={{ p: 3 }}> 
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: accentColor, 
          color: theme.palette.getContrastText(accentColor),
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {departmentIconContent}
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {departmentDisplayName} Overview
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6}>
          <InfoCard
            title="Total Recipes"
            value={departmentRecipesCount}
            icon={
              <Avatar 
                sx={{ 
                  bgcolor: accentColor, 
                  color: theme.palette.getContrastText(accentColor),
                  width: 56, 
                  height: 56, 
                  boxShadow: 2, 
                  transition: 'transform 0.15s', 
                  '&:hover, &:focus': { transform: 'scale(1.08)', boxShadow: 4 } 
                }} 
                aria-label="Total Recipes icon"
              >
                <MenuBookIcon fontSize="large" />
              </Avatar>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <InfoCard
            title="Total Staff"
            value={departmentStaffCount}
            icon={
              <Avatar 
                sx={{ 
                  bgcolor: accentColor, 
                  color: theme.palette.getContrastText(accentColor),
                  width: 56, 
                  height: 56, 
                  boxShadow: 2, 
                  transition: 'transform 0.15s', 
                  '&:hover, &:focus': { transform: 'scale(1.08)', boxShadow: 4 } 
                }} 
                aria-label="Total Staff icon"
              >
                <PeopleIcon fontSize="large" />
              </Avatar>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <InfoCard
            title="Scheduled Recipes"
            value={schedules.length}
            icon={
              <Avatar 
                sx={{ 
                  bgcolor: accentColor, 
                  color: theme.palette.getContrastText(accentColor),
                  width: 56, 
                  height: 56, 
                  boxShadow: 2, 
                  transition: 'transform 0.15s', 
                  '&:hover, &:focus': { transform: 'scale(1.08)', boxShadow: 4 } 
                }} 
                aria-label="Scheduled Recipes icon"
              >
                <CalendarMonthIcon fontSize="large" />
              </Avatar>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <InfoCard
            title="Recent Audits"
            value={audits.length}
            icon={
              <Avatar 
                sx={{ 
                  bgcolor: accentColor, 
                  color: theme.palette.getContrastText(accentColor),
                  width: 56, 
                  height: 56, 
                  boxShadow: 2, 
                  transition: 'transform 0.15s', 
                  '&:hover, &:focus': { transform: 'scale(1.08)', boxShadow: 4 } 
                }} 
                aria-label="Recent Audits icon"
              >
                <FactCheckIcon fontSize="large" />
              </Avatar>
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateProductionDocumentPage;
