import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSchedules, saveSchedule, fetchRecipes } from '../services/api';
import { Box, Button, Select, MenuItem, TextField, Grid, Card, CardContent } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import ConfirmScheduleModal from '../components/ConfirmScheduleModal';
import { useTheme, alpha, darken } from '@mui/material/styles';
import PageHeader from '../components/PageHeader';
import DepartmentTabs from '../components/DepartmentTabs';
import departments from '../data/department_table.json';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import PrintIcon from '@mui/icons-material/Print';

const WeeklySchedulePage = () => {
  const { department } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const handleSelectWeek = e => {
    const id = e.target.value;
    setSelectedId(id);
    const sel = schedules.find(s => s.id === id);
    setItems(sel ? sel.items : []);
  };

  const handleQtyChange = (idx, qty) => {
    const next = [...items];
    next[idx].plannedQty = Number(qty);
    setItems(next);
  };

  const handleRecipeChange = (idx, code) => {
    const next = [...items];
    next[idx].recipeCode = code;
    setItems(next);
  };

  const addRow = () => {
    setItems([...items, { recipeCode: recipes[0]?.product_code || '', plannedQty: 0 }]);
  };

  const handleSave = () => setConfirmOpen(true);

  const handleConfirm = async ({ items: newItems, scheduledDate: date, managerName, handlersNames, ingredientSuppliers }) => {
    const existing = schedules.find(s => s.id === selectedId);
    const id = existing?.id || `sched-${Date.now()}`;
    const schedule = {
      id,
      department,
      weekStartDate: date,
      managerName,
      handlersNames,
      ingredientSuppliers,
      items: newItems
    };
    try {
      await saveSchedule(department, schedule);
      const updated = existing
        ? schedules.map(s => s.id === id ? schedule : s)
        : [...schedules, schedule];
      setSchedules(updated);
      setConfirmOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <PageHeader title="Weekly Schedule" />
        <DepartmentTabs />
        <Box sx={{ my: 2 }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={schedules.map(s => ({ title: s.weekStartDate, date: s.weekStartDate }))}
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
          <Select value={selectedId} onChange={handleSelectWeek} displayEmpty>
            <MenuItem value="" disabled>Select a week</MenuItem>
            {schedules.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.weekStartDate}</MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            onClick={() => { setSelectedId(''); setItems([]); }}
            sx={{ borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
          >New Week</Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ ml: 2, borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
          >Print/Export</Button>
        </Box>

        <Card>
          <CardContent>
            <Grid container spacing={2}>
              {items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <Grid item xs={6}>
                    <Select
                      fullWidth
                      value={item.recipeCode}
                      onChange={e => handleRecipeChange(idx, e.target.value)}
                    >
                      {recipes.map(r => (
                        <MenuItem key={r.product_code} value={r.product_code}>
                          {r.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.plannedQty}
                      onChange={e => handleQtyChange(idx, e.target.value)}
                    />
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
            <Button
              variant="outlined"
              startIcon={<AddCircleOutline />}
              sx={{ mt: 2, borderColor: accentColor, color: accentColor, '&:hover': { borderColor: accentColor } }}
              onClick={addRow}
            >
              Add Item
            </Button>
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
      </Box>
    </Box>
  );
};

export default WeeklySchedulePage;
