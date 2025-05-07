import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import InfoCard from '../components/InfoCard';
import { Box, Avatar, Grid, Paper, Typography, Button, Tabs, Tab, Divider, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchSchedules, fetchAudits, fetchRecipes, fetchHandlers } from '../services/api'; 
import departments from '../data/department_table.json';
import TimeSlotScheduleModal from '../components/TimeSlotScheduleModal';

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
  
  const handleSaveTimeSlot = async (dataFromModal) => {
    console.log('Saving data from TimeSlotScheduleModal:', dataFromModal);
    // This is a placeholder. We need to adapt this data to the current db.json structure.
    // For now, let's assume dataFromModal contains { recipeCode, plannedQty, handlerName, startTime, endTime, date, id (FullCalendar event id or similar) }

    const { date, recipeCode, plannedQty, handlerName: itemHandler, startTime, endTime } = dataFromModal;

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
        managerName: deptObj.department_manager && Array.isArray(deptObj.department_manager) ? deptObj.department_manager[0] : '',
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
        <Box>
          <Button 
            component={Link} 
            to={`/schedule/${department}`}
            variant="contained" 
            color="inherit" 
            sx={{ 
              color: accentColor, 
              bgcolor: theme.palette.getContrastText(accentColor),
              '&:hover': {
                bgcolor: alpha(theme.palette.getContrastText(accentColor), 0.9)
              }
            }}
          >
            View Full Schedule
          </Button>
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
            value={schedules.length}
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
            <Typography variant="h6" sx={{ mb: 2 }}>
              Production Documents
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No production documents available. Schedule recipes to generate production documents.
            </Typography>
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
    </Box>
  );
};

export default CreateProductionDocumentPage;
