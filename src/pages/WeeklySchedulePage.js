import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSchedules, saveSchedule, fetchRecipes } from '../services/api';
import { Box, Button, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
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

const WeeklySchedulePage = () => {
  const { department } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0,10));

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
        setRecipes(Array.isArray(rec[0]) ? rec.flat() : rec);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [department]);


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
      setConfirmOpen(false);
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  };

  const handleDeleteItem = async (scheduleId, idxToDelete) => {
    try {
      const sel = schedules.find(s => s.id === scheduleId);
      if (!sel) return;
      const updated = { ...sel, items: sel.items.filter((_, i) => i !== idxToDelete) };
      const saved = await saveSchedule(department, updated);
      setSchedules(schedules.map(s => s.id === scheduleId ? saved : s));
    } catch (e) {
      console.error('Failed to delete item', e);
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
                return { title: `${rec.description || item.recipeCode} (${item.plannedQty})`, date: s.weekStartDate };
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
                      <Typography>{s.weekStartDate} — {rec.description || item.recipeCode} ({item.plannedQty})</Typography>
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
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
        <ExportScheduleModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          schedules={schedules}
          recipes={recipes}
        />
      </Box>
    </Box>
  );
};

export default WeeklySchedulePage;
