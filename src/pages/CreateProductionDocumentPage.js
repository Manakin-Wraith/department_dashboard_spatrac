import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import InfoCard from '../components/InfoCard';
import {
  Box, Avatar, Grid, Paper, Typography, Button, Tabs, Tab, Divider, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, Card, CardContent
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

  useEffect(() => {
    async function loadData() {
      try {
        const [sch, aud, recipesData, handlersData] = await Promise.all([
          fetchSchedules(department),
          fetchAudits(department),
          fetchRecipes(deptObj.department),      
          fetchHandlers(deptObj.department)      
        ]);
        
        // If handlers are empty, try using the handlers array from the department object
        let finalHandlers = handlersData;
        if (!handlersData || handlersData.length === 0) {
          finalHandlers = deptObj.handlers ? deptObj.handlers.map(name => ({ name, id: name })) : [];
        }
        
        setSchedules(sch || []);
        setAudits(aud || []);
        setRecipes(recipesData || []);
        setHandlers(finalHandlers || []);
        setDepartmentRecipesCount(recipesData ? recipesData.length : 0); 
        setDepartmentStaffCount(finalHandlers ? finalHandlers.length : 0);
        
        // Transform schedules into calendar events
        const events = [];
        
        sch?.forEach(schedule => {
          if (schedule.items && Array.isArray(schedule.items)) {
            schedule.items.forEach((item, itemIndex) => {
              const recipe = recipesData?.find(r => r.product_code === item.recipeCode);
              
              // Check if we have startTime and endTime in the item
              if (item.startTime && item.endTime) {
                const [startHours, startMinutes] = item.startTime.split(':').map(Number);
                const [endHours, endMinutes] = item.endTime.split(':').map(Number);
                
                const startDate = new Date(schedule.weekStartDate);
                startDate.setHours(startHours, startMinutes, 0);
                
                const endDate = new Date(schedule.weekStartDate);
                endDate.setHours(endHours, endMinutes, 0);
                
                events.push({
                  id: `${schedule.id}-${itemIndex}`,
                  title: `${recipe?.description || item.recipeCode} (${item.plannedQty})`,
                  start: startDate,
                  end: endDate,
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                  textColor: theme.palette.getContrastText(accentColor),
                  extendedProps: {
                    scheduleId: schedule.id,
                    itemIndex: itemIndex,
                    recipeCode: item.recipeCode,
                    plannedQty: item.plannedQty,
                    handlerName: item.handlerName || schedule.handlersNames
                  }
                });
              }
            });
          }
        });
        
        setCalendarEvents(events);
      } catch (error) {
        console.error("Failed to load department overview data:", error);
        setSchedules([]);
        setAudits([]);
        setRecipes([]);
        setHandlers([]);
        setDepartmentRecipesCount(0);
        setDepartmentStaffCount(0);
      }
    }
    if (department) { 
      loadData();
    }
  }, [department, deptObj, accentColor, theme.palette]);
  
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
  
  const handleSaveTimeSlot = async (dataFromModal) => {
    console.log('Saving data from TimeSlotScheduleModal:', dataFromModal);
    // This is a placeholder. We need to adapt this data to the current db.json structure.
    // For now, let's assume dataFromModal contains { recipeCode, plannedQty, handlerName, startTime, endTime, date, managerName, id (FullCalendar event id or similar) }

    const { date, recipeCode, plannedQty, handlerName: itemHandler, startTime, endTime, managerName } = dataFromModal;

    // Find or create the schedule for the day
    let daySchedule = schedules.find(s => s.weekStartDate === date && s.department === department);

    let isNewScheduleDay = false;

    if (!daySchedule) {
      isNewScheduleDay = true;
      daySchedule = {
        id: `sched_${Date.now()}`,
        department,
        weekStartDate: date,
        items: [],
        managerName: managerName || (deptObj.department_manager && Array.isArray(deptObj.department_manager) ? deptObj.department_manager[0] : ''),
        handlersNames: itemHandler || (handlers[0]?.name) || '',
        status: 'Planned',
        unique_ScheduledID: `${department}-${date}-${Date.now()}`
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
      // const savedSchedule = await saveSchedule(department, updatedSchedule);
      
      // For now, just update the local state
      if (isNewScheduleDay) {
        setSchedules([...schedules, updatedSchedule]);
      } else {
        setSchedules(schedules.map(s => s.id === daySchedule.id ? updatedSchedule : s));
      }
      
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
                Production Documents
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
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(accentColor, 0.1) }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Recipe</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Handler</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      schedule.items.map((item, itemIndex) => {
                        const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
                        return (
                          <TableRow key={`${schedule.id}-${itemIndex}`}>
                            <TableCell>{schedule.weekStartDate}</TableCell>
                            <TableCell>{recipe.description || item.recipeCode}</TableCell>
                            <TableCell>{item.plannedQty}</TableCell>
                            <TableCell>
                              {item.startTime && item.endTime ? 
                                `${item.startTime} - ${item.endTime}` : 
                                'Not specified'}
                            </TableCell>
                            <TableCell>{item.handlerName || schedule.handlersNames}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditDocument(schedule, item, itemIndex)}
                                sx={{ color: accentColor }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteDocument(schedule, item, itemIndex)}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Grid container spacing={2}>
                {filteredSchedules.map((schedule) => (
                  schedule.items.map((item, itemIndex) => {
                    const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
                    return (
                      <Grid item xs={12} sm={6} md={4} key={`${schedule.id}-${itemIndex}`}>
                        <Card sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderTop: `4px solid ${accentColor}`
                        }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {recipe.description || item.recipeCode}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Date: {schedule.weekStartDate}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              Quantity: {item.plannedQty}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              Time: {item.startTime && item.endTime ? 
                                `${item.startTime} - ${item.endTime}` : 
                                'Not specified'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              Handler: {item.handlerName || schedule.handlersNames}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              Manager: {schedule.managerName || 'Not assigned'}
                            </Typography>
                            
                            {recipe.ingredients && recipe.ingredients.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2">Ingredients:</Typography>
                                <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                                  {recipe.ingredients.slice(0, 3).map((ing, idx) => {
                                    const qty = Number(ing.recipe_use) || 0;
                                    const planned = Number(item.plannedQty) || 0;
                                    return (
                                      <li key={idx}>
                                        {ing.description} ({qty * planned})
                                      </li>
                                    );
                                  })}
                                  {recipe.ingredients.length > 3 && (
                                    <li>...and {recipe.ingredients.length - 3} more</li>
                                  )}
                                </ul>
                              </Box>
                            )}
                          </CardContent>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            p: 1,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                          }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditDocument(schedule, item, itemIndex)}
                              sx={{ color: accentColor }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteDocument(schedule, item, itemIndex)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })
                ))}
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
      
      {/* Export Schedule Modal */}
      <ExportScheduleModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        schedules={filteredSchedules}
        recipes={recipes}
      />
      
      {/* Print Document Modal */}
      <PrintDocumentModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        schedules={filteredSchedules}
        recipes={recipes}
      />
      
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
