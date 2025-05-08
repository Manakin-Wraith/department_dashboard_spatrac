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
  setDayEventsData
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
   * Handle event drop event (drag and drop)
   */
  const handleEventDrop = useCallback((info) => {
    const { event } = info;
    const { scheduleId, itemIndex, item } = event.extendedProps;
    
    // Get the new date and time from the dropped event
    const newDate = event.start.toISOString().split('T')[0];
    const newStartTime = event.start.toTimeString().substring(0, 5);
    const newEndTime = event.end ? event.end.toTimeString().substring(0, 5) : '';
    
    // Set current event info with updated date and time
    setCurrentEventInfo({
      event,
      scheduleId,
      itemIndex,
      item: {
        ...item,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime
      }
    });
    
    // Open modal in schedule mode
    setUnifiedModalMode('schedule');
    setUnifiedModalItem({
      ...item,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime
    });
    setUnifiedModalOpen(true);
  }, [setCurrentEventInfo, setUnifiedModalOpen, setUnifiedModalMode, setUnifiedModalItem]);
  
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
