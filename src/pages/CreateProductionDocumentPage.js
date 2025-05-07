import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ConfirmProductionModal from '../components/ConfirmProductionModal';
import { saveAudit, saveSchedule, deleteSchedule } from '../services/api';
import { bus } from '../utils/eventBus';
import InfoCard from '../components/InfoCard';
import {
  Box, Avatar, Grid, Paper, Typography, Button, Tabs, Tab, Divider, Tooltip,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, InputLabel, Select, FormControl, MenuItem
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchSchedules, fetchAudits, fetchRecipes, fetchHandlers } from '../services/api'; 
import departments from '../data/department_table.json';
import TimeSlotScheduleModal from '../components/TimeSlotScheduleModal';
import ExportScheduleModal from '../components/ExportScheduleModal';
import PrintDocumentModal from '../components/PrintDocumentModal';

// Map JSON icon key to component
const iconMap = { SetMealIcon, SoupKitchenIcon, BakeryDiningIcon };

const CreateProductionDocumentPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  const calendarRef = useRef(null);
  
  // Wrap deptObj in useMemo to prevent recreation on every render
  const deptObj = useMemo(() => {
    return departments.find(d => d.department_code === department) || {};
  }, [department]);

  const accentColor = deptObj.color || theme.palette.primary.main; 
  const departmentDisplayName = deptObj.department || 'Department';
  const IconComponent = iconMap[deptObj.icon]; 

  const [schedules, setSchedules] = useState([]);
  const [audits, setAudits] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [departmentRecipesCount, setDepartmentRecipesCount] = useState(0); 
  const [departmentStaffCount, setDepartmentStaffCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [timeSlotModalOpen, setTimeSlotModalOpen] = useState(false);
  const [currentSlotInfo, setCurrentSlotInfo] = useState(null);
  const [currentEventInfo, setCurrentEventInfo] = useState(null);
  
  // States for Production Documents tab
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [documentView, setDocumentView] = useState('list'); // 'list' or 'card'
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState(null);

  // Function to load data from API - wrapped in useCallback to prevent recreation on every render
  const loadData = useCallback(async () => {
    try {
      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      console.log(`Loading data for CreateProductionDocumentPage... (${timestamp})`);
      
      // Make sure we have a valid department before fetching
      if (!department || !deptObj.department) {
        console.warn('Cannot load data: missing department information');
        return;
      }
      
      const [sch, aud, recipesData, handlersData] = await Promise.all([
        fetchSchedules(department),
        fetchAudits(department),
        fetchRecipes(deptObj.department),      
        fetchHandlers(deptObj.department)      
      ]);
      
      // If handlers are empty, try using the handlers array from the department object
      const finalHandlers = handlersData && handlersData.length > 0 
        ? handlersData 
        : (deptObj.handlers ? deptObj.handlers.map(name => ({ name, id: name })) : []);
      
      setSchedules(sch || []);
      setAudits(aud || []);
      setRecipes(recipesData || []);
      setHandlers(finalHandlers);
      setDepartmentRecipesCount(recipesData ? recipesData.length : 0);
      setDepartmentStaffCount(finalHandlers ? finalHandlers.length : 0);
      
      console.log(`Data loaded successfully (${timestamp})`);
    } catch (error) {
      console.error('Error loading data for CreateProductionDocumentPage:', error);
    }
  }, [department, deptObj]);
  
  // This useEffect is only for loading data when department changes
  useEffect(() => {
    if (department) {
      console.log('Department changed, loading data...');
      loadData();
    }
  }, [department, loadData]);

  // Separate useEffect for initializing calendar events when data changes
  useEffect(() => {
    const initializeCalendarEvents = () => {
      try {
        // Create calendar events from schedules
        const events = [];
        
        schedules.forEach(schedule => {
          const date = new Date(schedule.weekStartDate);
          
          if (schedule.items && Array.isArray(schedule.items)) {
            schedule.items.forEach((item, idx) => {
              // Find recipe details
              const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
              const title = recipe.description || item.recipeCode || 'Unknown Recipe';
              const color = item.status === 'Confirmed' ? '#4caf50' : accentColor;
              
              // Create event object for FullCalendar
              events.push({
                id: `${schedule.id}-${idx}`,
                title,
                start: date,
                backgroundColor: color,
                borderColor: theme.palette.grey[300],
                extendedProps: {
                  scheduleId: schedule.id,
                  itemIndex: idx,
                  status: item.status,
                  plannedQty: item.plannedQty,
                  recipeCode: item.recipeCode,
                  description: title
                }
              });
            });
          }
        });
        
        setCalendarEvents(events);
      } catch (error) {
        console.error("Failed to initialize calendar events:", error);
        setCalendarEvents([]);
      }
    };
    
    // Initialize calendar events when schedules, recipes, or theme changes
    if (schedules.length > 0 && recipes.length > 0) {
      initializeCalendarEvents();
    }
  }, [schedules, recipes, accentColor, theme.palette]);
  
  const departmentIconContent = (() => {
    return IconComponent ? <IconComponent sx={{ fontSize: '2.5rem', mr: 1.5 }} /> : <Avatar sx={{ bgcolor: 'transparent', color: 'inherit', width: 40, height: 40, mr: 1.5, fontSize: '1.5rem' }}>{departmentDisplayName.charAt(0)}</Avatar>;
  })();
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // If switching to Production Documents tab, initialize with current week
    if (newValue === 1 && !startDate) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
      
      setStartDate(startOfWeek.toISOString().substring(0, 10));
      setEndDate(endOfWeek.toISOString().substring(0, 10));
    }
  };
  
  const handleDateClick = (info) => {
    setCurrentSlotInfo({
      date: info.dateStr
    });
    setTimeSlotModalOpen(true);
  };
  
  const handleEventClick = (info) => {
    setCurrentEventInfo(info.event);
    setTimeSlotModalOpen(true);
  };
  
  // Handle time slot selection (drag over time slots)
  const handleSelectTimeSlot = (selectInfo) => {
    // Format the date and time information for the modal
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    
    // Create a slot info object with the selected date range
    const slotInfo = {
      date: startDate.toISOString().substring(0, 10),
      startTime: startDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5)
    };
    
    setCurrentSlotInfo(slotInfo);
    setTimeSlotModalOpen(true);
  };
  
  // Filter schedules based on date range
  useEffect(() => {
    if (startDate || endDate) {
      const filtered = schedules.filter(schedule => {
        if (startDate && endDate) {
          return schedule.weekStartDate >= startDate && schedule.weekStartDate <= endDate;
        } else if (startDate) {
          return schedule.weekStartDate >= startDate;
        } else if (endDate) {
          return schedule.weekStartDate <= endDate;
        }
        return true;
      });
      setFilteredSchedules(filtered);
    } else {
      setFilteredSchedules(schedules);
    }
  }, [schedules, startDate, endDate]);
  
  // Handle edit document
  const handleEditDocument = (schedule, item, index) => {
    setSelectedSchedule(schedule);
    setSelectedItem({ ...item, index });
    setEditModalOpen(true);
  };
  
  // Handle delete document
  const handleDeleteDocument = (schedule, item, index) => {
    setSelectedSchedule(schedule);
    setSelectedItem({ ...item, index });
    setDeleteConfirmOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedSchedule || selectedItem === null) return;
    
    try {
      // Create a copy of the schedule
      const updatedSchedule = { ...selectedSchedule };
      
      // Remove the item from the items array
      updatedSchedule.items = updatedSchedule.items.filter((_, idx) => idx !== selectedItem.index);
      
      // If there are no more items, delete the entire schedule
      if (updatedSchedule.items.length === 0) {
        // await deleteSchedule(department, selectedSchedule.id);
        setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
      } else {
        // Otherwise update the schedule with the item removed
        // const savedSchedule = await saveSchedule(department, updatedSchedule);
        setSchedules(schedules.map(s => s.id === selectedSchedule.id ? updatedSchedule : s));
      }
      
      // Update calendar events
      setCalendarEvents(calendarEvents.filter(event => 
        !(event.extendedProps.scheduleId === selectedSchedule.id && 
          event.extendedProps.itemIndex === selectedItem.index)
      ));
      
      setDeleteConfirmOpen(false);
      setSelectedSchedule(null);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };
  
  // Handle save edited document
  const handleSaveEdit = async (editedData) => {
    if (!selectedSchedule || selectedItem === null) return;
    
    try {
      // Create a copy of the schedule
      const updatedSchedule = { ...selectedSchedule };
      
      // Update the specific item
      updatedSchedule.items = [...updatedSchedule.items];
      updatedSchedule.items[selectedItem.index] = {
        ...updatedSchedule.items[selectedItem.index],
        ...editedData
      };
      
      // Save the updated schedule
      // const savedSchedule = await saveSchedule(department, updatedSchedule);
      setSchedules(schedules.map(s => s.id === selectedSchedule.id ? updatedSchedule : s));
      
      // Update calendar events
      const recipe = recipes.find(r => r.product_code === editedData.recipeCode);
      const [startHours, startMinutes] = editedData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = editedData.endTime.split(':').map(Number);
      
      const startDate = new Date(selectedSchedule.weekStartDate);
      startDate.setHours(startHours, startMinutes, 0);
      
      const endDate = new Date(selectedSchedule.weekStartDate);
      endDate.setHours(endHours, endMinutes, 0);
      
      const updatedEvent = {
        id: `${selectedSchedule.id}-${selectedItem.index}`,
        title: `${recipe?.description || editedData.recipeCode} (${editedData.plannedQty})`,
        start: startDate,
        end: endDate,
        backgroundColor: accentColor,
        borderColor: accentColor,
        textColor: theme.palette.getContrastText(accentColor),
        extendedProps: {
          scheduleId: selectedSchedule.id,
          itemIndex: selectedItem.index,
          recipeCode: editedData.recipeCode,
          plannedQty: editedData.plannedQty,
          handlerName: editedData.handlerName
        }
      };
      
      setCalendarEvents(calendarEvents.map(event => 
        (event.extendedProps.scheduleId === selectedSchedule.id && 
         event.extendedProps.itemIndex === selectedItem.index) ? updatedEvent : event
      ));
      
      setEditModalOpen(false);
      setSelectedSchedule(null);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to save edited document:', error);
    }
  };
  
  // Handle print documents
  const handlePrintDocuments = () => {
    setPrintModalOpen(true);
  };
  
  // Toggle document view (list/card)
  const toggleDocumentView = () => {
    setDocumentView(documentView === 'list' ? 'card' : 'list');
  };

  // Handle confirm production
  const handleConfirmProduction = (scheduleItem) => {
    setSelectedScheduleItem(scheduleItem);
    setConfirmModalOpen(true);
  };
  
  // Handle confirmation submission
  const handleConfirmSubmit = async (updatedScheduleItem, auditData) => {
    try {
      // Find the schedule that contains this item
      const scheduleIndex = schedules.findIndex(s => 
        s.weekStartDate === updatedScheduleItem.date && 
        s.department === department
      );
      
      if (scheduleIndex === -1) return;
      
      // Find the item within the schedule
      const schedule = schedules[scheduleIndex];
      const itemIndex = schedule.items.findIndex(item => 
        item.recipeCode === updatedScheduleItem.recipeCode &&
        item.startTime === updatedScheduleItem.startTime &&
        item.endTime === updatedScheduleItem.endTime
      );
      
      if (itemIndex === -1) return;
      
      // Store the schedule ID for reference
      const scheduleId = schedule.id;
      
      // Create enhanced audit data with reference to original schedule
      const enhancedAuditData = {
        ...auditData,
        department: department,
        status: 'Confirmed',
        originalScheduleId: scheduleId,
        // Add the confirmed item details
        actualQty: updatedScheduleItem.actualQty,
        notes: updatedScheduleItem.notes,
        qualityScore: updatedScheduleItem.qualityScore,
        deviations: updatedScheduleItem.deviations,
        confirmationTimestamp: new Date().toISOString()
      };
      
      // Save the audit record first to ensure we have a record before removing the schedule
      try {
        // Save audit to the database
        const savedAudit = await saveAudit(department, enhancedAuditData);
        console.log('Audit saved to database:', savedAudit);
        
        // Add to local state for immediate UI update
        setAudits(prevAudits => [...prevAudits, savedAudit]);
        
        // Now that we have successfully saved the audit, we can remove the item from the schedule
        // If this is the only item in the schedule, delete the entire schedule
        if (schedule.items.length === 1) {
          try {
            // Delete the schedule from the database
            await deleteSchedule(scheduleId);
            console.log('Schedule deleted from database:', scheduleId);
            
            // Update local state by removing the schedule
            setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== scheduleId));
            
            // Emit events for other components to react to the schedule deletion
            bus.emit('schedule-deleted', scheduleId);
            bus.emit('data-updated', { type: 'schedule-deleted', id: scheduleId });
          } catch (deleteError) {
            console.error('Failed to delete schedule from database:', deleteError);
            // Continue with the process even if delete fails
          }
        } else {
          // If there are multiple items, just remove the confirmed item
          const updatedItems = schedule.items.filter((_, idx) => idx !== itemIndex);
          const updatedSchedule = { ...schedule, items: updatedItems };
          
          try {
            // Save the updated schedule with the item removed
            const savedSchedule = await saveSchedule(department, updatedSchedule);
            console.log('Schedule updated in database:', savedSchedule);
            
            // Update local state immediately for responsive UI
            setSchedules(prevSchedules => 
              prevSchedules.map(s => s.id === scheduleId ? savedSchedule : s)
            );
            
            // Emit events for other components to react to the schedule update
            bus.emit('schedule-updated', savedSchedule);
            bus.emit('data-updated', { type: 'schedule-updated', data: savedSchedule });
          } catch (updateError) {
            console.error('Failed to update schedule in database:', updateError);
            // Continue with the process even if update fails
          }
        }
        
        // Reload data to ensure we have the latest from the server
        try {
          await loadData();
          console.log('Data reloaded after confirmation');
        } catch (reloadError) {
          console.error('Error reloading data after confirmation:', reloadError);
          // Continue with the process even if reload fails
        }
        
        // Notify other components about the new audit
        bus.emit('new-audit', savedAudit);
        bus.emit('data-updated', { type: 'new-audit', data: savedAudit });
      } catch (auditError) {
        console.error('Failed to save audit data:', auditError);
        // Still keep the local state updated even if API fails
        setAudits([...audits, enhancedAuditData]);
      }
      
      console.log('Production confirmed:', updatedScheduleItem);
      console.log('Audit data created:', auditData);
    } catch (error) {
      console.error('Failed to confirm production:', error);
    }
  };
  

