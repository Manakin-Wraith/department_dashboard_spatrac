import { useState, useCallback } from 'react';
import { saveSchedule, deleteSchedule } from '../services/api';

/**
 * Custom hook for managing production schedules
 * @param {Object} options - Configuration options
 * @param {Array} options.schedules - Current schedules array
 * @param {Function} options.setSchedules - Function to update schedules
 * @param {Array} options.recipes - Available recipes
 * @param {string} options.department - Department code
 * @returns {Object} Schedule management functions and state
 */
const useScheduleManagement = ({ schedules, setSchedules, recipes, department }) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentEventInfo, setCurrentEventInfo] = useState(null);
  const [currentSlotInfo, setCurrentSlotInfo] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Simple notification function
  const showNotification = useCallback(({ message, type }) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // In a real app, this would show a toast or notification UI
    // but for now we'll just log to console
  }, []);
  
  /**
   * Create audit data from schedule data
   * @param {Object} data - Schedule data
   * @param {Object} recipe - Recipe data
   * @returns {Object} Audit data
   */
  const createAuditData = useCallback((data, recipe) => {
    const { 
      recipeCode, plannedQty, handlerName, date, actualQty, 
      qualityScore, notes, deviations, batchCodes, sellByDates, 
      receivingDates, managerName, status, id: productionId 
    } = data;
    
    // Get ingredient information from the recipe
    const ingredientList = recipe?.ingredients?.map(ing => ing.description) || [];
    const supplierNames = recipe?.ingredients?.map(ing => ing.supplier_name || 'Unknown') || [];
    const addressOfSupplier = recipe?.ingredients?.map(ing => ing.supplier_address || 'Unknown') || [];
    const countryOfOrigin = recipe?.ingredients?.map(ing => ing.country_of_origin || 'Unknown') || [];
    
    // Process batch codes, sell-by dates, and receiving dates
    const finalBatchCodes = [];
    const finalSellByDates = [];
    const finalReceivingDates = [];
    
    if (ingredientList.length > 0) {
      ingredientList.forEach((_, idx) => {
        // Use batch codes if available, or generate new ones
        const batchCode = batchCodes && batchCodes[idx] ? 
          batchCodes[idx] : 
          `BC-${Date.now()}-${idx}`;
        finalBatchCodes.push(batchCode);
        
        // Use sell-by dates if available, or generate new ones
        const sellByDate = sellByDates && sellByDates[idx] ? 
          sellByDates[idx] : 
          (() => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date.toISOString().split('T')[0];
          })();
        finalSellByDates.push(sellByDate);
        
        // Use receiving dates if available, or use today
        const receivingDate = receivingDates && receivingDates[idx] ? 
          receivingDates[idx] : 
          new Date().toISOString().split('T')[0];
        finalReceivingDates.push(receivingDate);
      });
    }
    
    // Create the audit data object
    const auditData = {
      id: Date.now(),
      uid: `${date}-${recipeCode}-${Date.now()}`,
      department: department,
      department_manager: managerName,
      food_handler_responsible: handlerName,
      packing_batch_code: ['test'], // Placeholder
      product_name: [recipe?.description || 'Unknown'],
      ingredient_list: ingredientList,
      supplier_name: supplierNames,
      address_of_supplier: addressOfSupplier,
      batch_code: finalBatchCodes,
      sell_by_date: finalSellByDates,
      receiving_date: finalReceivingDates,
      country_of_origin: countryOfOrigin,
      planned_qty: Number(plannedQty) || 0,
      actual_qty: Number(actualQty) || Number(plannedQty) || 0,
      notes: notes || '',
      quality_score: Number(qualityScore) || 1,
      deviations: deviations || ['none'],
      confirmation_timestamp: new Date().toISOString(),
      productDescription: recipe?.description || recipeCode,
      date: date,
      status: status,
      originalScheduleId: productionId,
    };
    
    return auditData;
  }, [department]);
  
  /**
   * Handle saving a time slot
   * @param {Object} data - Schedule data
   * @param {boolean} skipModal - Whether to skip opening the modal (for direct updates)
   * @returns {Promise<Object>} Saved schedule item
   */
  const handleSaveTimeSlot = useCallback(async (formData, skipModal = false) => {
    try {
      // Extract data from formData, handling both object formats
      let id, recipeCode, plannedQty, handlerName, startTime, endTime, date, notes, itemStatus;
      
      if (formData.id !== undefined) {
        // Standard format from modal
        ({
          id,
          recipeCode,
          plannedQty,
          handlerName,
          startTime,
          endTime,
          date,
          notes,
          itemStatus,
        } = formData);
      } else {
        // Format from direct update (drag-drop)
        id = formData.id;
        recipeCode = formData.recipeCode;
        plannedQty = formData.plannedQty;
        handlerName = formData.handlerName;
        startTime = formData.startTime;
        endTime = formData.endTime;
        date = formData.date;
        notes = formData.notes;
        itemStatus = formData.status || 'planned';
      }
      
      console.log('Saving time slot with data:', {
        id, recipeCode, plannedQty, handlerName, startTime, endTime, date, notes, itemStatus
      });

      // Find the recipe for this item
      const recipe = recipes.find(r => r.product_code === recipeCode);
      
      // Create a new item or update existing item with all required fields for chain of custody
      const newItem = {
        id: id || `${date}-${recipeCode}-${Date.now()}`,
        recipeCode,
        plannedQty: Number(plannedQty),
        handlerName,
        startTime,
        endTime,
        date,
        status: itemStatus || 'planned', // Ensure status always has a default value
        notes,
        productDescription: recipe?.description || recipeCode,
        changeHistory: [
          {
            timestamp: new Date().toISOString(),
            changedBy: id ? 'User' : 'System',
            changes: [
              {
                field: id ? 'updated' : 'created',
                oldValue: null,
                newValue: id ? 'updated item' : 'new item'
              }
            ]
          }
        ]
      };

      // Get the current schedule for the date
      let currentSchedule = schedules.find((s) => s.date === date);

      if (currentSchedule) {
        // Update existing schedule
        const updatedItems = id
          ? currentSchedule.items.map((item) => (item.id === id ? newItem : item))
          : [...currentSchedule.items, newItem];

        const updatedSchedule = { ...currentSchedule, items: updatedItems };

        // Update the schedules array
        const updatedSchedules = schedules.map((s) =>
          s.id === currentSchedule.id ? updatedSchedule : s
        );

        setSchedules(updatedSchedules);
        await saveSchedule(department, updatedSchedule);
        
        // Show success notification
        showNotification({
          message: id ? 'Schedule updated successfully' : 'Schedule created successfully',
          type: 'success',
        });
      } else {
        // Create a new schedule with all required fields
        const newSchedule = {
          id: `schedule-${date}`,
          date,
          department,
          managerName: department === '1152' ? 'Clive' : department === '1155' || department === '1154' ? 'Monica' : '',
          handlersNames: handlerName,
          items: [newItem],
        };

        setSchedules([...schedules, newSchedule]);
        await saveSchedule(department, newSchedule);
        
        // Show success notification
        showNotification({
          message: 'Schedule created successfully',
          type: 'success',
        });
      }
      
      // Update calendar events
      updateCalendarEvents();
      
      // Emit event for other components to react if bus exists
      if (typeof window.bus !== 'undefined') {
        window.bus.emit('schedule-updated', { date, item: newItem });
        window.bus.emit('data-updated', { type: 'schedule', date, item: newItem });
      }
      
      return newItem;
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, schedules, setSchedules, createAuditData]);
  
  /**
   * Get the start date of the week for a given date
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} Week start date in YYYY-MM-DD format
   */
  // eslint-disable-next-line no-unused-vars
  const getWeekStartDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };
  
  /**
   * Convert schedules to calendar events
   * @param {Array} schedules - Schedules array
   * @returns {Array} Calendar events
   */
  // Convert schedules to calendar events format
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const convertSchedulesToEvents = useCallback((schedules) => {
    if (!schedules || !schedules.length) return [];
    
    const events = [];
    
    schedules.forEach(schedule => {
      if (!schedule.items || !schedule.items.length) return;
      
      schedule.items.forEach((item, index) => {
        if (!item.date) return;
        
        // Skip items without a start time or end time if they're scheduled
        if (item.status === 'scheduled' && (!item.startTime || !item.endTime)) return;
        
        const date = new Date(item.date);
        const recipe = recipes.find(r => r.product_code === item.recipeCode);
        
        // For scheduled items with time slots
        if (item.status === 'scheduled' && item.startTime && item.endTime) {
          const [startHour, startMinute] = item.startTime.split(':').map(Number);
          const [endHour, endMinute] = item.endTime.split(':').map(Number);
          
          const start = new Date(date);
          start.setHours(startHour, startMinute, 0);
          
          const end = new Date(date);
          end.setHours(endHour, endMinute, 0);
          
          events.push({
            id: `${schedule.id}-${index}`,
            title: `${recipe?.description || item.recipeCode} (${item.plannedQty})`,
            start,
            end,
            backgroundColor: getStatusColor(item.status),
            borderColor: getStatusColor(item.status),
            textColor: '#ffffff',
            extendedProps: {
              scheduleId: schedule.id,
              itemIndex: index,
              item,
              recipe,
              status: item.status
            }
          });
        } else {
          // For planned or other items without specific time slots
          events.push({
            id: `${schedule.id}-${index}`,
            title: `${recipe?.description || item.recipeCode} (${item.plannedQty})`,
            start: date,
            allDay: true,
            backgroundColor: getStatusColor(item.status),
            borderColor: getStatusColor(item.status),
            textColor: '#ffffff',
            extendedProps: {
              scheduleId: schedule.id,
              itemIndex: index,
              item,
              recipe,
              status: item.status
            }
          });
        }
      });
    });
    
    return events;
  }, [recipes]);
  
  /**
   * Get color based on status
   * @param {string} status - Status string
   * @returns {string} Color hex code
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50'; // Green
      case 'scheduled':
        return '#ff9800'; // Orange
      case 'cancelled':
        return '#f44336'; // Red
      case 'planned':
      default:
        return '#2196f3'; // Blue
    }
  };
  
  /**
   * Update calendar events based on schedules
   */
  const updateCalendarEvents = useCallback(() => {
    const events = convertSchedulesToEvents(schedules);
    setCalendarEvents(events);
  }, [schedules, convertSchedulesToEvents]);

  /**
   * Delete a schedule item
   * @param {Object} schedule - The schedule containing the item
   * @param {Object} item - The item to delete
   * @param {number} itemIndex - The index of the item in the schedule
   * @returns {Promise<void>}
   */
  const handleDeleteScheduleItem = useCallback(async (schedule, item, itemIndex) => {
    try {
      // Handle the nested structure where schedule might have a "0" property
      const scheduleData = schedule["0"] || schedule;
      const scheduleId = scheduleData.id || schedule.id;
      
      // Find the schedule in the schedules array
      const scheduleIndex = schedules.findIndex(s => {
        const sData = s["0"] || s;
        return sData.id === scheduleId;
      });
      
      if (scheduleIndex === -1) {
        console.error(`Schedule with ID ${scheduleId} not found`);
        return;
      }
      
      // Create a deep copy of the schedule
      const updatedSchedule = JSON.parse(JSON.stringify(scheduleData));
      
      // Remove the item from the schedule
      updatedSchedule.items = updatedSchedule.items.filter((_, idx) => idx !== itemIndex);
      
      // If there are no more items, delete the entire schedule
      if (updatedSchedule.items.length === 0) {
        // Delete the schedule from the server
        await deleteSchedule(scheduleId);
        
        // Update the state
        const updatedSchedules = schedules.filter((_, idx) => idx !== scheduleIndex);
        setSchedules(updatedSchedules);
      } else {
        // Update the schedule on the server
        await saveSchedule(department, updatedSchedule);
        
        // Update the state
        const updatedSchedules = [...schedules];
        
        // If the schedule has a nested structure, update it properly
        if (schedule["0"]) {
          updatedSchedules[scheduleIndex] = { "0": updatedSchedule, id: scheduleId };
        } else {
          updatedSchedules[scheduleIndex] = updatedSchedule;
        }
        
        setSchedules(updatedSchedules);
      }
    } catch (error) {
      console.error('Failed to delete schedule item:', error);
      throw error;
    }
  }, [department, schedules, setSchedules]);
  
  /**
   * Handle direct update from drag-drop without opening modal
   * This function is specifically designed for drag-drop operations
   * @param {Object} info - Event info from FullCalendar
   * @returns {Promise<boolean>} Success status
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDirectUpdate = useCallback(async (info) => {
    try {
      const { event } = info;
      // Extract the item and other relevant information from extendedProps
      const { item, scheduleId } = event.extendedProps;
      
      // Create JavaScript Date objects for proper time handling
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : null;
      
      // Get the new date and time from the dropped event
      const newDate = startDate.toISOString().split('T')[0];
      
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
      console.log('Direct update - Extracted time from drag event:', {
        scheduleId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        rawStart: startDate,
        rawEnd: endDate
      });
      
      // Find the recipe for this item (for future use if needed)
      // eslint-disable-next-line no-unused-vars
      const recipe = recipes.find(r => r.product_code === item.recipeCode);
      
      // Create updated item with new date and time
      const updatedItem = {
        ...item,
        id: item.id, // Ensure we keep the same ID
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        recipeCode: item.recipeCode,
        plannedQty: item.plannedQty,
        handlerName: item.handlerName,
        status: item.status,
        notes: item.notes
      };
      
      // Save the updated item directly using the same pattern as in WeeklySchedulePage
      await handleSaveTimeSlot(updatedItem, true);
      
      return true;
    } catch (error) {
      console.error('Failed to directly update schedule:', error);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSaveTimeSlot, recipes]);

  return {
    selectedSchedule,
    setSelectedSchedule,
    selectedItem,
    setSelectedItem,
    currentEventInfo,
    setCurrentEventInfo,
    currentSlotInfo,
    setCurrentSlotInfo,
    calendarEvents,
    setCalendarEvents,
    handleSaveTimeSlot,
    handleDeleteScheduleItem,
    createAuditData,
    updateCalendarEvents,
    getStatusColor,
    handleDirectUpdate
  };
};

export default useScheduleManagement;
