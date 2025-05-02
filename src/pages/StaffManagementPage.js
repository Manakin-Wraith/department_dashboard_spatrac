import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { saveHandler, deleteHandler, fetchSchedules, fetchRecipes, saveSchedule, saveAudit } from '../services/api';
import { bus } from '../utils/eventBus';
import { Box, Typography, Button, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, IconButton } from '@mui/material';
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
      const [sch, recs] = await Promise.all([
        fetchSchedules(department),
        fetchRecipes(department)
      ]);
      const defaultList = (deptObj.handlers || []).map((name, idx) => ({ id: null, department, name }));
      // always use the hard-coded staff list
      setHandlers(defaultList);
      setSchedules(sch);
      // Flatten nested array of recipes if needed
      const flatRecs = Array.isArray(recs[0]) ? recs.flat() : recs;
      const map = flatRecs.reduce((acc, r) => { acc[r.product_code] = r.description; return acc; }, {});
      setRecipeMap(map);
    }
    load();
  }, [department, deptObj.handlers]);

  useEffect(() => {
    const onDel = id => setSchedules(prev => prev.filter(s => s.id !== id));
    bus.on('scheduleDeleted', onDel);
    return () => bus.off('scheduleDeleted', onDel);
  }, []);

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
    // Save assignments as grouped schedules
    if (handler.assignments?.length) {
      // group by schedule id or date to update existing schedules
      const grouped = handler.assignments.reduce((acc, a) => {
        const key = a.id ?? a.date;
        if (!acc[key]) acc[key] = { id: a.id, weekStartDate: a.date, items: [] };
        acc[key].items.push({ recipeCode: a.recipeCode, plannedQty: a.plannedQty });
        return acc;
      }, {});
      const payloads = Object.values(grouped).map(g => ({
        id: g.id,
        department,
        weekStartDate: g.weekStartDate,
        managerName: '',
        handlersNames: saved.name,
        items: g.items
      }));
      const updatedScheds = [];
      for (const payload of payloads) {
        const sched = await saveSchedule(department, payload);
        updatedScheds.push(sched);
        // record audit
        const auditRec = await saveAudit(department, {
          entity: 'schedule',
          action: payload.id ? 'update' : 'create',
          details: payload
        });
        bus.emit('audit', auditRec);
      }
      // replace schedules for this handler
      setSchedules(prev => [
        ...prev.filter(s => s.handlersNames !== saved.name),
        ...updatedScheds
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

  // Partition handlers by assignment status
  const filteredHandlers = handlers.filter(h => h.name.toLowerCase().includes(filter.toLowerCase()));
  const unassigned = filteredHandlers.filter(h => getAssignments(h.name).length === 0);
  const assigned = filteredHandlers.filter(h => getAssignments(h.name).length > 0);

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
        {/* Staff with Assignments */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Staff with Assignments</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Staff Name</TableCell>
                  <TableCell>Assignments</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assigned.map((h, idx) => (
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
        </Box>
        {/* Current Staff */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Current Staff</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Staff Name</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unassigned.map((h, idx) => (
                  <TableRow key={`${h.id ?? h.name}-${idx}`}> 
                    <TableCell>{h.name}</TableCell>
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
        </Box>
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
