import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Avatar, Grid, Paper, Typography, Button
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import custom hooks
import useProductionData from '../hooks/useProductionData';
import useScheduleManagement from '../hooks/useScheduleManagement';
import useNotifications from '../hooks/useNotifications';
import { useDepartmentStaff } from '../hooks/useDepartmentStaff';
import useCalendarEventHandlers from '../components/production/calendar/CalendarEventHandlers';

// Import components
import ProductionCalendar from '../components/production/calendar/ProductionCalendar';
import ProductionDocumentList from '../components/production/documents/ProductionDocumentList';
import ProductionDocumentCard from '../components/production/documents/ProductionDocumentCard';
import DocumentFilters from '../components/production/documents/DocumentFilters';
import UnifiedScheduleModal from '../components/UnifiedScheduleModal';
import DayViewDialog from '../components/production/modals/DayViewDialog';
import NotificationSystem from '../components/production/common/NotificationSystem';
import PrintDocumentModal from '../components/PrintDocumentModal';
import ChangeHistoryDialog from '../components/ChangeHistoryDialog';

// Import utilities
import { bus } from '../utils/eventBus';

/**
 * Get department information based on department code
 * @param {string} code - Department code
 * @returns {Object} Department information
 */
const getDepartmentInfo = (code) => {
  switch (code) {
    case 'butchery':
      return {
        name: 'Butchery',
        color: '#d32f2f',
        icon: <LocalDiningIcon />
      };
    case 'hmr':
      return {
        name: 'Home Meal Replacement',
        color: '#ed6c02',
        icon: <RestaurantIcon />
      };
    case 'bakery':
      return {
        name: 'Bakery',
        color: '#9c27b0',
        icon: <BakeryDiningIcon />
      };
    default:
      return {
        name: 'Department',
        color: '#1976d2',
        icon: <LocalDiningIcon />
      };
  }
};

/**
 * CreateProductionDocumentPage component for managing production schedules and documents
 */