const handleSaveTimeSlot = async (dataFromModal) => {
  console.log('Saving data from TimeSlotScheduleModal:', dataFromModal);
  // Extract data from modal
  const { date, recipeCode, plannedQty, handlerName: itemHandler, startTime, endTime, managerName } = dataFromModal;

  // Create or update the day's schedule
  let daySchedule;
  let isNewScheduleDay = false;
  
  // Find if we already have a schedule for this day
  daySchedule = schedules.find(s => {
    const scheduleDate = new Date(s.weekStartDate);
    return scheduleDate.toDateString() === new Date(date).toDateString();
  });
  
  if (!daySchedule) {
    isNewScheduleDay = true;
    // Create a simple numeric ID for new schedules instead of a string with prefix
    const scheduleId = Date.now();
    daySchedule = {
      id: scheduleId,
      department,
      weekStartDate: date,
      items: [],
      managerName: managerName || (deptObj.department_manager && Array.isArray(deptObj.department_manager) ? deptObj.department_manager[0] : ''),
      handlersNames: itemHandler || (handlers[0]?.name) || '',
      status: 'Planned',
      unique_ScheduledID: `${department}-${date}-${scheduleId}`
    };
  }

  let newItemsForDaySchedule;
  if (currentEventInfo && currentEventInfo.extendedProps.scheduleId) {
    // Editing an existing item within a day's schedule
    const existingItemIndex = currentEventInfo.extendedProps.itemIndex;
    newItemsForDaySchedule = [...daySchedule.items];
    
    if (existingItemIndex !== undefined && newItemsForDaySchedule[existingItemIndex]) {
      newItemsForDaySchedule[existingItemIndex] = {
        ...newItemsForDaySchedule[existingItemIndex],
        recipeCode,
        plannedQty,
          handlerName: itemHandler,
          startTime,
          endTime
        };
      }
    } else {
      // Adding a new item to the day's schedule
      newItemsForDaySchedule = [
        ...daySchedule.items,
        {
          recipeCode,
          plannedQty,
          handlerName: itemHandler,
          startTime,
          endTime
        }
      ];
    }

    // Update the schedule with new items
    const updatedSchedule = {
      ...daySchedule,
      items: newItemsForDaySchedule
    };

    try {
      // Save to API
      const savedSchedule = await saveSchedule(department, updatedSchedule);
      console.log('Schedule saved to database:', savedSchedule);
      
      // Update local state with the saved schedule from the database
      if (isNewScheduleDay) {
        setSchedules(prevSchedules => [...prevSchedules, savedSchedule]);
      } else {
        setSchedules(prevSchedules => prevSchedules.map(s => s.id === daySchedule.id ? savedSchedule : s));
      }
      
      // Emit events for other components to react
      bus.emit('schedule-updated', savedSchedule);
      bus.emit('data-updated', { type: 'schedule', data: savedSchedule });
      
      // Update calendar events
      const recipe = recipes.find(r => r.product_code === recipeCode);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startDate = new Date(date);
      startDate.setHours(startHours, startMinutes, 0);
      
      const endDate = new Date(date);
      endDate.setHours(endHours, endMinutes, 0);
      
      const newEvent = {
        id: currentEventInfo ? currentEventInfo.id : `${updatedSchedule.id}-${newItemsForDaySchedule.length - 1}`,
        title: `${recipe?.description || recipeCode} (${plannedQty})`,
        start: startDate,
        end: endDate,
        backgroundColor: accentColor,
        borderColor: accentColor,
        textColor: theme.palette.getContrastText(accentColor),
        extendedProps: {
          scheduleId: updatedSchedule.id,
          itemIndex: currentEventInfo ? currentEventInfo.extendedProps.itemIndex : newItemsForDaySchedule.length - 1,
          recipeCode,
          plannedQty,
          handlerName: itemHandler
        }
      };
      
      if (currentEventInfo) {
        setCalendarEvents(calendarEvents.map(event => event.id === newEvent.id ? newEvent : event));
      } else {
        setCalendarEvents([...calendarEvents, newEvent]);
      }
      
      // Close the modal
      setTimeSlotModalOpen(false);
      setCurrentEventInfo(null);
      setCurrentSlotInfo(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

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
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {departmentIconContent}
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {departmentDisplayName} Overview
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard
            title="Scheduled Recipes"
            value={schedules.reduce((total, schedule) => total + (schedule.items?.length || 0), 0)}
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
        <Grid item xs={12} sm={6} md={3}>
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
      
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              '& .MuiTab-root.Mui-selected': { color: accentColor },
              '& .MuiTabs-indicator': { backgroundColor: accentColor }
            }}
          >
            <Tab label="Production Schedule" />
            <Tab label="Production Documents" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Weekly Production Schedule
              </Typography>
              <Tooltip title="Schedule New Recipe">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const today = new Date();
                    setCurrentSlotInfo({
                      date: today.toISOString().substring(0, 10)
                    });
                    setTimeSlotModalOpen(true);
                  }}
                  sx={{ 
                    bgcolor: accentColor,
                    '&:hover': { bgcolor: alpha(accentColor, 0.8) }
                  }}
                >
                  Add Recipe
                </Button>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: '70vh' }}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                select={handleSelectTimeSlot}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="20:00:00"
                height="100%"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: false,
                  hour12: false
                }}
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
              />
            </Box>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Production Documents ({filteredSchedules.reduce((total, schedule) => total + (schedule.items?.length || 0), 0)} scheduled recipes)
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintDocuments}
                  sx={{ mr: 1, borderColor: accentColor, color: accentColor }}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => setExportModalOpen(true)}
                  sx={{ borderColor: accentColor, color: accentColor }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  component={Link}
                  to={`/production/${department}/audit`}
                >
                  View Audits
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={toggleDocumentView}
                    sx={{ 
                      bgcolor: accentColor, 
                      height: '100%',
                      '&:hover': { bgcolor: alpha(accentColor, 0.8) }
                    }}
                  >
                    {documentView === 'list' ? 'Card View' : 'List View'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {filteredSchedules.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No production documents available for the selected date range.
              </Typography>
            ) : documentView === 'list' ? (
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Recipe</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Handler</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSchedules.flatMap(schedule => 
                      schedule.items.map((item, itemIndex) => {
                        const recipe = recipes.find(r => r.product_code === item.recipeCode);
                        const status = item.status || 'Planned';
                        return (
                          <TableRow key={`${schedule.id}-${itemIndex}`}>
                            <TableCell>{schedule.weekStartDate}</TableCell>
                            <TableCell>{recipe?.description || item.recipeCode}</TableCell>
                            <TableCell>{item.plannedQty}</TableCell>
                            <TableCell>{item.handlerName || schedule.handlersNames}</TableCell>
                            <TableCell>{item.startTime} - {item.endTime}</TableCell>
                            <TableCell>
                              <Chip 
                                label={status} 
                                color={status === 'Confirmed' ? 'success' : 
                                       status === 'In Progress' ? 'warning' : 'default'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell align="right">
                              {status !== 'Confirmed' && (
                                <>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEditDocument(schedule, item, itemIndex)}
                                    sx={{ mr: 1 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteDocument(schedule, item, itemIndex)}
                                    sx={{ mr: 1 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleConfirmProduction({
                                      ...item,
                                      date: schedule.weekStartDate,
                                      department: department,
                                      managerName: schedule.managerName
                                    })}
                                  >
                                    Confirm
                                  </Button>
                                </>
                              )}
                              {status === 'Confirmed' && (
                                <Typography variant="caption" color="success.main">
                                  Confirmed on {new Date(item.confirmationTimestamp).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Grid container spacing={2}>
                {filteredSchedules.flatMap(schedule => 
                  schedule.items.map((item, itemIndex) => {
                    const recipe = recipes.find(r => r.product_code === item.recipeCode);
                    const status = item.status || 'Planned';
                    return (
                      <Grid item xs={12} sm={6} md={4} key={`${schedule.id}-${itemIndex}`}>
                        <Card sx={{
                          borderLeft: status === 'Confirmed' ? '4px solid green' : 
                                            status === 'In Progress' ? '4px solid orange' : '4px solid grey'
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                {recipe?.description || item.recipeCode}
                              </Typography>
                              <Chip 
                                label={status} 
                                color={status === 'Confirmed' ? 'success' : 
                                       status === 'In Progress' ? 'warning' : 'default'} 
                                size="small" 
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Date: {schedule.weekStartDate}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Time: {item.startTime} - {item.endTime}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Quantity: {item.plannedQty}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Handler: {item.handlerName || schedule.handlersNames}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Manager: {schedule.managerName}
                            </Typography>
                            {item.status === 'Confirmed' && item.actualQty && (
                              <Typography variant="body2" color="text.secondary">
                                Actual Quantity: {item.actualQty}
                              </Typography>
                            )}
                          </CardContent>
                          <CardActions>
                            {status !== 'Confirmed' && (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditDocument(schedule, item, itemIndex)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteDocument(schedule, item, itemIndex)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleConfirmProduction({
                                    ...item,
                                    date: schedule.weekStartDate,
                                    department: department,
                                    managerName: schedule.managerName
                                  })}
                                >
                                  Confirm
                                </Button>
                              </>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })
                )}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
      
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
      
      {/* Print Document Modal */}
      {printModalOpen && (
        <PrintDocumentModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          schedules={schedules}
          recipes={recipes}
          department={department}
        />
      )}

      {/* Export Schedule Modal */}
      {exportModalOpen && (
        <ExportScheduleModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          schedules={schedules}
          recipes={recipes}
          department={department}
        />
      )}
      
      {/* Confirm Production Modal */}
      {confirmModalOpen && selectedScheduleItem && (
        <ConfirmProductionModal
          open={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setSelectedScheduleItem(null);
          }}
          scheduleItem={selectedScheduleItem}
          recipes={recipes}
          onConfirm={handleConfirmSubmit}
        />
      )}

      {/* Edit Document Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: `2px solid ${accentColor}`, color: accentColor }}>
          Edit Production Document
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && selectedSchedule && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Recipe</InputLabel>
                  <Select
                    value={selectedItem.recipeCode}
                    label="Recipe"
                    onChange={(e) => setSelectedItem({...selectedItem, recipeCode: e.target.value})}
                  >
                    {recipes.map((recipe) => (
                      <MenuItem key={recipe.product_code} value={recipe.product_code}>
                        {recipe.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={selectedItem.plannedQty}
                  onChange={(e) => setSelectedItem({...selectedItem, plannedQty: Number(e.target.value)})}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  fullWidth
                  margin="normal"
                  value={selectedItem.startTime || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, startTime: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Time"
                  type="time"
                  fullWidth
                  margin="normal"
                  value={selectedItem.endTime || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, endTime: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Handler</InputLabel>
                  <Select
                    value={selectedItem.handlerName || selectedSchedule.handlersNames || ''}
                    label="Handler"
                    onChange={(e) => setSelectedItem({...selectedItem, handlerName: e.target.value})}
                  >
                    {handlers.map((handler) => (
                      <MenuItem key={handler.id || handler.name} value={handler.name}>
                        {handler.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditModalOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => handleSaveEdit(selectedItem)}
            sx={{ bgcolor: accentColor, '&:hover': { bgcolor: alpha(accentColor, 0.8) } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this production document?
            {selectedItem && selectedSchedule && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                {(recipes.find(r => r.product_code === selectedItem.recipeCode) || {}).description || selectedItem.recipeCode}
                {' - '}
                {selectedSchedule.weekStartDate}
              </Box>
            )}
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateProductionDocumentPage;
