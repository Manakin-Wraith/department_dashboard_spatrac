import { useCallback } from 'react';
import { format } from 'date-fns';

/**
 * Custom hook for calendar event handlers
 */
const useCalendarEventHandlers = ({
  setCurrentEventInfo,
  setCurrentSlotInfo,
  setUnifiedModalOpen,
  setUnifiedModalMode,
  setUnifiedModalItem,
  recipes,
  calendarEvents,
  setDayViewOpen,
  setDayEventsData,
  handleDirectUpdate // Add the new direct update handler
}) => {
  /**
   * Handle date click event
   */
  const handleDateClick = useCallback((info) => {
    const clickedDate = info.dateStr;
    
    // If in month view, show day view dialog for the clicked date
    if (info.view.type === 'dayGridMonth') {
      // Filter events for the clicked date
      const formattedDate = format(new Date(clickedDate), 'yyyy-MM-dd');
      const eventsForDay = calendarEvents.filter(event => {
        const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
        return eventDate === formattedDate;
      });
      
      if (eventsForDay.length > 0) {
        // Set day events data for the dialog
        setDayEventsData({
          date: format(new Date(clickedDate), 'MMMM d, yyyy'),
          events: eventsForDay
        });
        
        // Open day view dialog
        setDayViewOpen(true);
      } else {
        // No events for this day, show a message or open scheduling modal
        console.log('No events scheduled for this day');
        
        // For empty days, we could either do nothing or allow scheduling
        // Uncomment the following code to allow scheduling on empty days
        /*
        setCurrentSlotInfo({
          date: clickedDate,
          startTime: '09:00',
          endTime: '17:00'
        });
        setCurrentEventInfo(null);
        setUnifiedModalMode('schedule');
        setUnifiedModalItem(null);
        setUnifiedModalOpen(true);
        */
      }
      return;
    }
    
    // For other views (timeGrid), allow scheduling
    setCurrentSlotInfo({
      date: clickedDate,
      startTime: info.view.type === 'timeGridDay' || info.view.type === 'timeGridWeek' 
        ? info.date.toTimeString().substring(0, 5) 
        : '09:00',
      endTime: info.view.type === 'timeGridDay' || info.view.type === 'timeGridWeek'
        ? new Date(info.date.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5)
        : '17:00'
    });
    
    // Reset event info
    setCurrentEventInfo(null);
    
    // Open modal in schedule mode
    setUnifiedModalMode('schedule');
    setUnifiedModalItem(null);
    setUnifiedModalOpen(true);
  }, [setCurrentEventInfo, setCurrentSlotInfo, setUnifiedModalOpen, setUnifiedModalMode, setUnifiedModalItem, calendarEvents, setDayViewOpen, setDayEventsData]);

  
  /**
   * Handle event click event
   */
  const handleEventClick = useCallback((info) => {
    const { event } = info;
    const { scheduleId, itemIndex, item, recipe: eventRecipe } = event.extendedProps;
    
    // Find the recipe if not provided in the event
    const recipe = eventRecipe || recipes.find(r => r.product_code === item.recipeCode);
    
    // Set current event info
    setCurrentEventInfo({
      event,
      scheduleId,
      itemIndex,
      item: {
        ...item,
        recipe
      }
    });
    
    // Reset slot info
    setCurrentSlotInfo(null);
    
    // Open modal in appropriate mode based on status
    if (item.status === 'completed') {
      setUnifiedModalMode('production');
    } else {
      setUnifiedModalMode('schedule');
    }
    
    setUnifiedModalItem(item);
    setUnifiedModalOpen(true);
  }, [recipes, setCurrentEventInfo, setCurrentSlotInfo, setUnifiedModalOpen, setUnifiedModalMode, setUnifiedModalItem]);
  
  /**
   * Check if only the time has changed during a drag-drop operation
   * @param {Object} originalItem - The original schedule item
   * @param {Object} updatedItem - The updated schedule item after drag-drop
   * @returns {boolean} - True if only time changed, false if date also changed
   */
  const onlyTimeChanged = useCallback((originalItem, updatedItem) => {
    return originalItem.date === updatedItem.date;
  }, []);

  /**
   * Handle event drop (drag and drop)
   */
  const handleEventDrop = useCallback(async (info) => {
    const { event } = info;
    const { scheduleId, itemIndex, item } = event.extendedProps;
    
    // Get the new date and time from the dropped event
    const newDate = event.start.toISOString().split('T')[0];
    
    // Create JavaScript Date objects for proper time handling
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;
    
    // Format start time properly as HH:MM
    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
    const newStartTime = `${startHours}:${startMinutes}`;
    
    // Format end time properly as HH:MM if end exists
    let newEndTime = '';
    if (endDate) {
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      newEndTime = `${endHours}:${endMinutes}`;
    } else {
      // If no end time is provided, set it to 1 hour after start time
      const defaultEndDate = new Date(startDate);
      defaultEndDate.setHours(defaultEndDate.getHours() + 1);
      const endHours = defaultEndDate.getHours().toString().padStart(2, '0');
      const endMinutes = defaultEndDate.getMinutes().toString().padStart(2, '0');
      newEndTime = `${endHours}:${endMinutes}`;
    }
    
    // Log the extracted time information for debugging
    console.log('Extracted time from drag event:', {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      rawStart: startDate,
      rawEnd: endDate
    });
    
    // Create a more detailed slotInfo object with properly formatted times
    const detailedSlotInfo = {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      // Add additional properties that might be needed
      allDay: false,
      start: startDate,
      end: endDate || new Date(startDate.getTime() + 3600000) // Default to 1 hour later if no end time
    };
    
    // Set this as the current slot info
    setCurrentSlotInfo(detailedSlotInfo);
    
    // Create updated item with new date and time
    const updatedItem = {
      ...item,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime
    };
    
    // Set current event info with updated date and time
    setCurrentEventInfo({
      event,
      scheduleId,
      itemIndex,
      item: updatedItem
    });
    
    // If only the time changed (same date), we can update directly without confirmation
    // This provides a smoother user experience for simple time adjustments
    if (recipes && onlyTimeChanged(item, updatedItem) && handleDirectUpdate) {
      // Use the direct update function for simple time changes
      if (typeof info.revert === 'function') {
        try {
          console.log('Auto-updating schedule with new time:', updatedItem);
          // Call the handleDirectUpdate function from useScheduleManagement
          const success = await handleDirectUpdate(info);
          
          if (!success) {
            // If direct update fails, revert the drag and open modal
            info.revert();
            setUnifiedModalMode('schedule');
            setUnifiedModalItem(updatedItem);
            setUnifiedModalOpen(true);
          }
        } catch (error) {
          console.error('Failed to auto-update schedule:', error);
          info.revert();
          // Fall back to modal
          setUnifiedModalMode('schedule');
          setUnifiedModalItem(updatedItem);
          setUnifiedModalOpen(true);
        }
      }
    } else {
      // If the date changed or handleDirectUpdate is not available, open the modal for confirmation
      // This allows the user to review and confirm more significant changes
      setUnifiedModalMode('schedule');
      setUnifiedModalItem(updatedItem);
      setUnifiedModalOpen(true);
    }
  }, [setCurrentEventInfo, setUnifiedModalOpen, setUnifiedModalMode, setUnifiedModalItem, setCurrentSlotInfo, recipes, onlyTimeChanged, handleDirectUpdate]);
  
  /**
   * Handle time slot selection event
   */
  const handleSelectTimeSlot = useCallback((info) => {
    // Get the selected date and time range
    const selectedDate = info.start.toISOString().split('T')[0];
    const startTime = info.start.toTimeString().substring(0, 5);
    const endTime = info.end.toTimeString().substring(0, 5);
    
    // Set current slot info
    setCurrentSlotInfo({
      date: selectedDate,
      startTime,
      endTime
    });
    
    // Reset event info
    setCurrentEventInfo(null);
    
    // Open modal in schedule mode
    setUnifiedModalMode('schedule');
    setUnifiedModalItem(null);
    setUnifiedModalOpen(true);
  }, [setCurrentEventInfo, setCurrentSlotInfo, setUnifiedModalOpen, setUnifiedModalMode, setUnifiedModalItem]);
  
  return {
    handleDateClick,
    handleEventClick,
    handleEventDrop,
    handleSelectTimeSlot
  };
};

export default useCalendarEventHandlers;
