import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHandlers, saveHandler, deleteHandler, fetchSchedules, fetchRecipes, saveSchedule } from '../services/api';
import { Box, Grid, Typography, Card, CardContent, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import StaffModal from '../components/StaffModal';
import { useTheme, alpha, darken } from '@mui/material/styles';
import departments from '../data/department_table.json';

const StaffManagementPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const accentColor = deptObj.color || theme.palette.primary.main;
  const [handlers, setHandlers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState(null);
  const [recipeMap, setRecipeMap] = useState({});

  useEffect(() => {
    async function load() {
      const [hrs, sch, recs] = await Promise.all([
        fetchHandlers(department),
        fetchSchedules(department),
        fetchRecipes(department)
      ]);
      const defaultList = (deptObj.handlers || []).map((name, idx) => ({ id: null, department, name }));
      setHandlers(hrs.length ? hrs : defaultList);
      setSchedules(sch);
      // Flatten nested array of recipes if needed
      const flatRecs = Array.isArray(recs[0]) ? recs.flat() : recs;
      const map = flatRecs.reduce((acc, r) => { acc[r.product_code] = r.description; return acc; }, {});
      setRecipeMap(map);
    }
    load();
  }, [department, deptObj.handlers]);

  const handleAdd = () => {
    setSelectedHandler(null);
    setModalOpen(true);
  };

  const handleEdit = (handler) => {
    setSelectedHandler(handler);
    setModalOpen(true);
  };

  const handleSave = async (handler) => {
    // Save handler first
    const saved = await saveHandler(department, handler);
    setHandlers(prev => {
      const exists = prev.find(h => h.id === saved.id);
      if (exists) return prev.map(h => h.id === saved.id ? saved : h);
      return [...prev, saved];
    });
    // Save assignments as schedules
    if (handler.assignments?.length) {
      const newScheds = await Promise.all(
        handler.assignments.map(a => saveSchedule(department, {
          department,
          weekStartDate: a.date,
          managerName: '',
          handlersNames: saved.name,
          items: [{ recipeCode: a.recipeCode, plannedQty: a.plannedQty }]
        }))
      );
      setSchedules(prev => [...prev, ...newScheds]);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete handler?')) {
      await deleteHandler(id);
      setHandlers(prev => prev.filter(h => h.id !== id));
    }
  };

  const getAssignments = (handlerName) =>
    schedules
      .filter(s => s.handlersNames === handlerName)
      .map(s => ({ date: s.weekStartDate, recipes: s.items }));

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button component={Link} to='/' startIcon={<ArrowBackIcon />} sx={{ color: accentColor, textTransform: 'none' }}>
            Back to Dashboard
          </Button>
        </Box>
        <PageHeader title="Staff Management" />
        <DepartmentTabs />
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: accentColor, color: '#fff', '&:hover': { backgroundColor: darken(accentColor, 0.2) } }}>
            Add Staff
          </Button>
        </Box>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {handlers.map(h => (
            <Grid item xs={12} sm={6} md={4} key={h.id}>
              <Card sx={{
                backgroundColor: theme.palette.common.white,
                borderRadius: 2,
                p: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: accentColor, mb: 1 }} gutterBottom>{h.name}</Typography>
                  <Typography variant="subtitle2" gutterBottom>Assignments:</Typography>
                  {getAssignments(h.name).map(({ date, recipes }) => (
                    <Box key={date} sx={{ mb: 1 }}>
                      <Typography variant="body2">{date}</Typography>
                      <Typography variant="body2">
                        {recipes.map(it => `${it.recipeCode} – ${recipeMap[it.recipeCode] || it.recipeCode} (${it.plannedQty})`).join(', ')}
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleEdit(h)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(h.id)}>Delete</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <StaffModal
          open={modalOpen}
          handler={selectedHandler}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </Box>
    </Box>
  );
};

export default StaffManagementPage;
