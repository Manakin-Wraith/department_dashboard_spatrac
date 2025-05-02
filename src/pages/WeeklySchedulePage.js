import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSchedules, saveSchedule, fetchRecipes, saveAudit, fetchAudits, deleteAudit, deleteSchedule } from '../services/api';
import supplierTable from '../data/supplier_table.json';
import { Box, Button, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Typography, Snackbar, Alert } from '@mui/material';
import ConfirmScheduleModal from '../components/ConfirmScheduleModal';
import ExportScheduleModal from '../components/ExportScheduleModal';
import { useTheme, alpha, darken } from '@mui/material/styles';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import departments from '../data/department_table.json';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { bus } from '../utils/eventBus';

const WeeklySchedulePage = () => {
  const { department } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0,10));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const theme = useTheme();
  const deptObj = departments.find(d => d.department_code === department) || {};
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const accentColor = deptObj.color;

  useEffect(() => {
    async function load() {
      try {
        const [sch, rec] = await Promise.all([
          fetchSchedules(department),
          fetchRecipes(department)
        ]);
        setSchedules(sch);
        // only include recipes for this department
        const flat = Array.isArray(rec[0]) ? rec.flat() : rec;
        const deptRecipes = flat.filter(r => r.department === deptObj.department);
        setRecipes(deptRecipes);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [department, deptObj.department]);


  const handleSave = () => setConfirmOpen(true);

  const handleConfirm = async ({ items: newItems, scheduledDate: date, managerName, handlersNames, ingredientSuppliers }) => {
    try {
      if (selectedId) {
        // update existing schedule via PUT
        const schedule = { id: selectedId, department, weekStartDate: date, managerName, handlersNames, ingredientSuppliers, items: newItems };
        const saved = await saveSchedule(department, schedule);
        setSchedules(schedules.map(s => s.id === selectedId ? saved : s));
      } else {
        // create new schedule via POST
        const schedule = { department, weekStartDate: date, managerName, handlersNames, ingredientSuppliers, items: newItems };
        const saved = await saveSchedule(department, schedule);
        setSchedules(prev => [...prev, saved]);
      }
      // persist audits for each scheduled recipe
      const auditPromises = newItems.map((item, idx) => {
        const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
        // prepare audit record
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
          ingredient_list: recipe.ingredients?.map(ing => ing.description) || [],
          supplier_name: supplierNames,
          address_of_supplier: addressOfSupplier,
          batch_code: [],
          sell_by_date: [],
          receiving_date: [],
          country_of_origin: countries
        };
        return saveAudit(department, record);
      });
      await Promise.all(auditPromises);
      setConfirmOpen(false);
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  };

  const handleDeleteItem = async (scheduleId, idxToDelete) => {
    try {
      const sel = schedules.find(s => s.id === scheduleId);
      if (!sel) return;
      // delete related audit entries for this recipe
      const itemToDel = sel.items[idxToDelete];
      // update schedule items
      const updated = { ...sel, items: sel.items.filter((_, i) => i !== idxToDelete) };
      const saved = await saveSchedule(department, updated);
      setSchedules(schedules.map(s => s.id === scheduleId ? saved : s));
      // remove audit entry
      try {
        const audits = await fetchAudits(department);
        // delete all audits for this recipe on the same date
        const toDelete = audits.filter(a => a.uid.includes(`-${itemToDel.recipeCode}-`));
        await Promise.all(toDelete.map(a => deleteAudit(a.id)));
      } catch (er) {
        console.error('Failed to delete audit record', er);
      }
    } catch (e) {
      console.error('Failed to delete item', e);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const sel = schedules.find(s => s.id === scheduleId);
      if (!sel) return;
      // remove schedule
      await deleteSchedule(scheduleId);
      // record delete audit and broadcast
      const auditRec = await saveAudit(department, {
        entity: 'schedule',
        action: 'delete',
        details: sel
      });
      bus.emit('audit', auditRec);
      bus.emit('scheduleDeleted', scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      // show feedback
      setSnackbar({ open: true, message: 'Schedule deleted successfully', severity: 'success' });
      // remove related audits
      const audits = await fetchAudits(department);
      const toDelete = audits.filter(a => a.uid.startsWith(`${sel.weekStartDate}-`));
      await Promise.all(toDelete.map(a => deleteAudit(a.id)));
      setConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete schedule', err);
    }
  };

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button component={Link} to='/' startIcon={<ArrowBackIcon />} sx={{ color: accentColor, textTransform: 'none' }}>
            Back to Dashboard
          </Button>
        </Box>
        <PageHeader title="Weekly Schedule" />
        <DepartmentTabs />
        <Box sx={{ my: 2 }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={schedules.flatMap(s =>
              s.items.map(item => {
                const rec = recipes.find(r => r.product_code === item.recipeCode) || {};
                return {
                  title: `${rec.description || item.recipeCode} (${item.plannedQty}) – ${s.handlersNames}`,
                  date: s.weekStartDate
                };
              })
            )}
            dateClick={info => {
              setSelectedId('');
              setItems([]);
              setScheduledDate(info.dateStr);
              setConfirmOpen(true);
            }}
            eventClick={info => {
              const sel = schedules.find(s => s.weekStartDate === info.event.startStr);
              if (sel) {
                setSelectedId(sel.id);
                setItems(sel.items);
                setScheduledDate(sel.weekStartDate);
                setConfirmOpen(true);
              }
            }}
            height="auto"
          />
        </Box>
        <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => setExportOpen(true)}
            sx={{ ml: 2, borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
          >Print/Export</Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Scheduled Recipes</Typography>
            {schedules.flatMap(s =>
              s.items.map((item, idx) => {
                const rec = recipes.find(r => r.product_code === item.recipeCode) || {};
                return (
                  <Accordion key={`${s.id}-${item.recipeCode}-${idx}`} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: alpha(accentColor, 0.1) }}>
                      <Typography>{s.weekStartDate} — {rec.description || item.recipeCode} ({item.plannedQty}) — {s.handlersNames}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 2 }}>
                          <Typography variant="body2">Recipe: {rec.description}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">Qty: {item.plannedQty}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">Handlers: {s.handlersNames}</Typography>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton size="small" onClick={() => handleDeleteItem(s.id, idx)} sx={{ color: theme.palette.error.main }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: darken(accentColor, 0.2) } }}
          >
            Save Schedule
          </Button>
        </Box>
        <ConfirmScheduleModal
          open={confirmOpen}
          initialDate={scheduledDate}
          items={items}
          recipes={recipes}
          scheduleId={selectedId}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          onDelete={handleDeleteSchedule}
        />
        <ExportScheduleModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          schedules={schedules}
          recipes={recipes}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default WeeklySchedulePage;
