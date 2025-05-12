import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  fetchSchedules, 
  saveSchedule, 
  deleteSchedule, 
  fetchRecipes, 
  fetchHandlers, 
  saveAudit, 
  fetchAudits, 
  deleteAudit 
} from '../services/api';
import supplierTable from '../data/supplier_table.json';
import { Box, Button, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Typography, Snackbar, Alert } from '@mui/material';
import ConfirmScheduleModal from '../components/ConfirmScheduleModal';
import TimeSlotScheduleModal from '../components/TimeSlotScheduleModal';
import ExportScheduleModal from '../components/ExportScheduleModal';
import { useTheme, alpha } from '@mui/material/styles';
import PageHeader from '../components/PageHeader';
import departments from '../data/department_table.json';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
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
  const [handlers, setHandlers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [managerName] = useState('');
  const [handlerName] = useState('');
  const [timeSlotModalOpen, setTimeSlotModalOpen] = useState(false);
  const [currentEventInfo, setCurrentEventInfo] = useState(null);
  const [currentSlotInfo, setCurrentSlotInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [exportOpen, setExportOpen] = useState(false);

  const theme = useTheme();
  
  // Find department object by department_code (URL parameter) - wrapped in useMemo
  const deptObj = useMemo(() => {
    const found = departments.find(d => 
      d && d.department_code && 
      department && 
      d.department_code === department
    ) || {};
    
    console.log('Department lookup:', { 
      urlParam: department, 
      foundDepartment: found, 
      allDepartments: departments 
    });
    
    return found;
  }, [department]); // departments is imported statically, so it's not needed as a dependency
  const pageBg = alpha(theme.palette.background.default, 0.6);
  const pageTextColor = theme.palette.text.primary;
  const accentColor = deptObj.color;

  const loadData = useCallback(async () => {
    try {
      // We already have deptObj from above
      console.log('Loading data for department:', { 
        department_code: department,
        department_name: deptObj.department
      });
      
      // Use department_code for schedules, department name for recipes and handlers
      const [sch, rec, handlersData] = await Promise.all([
        fetchSchedules(department), // Keep using the URL param for schedules
        fetchRecipes(deptObj.department), // Use department name (BUTCHERY, HMR, etc.)
        fetchHandlers(deptObj.department) // Use department name for handlers too
      ]);
      
      // If handlers are still empty, try using the handlers_names array from the department object
      let finalHandlers = handlersData;
      if (!handlersData || handlersData.length === 0) {
        console.log('No handlers returned from API, using handlers_names from department object');
        finalHandlers = deptObj.handlers_names ? deptObj.handlers_names.map(name => ({ name, id: name })) : [];
      }
      
      console.log('Fetched data:', { 
        department_code: department, 
        department_name: deptObj.department, 
        schedules: sch.length, 
        recipes: rec.length, 
        handlers: finalHandlers.length,
        recipesSample: rec.slice(0, 3),
        handlersSample: finalHandlers.slice(0, 3)
      });
      
      setSchedules(sch);
      setRecipes(rec);
      setHandlers(finalHandlers);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, [department, deptObj]); // Add deptObj as a dependency

  useEffect(() => {
    const initLoad = async () => {
      await loadData();
    };
    initLoad();
  }, [loadData]); // Added loadData to dependency array (department is already a dep of loadData)

  const handleSave = async (newItems, newManager, newHandler, dateToSave, scheduleIdToUpdate) => {
    try {
      // Ensure all items have a status (default to 'Planned' if not set)
      const itemsWithStatus = newItems.map(item => ({
        ...item,
        status: item.status || 'Planned'
      }));
      
      let saved;
      
      if (selectedId) {
        // update existing schedule via PUT
        const schedule = { 
          id: selectedId, 
          department, 
          weekStartDate: dateToSave, 
          managerName: newManager, 
          handlersNames: newHandler, 
          items: itemsWithStatus 
        };
        
        // Save to database
        saved = await saveSchedule(department, schedule);
        console.log('Updated schedule in database:', saved);
        
        // Update local state immediately for responsive UI
        setSchedules(prevSchedules => {
          return prevSchedules.map(s => s.id === selectedId ? saved : s);
        });
      } else {
        // create new schedule via POST
        const schedule = { 
          department, 
          weekStartDate: dateToSave, 
          managerName: newManager, 
          handlersNames: newHandler, 
          items: itemsWithStatus 
        };
        
        // Save to database
        saved = await saveSchedule(department, schedule);
        console.log('Created new schedule in database:', saved);
        
        // Update local state immediately for responsive UI
        setSchedules(prevSchedules => [...prevSchedules, saved]);
      }
      
      // Reload data to ensure we have the latest from the server
      // This ensures that our local state matches what's in the database
      try {
        await loadData();
        console.log('Data reloaded after save');
      } catch (reloadError) {
        console.error('Error reloading data after save:', reloadError);
        // Continue with the process even if reload fails
      }
      
      // Emit event for other components to react
      bus.emit('schedule-updated', saved);
      
      // Also emit a general data-updated event for any component that needs to refresh
      bus.emit('data-updated', { type: 'schedule', data: saved });
      // persist audits for each scheduled recipe
      const auditPromises = newItems.map((item, idx) => {
        const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
        // prepare audit record
        const supplierNames = [];
        const addressOfSupplier = supplierNames.map(name => {
          const sup = supplierTable.find(s => s.supplier_name === name);
          return sup?.address || '';
        });
        const countries = supplierNames.map(name => supplierTable.find(s => s.supplier_name === name)?.country_of_origin || '');
        const record = {
          uid: `${dateToSave}-${item.recipeCode}-${idx}`,
          department,
          date: dateToSave,
          department_manager: newManager,
          food_handler_responsible: newHandler,
          planned_qty: item.plannedQty,
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

  const handleSaveTimeSlot = async (dataFromModal) => {
    console.log('Saving data from TimeSlotScheduleModal:', dataFromModal);
    // This is a placeholder. We need to adapt this data to the current db.json structure.
    // For now, let's assume dataFromModal contains { recipeCode, plannedQty, handlerName, startTime, endTime, date, id (FullCalendar event id or similar) }

    const { date, recipeCode, plannedQty, handlerName: itemHandler } = dataFromModal;

    // Find or create the schedule for the day
    let daySchedule = schedules.find(s => s.weekStartDate === date && s.department_code === deptObj.department_code);

    let isNewScheduleDay = false;

    if (!daySchedule) {
      isNewScheduleDay = true;
      daySchedule = {
        id: `sched_${Date.now()}`,
        department_code: deptObj.department_code,
        weekStartDate: date,
        items: [],
        managerName: managerName || (deptObj.department_manager && deptObj.department_manager[0]) || '',
        handlersNames: itemHandler || handlerName || (handlers[0]?.name) || '',
        status: 'Planned',
        unique_ScheduledID: `${deptObj.department_code}-${date}-${Date.now()}`
      };
    }

    let newItemsForDaySchedule;
    if (currentEventInfo && currentEventInfo.extendedProps.scheduleId) {
      // Editing an existing item within a day's schedule
      const existingItemIndex = currentEventInfo.extendedProps.itemIndex;
      newItemsForDaySchedule = daySchedule.items.map((item, index) => {
        if (index === existingItemIndex) {
          return { ...item, recipeCode, plannedQty }; // Update recipe and qty. Handler and time are visual for now.
        }
        return item;
      });
    } else {
      // Adding a new item to the day's schedule
      newItemsForDaySchedule = [...daySchedule.items, { recipeCode, plannedQty }];
    }

    const scheduleToSave = {
      ...daySchedule,
      items: newItemsForDaySchedule,
      // Potentially update daySchedule.handlersNames if makes sense, or acknowledge it's a simplification
      handlersNames: itemHandler || daySchedule.handlersNames, 
    };

    try {
      await saveSchedule(department, scheduleToSave, scheduleToSave.id && !isNewScheduleDay ? scheduleToSave.id : null);
      console.log('Day schedule saved/updated via TimeSlotModal');
    } catch (error) {
      console.error('Error saving schedule from TimeSlotModal:', error);
    }

    setTimeSlotModalOpen(false);
    setCurrentEventInfo(null);
    setCurrentSlotInfo(null);
    loadData(); // Reload schedules to reflect changes from the 'server'
  };

  const handleDeleteItem = async (scheduleId, idxToDelete) => {
    try {
      const sel = schedules.find(s => s.id === scheduleId);
      if (!sel) return;
      // delete related audit entries for this recipe
      const itemToDel = sel.items[idxToDelete];
      // update schedule items
      const updatedItems = sel.items.filter((_, i) => i !== idxToDelete);
      if (updatedItems.length === 0) {
        // If no items left, delete the schedule
        await deleteSchedule(scheduleId);
        setSchedules(schedules.filter(s => s.id !== scheduleId));
        // emit event for full schedule deletion
        bus.emit('scheduleDeleted', scheduleId);
      } else {
        const updated = { ...sel, items: updatedItems };
        const saved = await saveSchedule(department, updated);
        setSchedules(schedules.map(s => s.id === scheduleId ? saved : s));
        // emit event for staff assignment update
        bus.emit('scheduleRecipeDeleted', { handlerName: sel.handlersNames, date: sel.weekStartDate, recipeCode: itemToDel.recipeCode });
      }
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
        <Box sx={{ my: 2 }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={schedules.flatMap(s =>
              s.items.map((item, index) => {
                const rec = recipes.find(r => r.product_code === item.recipeCode) || {};
                const baseDate = s.weekStartDate;
                let itemStartTime = `${baseDate}T${String(9 + index).padStart(2, '0')}:00:00`;
                let itemEndTime = `${baseDate}T${String(9 + index + 1).padStart(2, '0')}:00:00`;

                if (item.startTime && item.endTime) {
                  itemStartTime = `${baseDate}T${item.startTime}`;
                  itemEndTime = `${baseDate}T${item.endTime}`;
                }

                return {
                  title: `${rec.description || item.recipeCode} (${item.plannedQty}) – ${s.handlersNames}`,
                  start: itemStartTime,
                  end: itemEndTime,
                  allDay: false,
                  extendedProps: {
                    scheduleId: s.id,
                    itemIndex: index,
                    originalDate: s.weekStartDate,
                    recipeCode: item.recipeCode,
                    plannedQty: item.plannedQty,
                    handlerName: s.handlersNames
                  }
                };
              })
            )}
            dateClick={info => {
              if (info.view.type === 'dayGridMonth') {
                setSelectedId('');
                setItems([]);
                setScheduledDate(info.dateStr);
                setConfirmOpen(true);
                setTimeSlotModalOpen(false);
              } else {
                setCurrentSlotInfo(info);
                setCurrentEventInfo(null);
                setTimeSlotModalOpen(true);
                setConfirmOpen(false);
              }
            }}
            eventClick={info => {
              setCurrentEventInfo(info.event);
              setCurrentSlotInfo(null);
              setTimeSlotModalOpen(true);
              setConfirmOpen(false);
            }}
            slotMinTime="05:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
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

        {confirmOpen && (
          <ConfirmScheduleModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            initialDate={scheduledDate}
            items={items}
            recipes={recipes}
            scheduleId={selectedId}
            onSave={handleSave}
            onDelete={handleDeleteSchedule}
          />
        )}

        {timeSlotModalOpen && (
          <>
            {console.log('WeeklySchedulePage: Rendering TimeSlotScheduleModal with:', { recipes, handlers, deptObj })}
            <TimeSlotScheduleModal
              open={timeSlotModalOpen}
              onClose={() => {
                setTimeSlotModalOpen(false);
                setCurrentEventInfo(null);
                setCurrentSlotInfo(null);
              }}
              eventInfo={currentEventInfo}
              slotInfo={currentSlotInfo}
              recipes={recipes}
              handlers={handlers}
              department={deptObj}
              onSave={handleSaveTimeSlot}
            />
          </>
        )}

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
