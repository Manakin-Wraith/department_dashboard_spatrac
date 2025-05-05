import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deleteHandler, fetchSchedules, fetchRecipes, saveSchedule, saveAudit } from '../services/api';
import supplierTable from '../data/supplier_table.json';
import { bus } from '../utils/eventBus';
import { Box, Typography, Button, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import ConfirmScheduleModal from '../components/ConfirmScheduleModal';
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
  const [recipeMap, setRecipeMap] = useState({});
  const [modalItems, setModalItems] = useState([]);
  const [modalDate, setModalDate] = useState('');
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    async function load() {
      const [sch, recs] = await Promise.all([
        fetchSchedules(department),
        fetchRecipes(department)
      ]);
      const defaultList = (deptObj.handlers || []).map((name, idx) => ({ id: null, department, name }));
      setHandlers(defaultList);
      setSchedules(sch);
      // Flatten and filter recipes for this department
      const flatRecs = Array.isArray(recs[0]) ? recs.flat() : recs;
      const deptRecipes = flatRecs.filter(r => r.department === deptObj.department);
      setRecipes(deptRecipes);
      const map = deptRecipes.reduce((acc, r) => { acc[r.product_code] = r.description; return acc; }, {});
      setRecipeMap(map);
    }
    load();
  }, [department, deptObj.handlers, deptObj.department]);

  useEffect(() => {
    const onDel = id => setSchedules(prev => prev.filter(s => s.id !== id));
    bus.on('scheduleDeleted', onDel);
    // Listen for a deleted recipe from a schedule (not the whole schedule)
    const onRecipeDel = ({ handlerName, date, recipeCode }) => {
      setSchedules(prev => prev.map(s => {
        if (s.handlersNames === handlerName && s.weekStartDate === date) {
          return { ...s, items: s.items.filter(item => item.recipeCode !== recipeCode) };
        }
        return s;
      }));
    };
    bus.on('scheduleRecipeDeleted', onRecipeDel);
    return () => {
      bus.off('scheduleDeleted', onDel);
      bus.off('scheduleRecipeDeleted', onRecipeDel);
    };
  }, []);

  const handleAdd = () => {
    setModalItems([]);
    setModalDate('');
    setModalOpen(true);
  };

  const handleEdit = (handler) => {
    const handlerScheds = schedules.filter(s => s.handlersNames === handler.name);
    // For editing, flatten all items, but keep weekStartDate and plannedQty
    const items = handlerScheds.flatMap(s =>
      s.items.map(item => ({ recipeCode: item.recipeCode, plannedQty: item.plannedQty }))
    );
    setModalItems(items);
    setModalDate(handlerScheds[0]?.weekStartDate || '');
    setModalOpen(true);
  };

  // New handler for ConfirmScheduleModal
  const handleConfirm = async ({ items: newItems, scheduledDate: date, managerName, handlersNames, ingredientSuppliers }) => {
    try {
      // Save schedule (new or update)
      const schedule = { department, weekStartDate: date, managerName, handlersNames, ingredientSuppliers, items: newItems };
      const saved = await saveSchedule(department, schedule);
      setSchedules(prev => {
        // Replace or add
        const idx = prev.findIndex(s => s.weekStartDate === date && s.handlersNames === handlersNames);
        if (idx !== -1) {
          const arr = [...prev];
          arr[idx] = saved;
          return arr;
        }
        return [...prev, saved];
      });
      // Save audits for each scheduled recipe
      const auditPromises = newItems.map((item, idx) => {
        const recipe = (Array.isArray(recipes) ? recipes : []).find(r => r.product_code === item.recipeCode) || {};
        const supplierNames = ingredientSuppliers[idx] || [];
        const addressOfSupplier = supplierNames.map(name => {
          const sup = supplierTable.find(s => s.supplier_name === name);
          return sup?.address || '';
        });
        const countries = supplierNames.map(name => supplierTable.find(s => s.supplier_name === name)?.country_of_origin || '');
        const record = {
          uid: `${date}-${item.recipeCode}-${idx}`,
          department,
          date,
          department_manager: managerName,
          food_handler_responsible: handlersNames,
          packing_batch_code: [],
          product_name: [recipe.description || item.recipeCode],
          ingredient_list: recipe.ingredients?.map(ing => {
  const qty = Number(ing.recipe_use) || 0;
  const planned = Number(item.plannedQty) || 0;
  return `${ing.description} (${qty * planned})`;
}) || [],
          supplier_name: supplierNames,
          address_of_supplier: addressOfSupplier,
          batch_code: [],
          sell_by_date: [],
          receiving_date: [],
          country_of_origin: countries,
          planned_qty: item.plannedQty
        };
        return saveAudit(department, record);
      });
      await Promise.all(auditPromises);
      setModalOpen(false);
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
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
  // const unassigned = filteredHandlers.filter(h => getAssignments(h.name).length === 0);
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
            Add Assignment
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

        <ConfirmScheduleModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          items={modalItems}
          recipes={recipes}
          onConfirm={handleConfirm}
          initialDate={modalDate}
        />
      </Box>
    </Box>
  );
};

export default StaffManagementPage;