const CreateProductionDocumentPage = () => {
  const { department } = useParams();
  // eslint-disable-next-line no-unused-vars
  const theme = useTheme();
  const calendarRef = useRef(null);
  
  // Get department name and color
  const deptObj = getDepartmentInfo(department);
  const accentColor = deptObj.color;
  
  // Debug department information
  console.log(`CreateProductionDocumentPage initialized with department: ${department}`);
  console.log('Department object:', deptObj);
  
  // Track department code format for debugging
  useEffect(() => {
    if (department) {
      console.log(`Department code format analysis:`);
      console.log(`- Raw department code: ${department}`);
      console.log(`- Department code type: ${typeof department}`);
      console.log(`- Is numeric: ${/^\d+$/.test(department)}`);
      console.log(`- Uppercase: ${department.toUpperCase()}`);
      console.log(`- Lowercase: ${department.toLowerCase()}`);
    }
  }, [department]);
  
  // Use the custom hook for department staff data
  const { 
    foodHandlers, 
    departmentManagers, 
    loading: staffLoading 
  } = useDepartmentStaff(department, deptObj);
  
  // State for document view
  const [documentView, setDocumentView] = useState('list'); // 'list', 'card', or 'calendar'
  
  // State for filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  
  // State for day view dialog
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [dayEventsData, setDayEventsData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  
  // State for unified modal
  const [unifiedModalOpen, setUnifiedModalOpen] = useState(false);
  const [unifiedModalMode, setUnifiedModalMode] = useState('schedule'); // 'schedule' or 'production'
  const [unifiedModalItem, setUnifiedModalItem] = useState(null);
  
  // Use custom hooks
  const {
    recipes,
    schedules,
    filteredSchedules,
    setFilteredSchedules,
    setSchedules,
    loading,
    error,
    filterSchedules,
    reloadData
  } = useProductionData(department);
  
  // Monitor recipe loading status
  useEffect(() => {
    if (loading.recipes) {
      console.log(`Loading recipes for department: ${department}...`);
    } else {
      console.log(`Recipe loading complete for department: ${department}. Found ${recipes.length} recipes.`);
      if (recipes.length === 0) {
        console.warn(`No recipes found for department: ${department}. This may cause issues with production document creation.`);
      } else {
        console.log('Recipe sample:', recipes.slice(0, 3).map(r => ({ 
          code: r.product_code, 
          name: r.name || r.description, 
          department: r.department || r.department_code 
        })));
      }
    }
  }, [loading.recipes, recipes, department]);
  
  const {
    // eslint-disable-next-line no-unused-vars
    selectedSchedule,
    setSelectedSchedule,
    // eslint-disable-next-line no-unused-vars
    selectedItem,
    setSelectedItem,
    currentEventInfo,
    setCurrentEventInfo,
    // eslint-disable-next-line no-unused-vars
    currentSlotInfo,
    setCurrentSlotInfo,
    calendarEvents,
    setCalendarEvents,
    handleSaveTimeSlot,
    // eslint-disable-next-line no-unused-vars
    createAuditData,
    updateCalendarEvents,
    // eslint-disable-next-line no-unused-vars
    getStatusColor
  } = useScheduleManagement({
    schedules,
    setSchedules,
    recipes,
    department
  });
  
  const {
    notification,
    // eslint-disable-next-line no-unused-vars
    showNotification,
    closeNotification,
    showSuccess,
    showError
  } = useNotifications();
  
  // Use calendar event handlers
  const {
    handleDateClick,
    handleEventClick,
    handleEventDrop,
    handleSelectTimeSlot
  } = useCalendarEventHandlers({
    setCurrentEventInfo,
    setCurrentSlotInfo,
    setUnifiedModalOpen,
    setUnifiedModalMode,
    setUnifiedModalItem,
    recipes,
    calendarEvents,
    setDayViewOpen,
    setDayEventsData
  });
  
  // Staff loading indicator
  useEffect(() => {
    if (staffLoading) {
      console.log('Loading department staff data...');
    }
  }, [staffLoading]);
  
  // Update calendar events when schedules change
  useEffect(() => {
    updateCalendarEvents();
  }, [schedules, updateCalendarEvents]);
  
  // Subscribe to bus events
  useEffect(() => {
    const handleReload = () => {
      reloadData();
    };
    
    bus.on('reload-production-data', handleReload);
    
    return () => {
      bus.off('reload-production-data', handleReload);
    };
  }, [reloadData]);
  
  // getDepartmentInfo function is now defined at the top of the file
  
  /**
   * Handle filter button click
   */
  const handleFilter = () => {
    filterSchedules(startDate, endDate, searchTerm);
  };
  
  /**
   * Handle reset filters
   */
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilteredSchedules(schedules);
  };
  
  /**
   * Handle document view change
   */
  const toggleDocumentView = (view) => {
    setDocumentView(view);
  };
  
  /**
   * Handle print documents
   */
  const handlePrintDocuments = () => {
    setPrintModalOpen(true);
  };
  
  /**
   * Handle export documents
   */
  const handleExportDocuments = () => {
    setExportModalOpen(true);
  };
  
  /**
   * Handle create new production document
   */
  const handleCreateNewProduction = () => {
    // Set current date as default
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Set default time slot (9 AM to 5 PM)
    setCurrentSlotInfo({
      date: formattedDate,
      startTime: '09:00',
      endTime: '17:00'
    });
    
    // Clear current event info and modal item
    setCurrentEventInfo(null);
    setUnifiedModalItem(null);
    
    // Set mode to schedule and open the modal
    setUnifiedModalMode('schedule');
    setUnifiedModalOpen(true);
  };

  /**
   * Handle edit document
   */
  const handleEditDocument = (schedule, item, index) => {
    setSelectedSchedule(schedule);
    setSelectedItem({ ...item, index });
    setUnifiedModalItem(item);
    setUnifiedModalMode(item.status === 'completed' ? 'production' : 'schedule');
    setUnifiedModalOpen(true);
  };
  
  /**
   * Handle delete document
   */
  const handleDeleteDocument = async (schedule, item, index) => {
    if (!schedule || !item) return;
    
    try {
      const updatedSchedule = { ...schedule };
      
      // Remove the item from the schedule
      updatedSchedule.items = updatedSchedule.items.filter((_, idx) => idx !== index);
      
      // If there are no more items, remove the entire schedule
      if (updatedSchedule.items.length === 0) {
        setSchedules(schedules.filter(s => s.id !== schedule.id));
      } else {
        // Otherwise, update the schedule
        setSchedules(schedules.map(s => s.id === schedule.id ? updatedSchedule : s));
      }
      
      // Update calendar events
      setCalendarEvents(calendarEvents.filter(event => 
        !(event.extendedProps.scheduleId === schedule.id && 
          event.extendedProps.itemIndex === index)
      ));
      
      showSuccess('Production document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      showError('Failed to delete document: ' + error.message);
    }
  };
  
  /**
   * Handle view history
   */
  const handleViewHistory = (item) => {
    setSelectedHistoryItem(item);
    setHistoryDialogOpen(true);
  };
  
  /**
   * Handle unified save
   */
  const handleUnifiedSave = async (data) => {
    try {
      // With the simplified status-based workflow, we use handleSaveTimeSlot for all operations
      // The function will handle the appropriate actions based on the current status
      const result = await handleSaveTimeSlot(data);
      const newItem = result || data; // Use the result from handleSaveTimeSlot or fall back to data
      const auditCreated = data.status === 'completed'; // Set auditCreated based on status
      
      // Show appropriate message based on status
      if (data.status === 'planned') {
        console.log('Recipe planned successfully');
      } else if (data.status === 'scheduled') {
        console.log('Production scheduled successfully');
      } else if (data.status === 'completed') {
        console.log('Production completed successfully');
      } else if (data.status === 'cancelled') {
        console.log('Recipe cancelled');
      }
      
      // Force a direct refresh of the calendar after saving
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        
        // Directly update the calendar's internal event source
        const eventSources = calendarApi.getEventSources();
        if (eventSources.length > 0) {
          eventSources[0].remove();
        }
        
        // Get the current events state
        let currentEvents = [...calendarEvents];
        
        // Update or add the new event
        if (currentEventInfo) {
          currentEvents = currentEvents.map(event => 
            event.id === currentEventInfo.event.id ? currentEventInfo.event : event
          );
        } else if (currentEventInfo && currentEventInfo.event) {
          currentEvents.push(currentEventInfo.event);
        }
        
        // Add the updated events directly to the calendar
        calendarApi.addEventSource(currentEvents);
        
        // If this was triggered by a drag-and-drop, make sure to keep the view centered on the event
        if (startDate) {
          // Only change the date if we're not already showing the right week/day
          const currentViewStart = calendarApi.view.currentStart;
          const currentViewEnd = calendarApi.view.currentEnd;
          if (startDate < currentViewStart || startDate > currentViewEnd) {
            calendarApi.gotoDate(startDate);
          }
        }
      }
      
      // Show appropriate success message based on the action taken
      if (auditCreated) {
        showSuccess('Production completed and audit record created successfully');
      } else if (newItem.status === 'scheduled') {
        showSuccess('Production scheduled successfully');
      } else if (newItem.status === 'planned') {
        showSuccess('Recipe planned successfully');
      } else if (newItem.status === 'cancelled') {
        showSuccess('Recipe cancelled successfully');
      }
      
      // Close the modal and reset state
      setUnifiedModalOpen(false);
      setCurrentEventInfo(null);
      setCurrentSlotInfo(null);
      setUnifiedModalItem(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      showError('Failed to save schedule: ' + error.message);
    }
  };
  
  // Render department header
  const renderDepartmentHeader = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                bgcolor: alpha(accentColor, 0.1),
                color: accentColor,
                width: 56,
                height: 56
              }}
            >
              {deptObj.icon}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {deptObj.name} Production
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage production schedules and documents
            </Typography>
          </Grid>
          <Grid item>
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
              onClick={handleExportDocuments}
              sx={{ borderColor: accentColor, color: accentColor }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render content based on view
  const renderContent = () => {
    if (loading.schedules) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading production documents...</Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            onClick={reloadData} 
            sx={{ mt: 2, borderColor: accentColor, color: accentColor }}
          >
            Retry
          </Button>
        </Box>
      );
    }
    
    switch (documentView) {
      case 'calendar':
        return (
          <ProductionCalendar
            calendarEvents={calendarEvents}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onSelect={handleSelectTimeSlot}
            ref={calendarRef}
          />
        );
      case 'card':
        return (
          <ProductionDocumentCard
            schedules={filteredSchedules}
            recipes={recipes}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onViewHistory={handleViewHistory}
            onCreateNew={handleCreateNewProduction}
            accentColor={accentColor}
          />
        );
      case 'list':
      default:
        return (
          <ProductionDocumentList
            schedules={filteredSchedules}
            recipes={recipes}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onViewHistory={handleViewHistory}
            onCreateNew={handleCreateNewProduction}
            accentColor={accentColor}
          />
        );
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Department Header */}
      {renderDepartmentHeader()}
      
      {/* Document Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <DocumentFilters
          startDate={startDate}
          endDate={endDate}
          searchTerm={searchTerm}
          documentView={documentView}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSearchChange={setSearchTerm}
          onViewChange={toggleDocumentView}
          onFilter={handleFilter}
          onReset={handleResetFilters}
          accentColor={accentColor}
        />
      </Paper>
      
      {/* Main Content */}
      <Paper elevation={1} sx={{ p: 2 }}>
        {renderContent()}
      </Paper>
      
      {/* Unified Schedule Modal */}
      <UnifiedScheduleModal
        open={unifiedModalOpen}
        onClose={() => setUnifiedModalOpen(false)}
        onSave={handleUnifiedSave}
        mode={unifiedModalMode}
        currentItem={unifiedModalItem}
        recipes={recipes}
        handlers={foodHandlers}
        managers={departmentManagers}
        department={{ code: department, color: accentColor }}
        currentEventInfo={currentEventInfo}
        currentSlotInfo={currentSlotInfo}
        suppliers={[]}
      />
      
      {/* Print Document Modal */}
      <PrintDocumentModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        schedules={filteredSchedules || []}
        recipes={recipes || []}
      />
      
      {/* Change History Dialog */}
      <ChangeHistoryDialog
        open={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedHistoryItem(null);
        }}
        item={selectedHistoryItem}
      />
      
      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={closeNotification}
      />
      
      {/* Day View Dialog */}
      <DayViewDialog
        open={dayViewOpen}
        onClose={() => {
          setDayViewOpen(false);
          setDayEventsData(null);
        }}
        dayEventsData={dayEventsData}
        accentColor={accentColor}
        onEventClick={(item) => {
          setSelectedHistoryItem(item);
          setDayViewOpen(false);
          setViewDetailsOpen(true);
        }}
        schedules={schedules}
      />
    </Box>
  );
};

export default CreateProductionDocumentPage;

