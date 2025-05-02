import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHandlers, saveHandler, deleteHandler, fetchSchedules, fetchRecipes, saveSchedule } from '../services/api';
import { Box, Button, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [filter, setFilter] = useState('');
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
    const handlerScheds = schedules.filter(s => s.handlersNames === handler.name);
    const assignments = handlerScheds.flatMap(s =>
      s.items.map(item => ({ id: s.id, date: s.weekStartDate, recipeCode: item.recipeCode, plannedQty: item.plannedQty }))
    );
    setSelectedHandler({ ...handler, assignments });
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
          id: a.id,
          department,
          weekStartDate: a.date,
          managerName: '',
          handlersNames: saved.name,
          items: [{ recipeCode: a.recipeCode, plannedQty: a.plannedQty }]
        }))
      );
      // replace old schedules for this handler with updated ones
      setSchedules(prev => [
        ...prev.filter(s => s.handlersNames !== saved.name),
        ...newScheds
      ]);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
          <TextField
            placeholder="Search staff..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            size="small"
            sx={{ width: 200 }}
          />
          <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: accentColor, color: '#fff', '&:hover': { backgroundColor: darken(accentColor, 0.2) } }}>
            Add Staff
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Name</TableCell>
                <TableCell>Assignments</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {handlers.filter(h => h.name.toLowerCase().includes(filter.toLowerCase())).map((h, idx) => (
                <TableRow key={`${h.id ?? h.name}-${idx}`}>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>
                    {getAssignments(h.name).map(({ date, recipes }) => (
                      <Chip
                        key={date}
                        label={`${date}: ${recipes.map(it => `${it.plannedQty}x ${recipeMap[it.recipeCode] || it.recipeCode}`).join(', ')}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(h)}>
                      <EditIcon />
                    </IconButton>
                    {h.id && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(h.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <StaffModal
          open={modalOpen}
          handler={selectedHandler}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </Box>
    </Box>
  );
};

export default StaffManagementPage;
