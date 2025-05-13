import { useState, useCallback } from 'react';
import { saveSchedule, saveAudit, deleteSchedule } from '../services/api';

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
   * Convert schedules to calendar events
   * @param {Array} scheduleList - List of schedules
   * @returns {Array} Calendar events
   */
  const convertSchedulesToEvents = useCallback((scheduleList) => {
    return scheduleList.flatMap(schedule => {
      // Handle the nested structure where schedule might have a "0" property
      const scheduleData = schedule["0"] || schedule;
      const { id: scheduleId, items = [], weekStartDate } = scheduleData;
      
      return items.map((item, index) => {
        const recipe = recipes.find(r => r.product_code === item.recipeCode) || {};
        const baseDate = item.date || weekStartDate;
        let itemStartTime = `${baseDate}T${item.startTime || '09:00'}:00`;
        let itemEndTime = `${baseDate}T${item.endTime || '17:00'}:00`;
        
        return {
          id: item.id || `${scheduleId}-${index}`,
          title: `${recipe.description || item.recipeCode} (${item.plannedQty})`,
          start: itemStartTime,
          end: itemEndTime,
          allDay: false,
          extendedProps: {
            scheduleId,
            itemIndex: index,
            item,
            status: item.status,
            recipe
          }
        };
      });
    });
  }, [recipes]);
  
  /**
   * Update calendar events based on schedules
   */
  const updateCalendarEvents = useCallback(() => {
    const events = convertSchedulesToEvents(schedules);
    setCalendarEvents(events);
  }, [schedules, convertSchedulesToEvents]);
  
  // These functions were moved up before handleSaveTimeSlot to fix the ESLint warning
  
  /**
   * Handle saving a time slot
   * @param {Object} data - Schedule data
   * @param {boolean} skipModal - Whether to skip opening the modal (for direct updates)
   * @returns {Promise<Object>} Saved schedule item
   */
  const handleSaveTimeSlot = useCallback(async (data, skipModal = false) => {
    try {
      const { recipeCode, plannedQty, handlerName, date, startTime, endTime, status, id, notes, managerName: dataManagerName } = data;
      
      // Find the recipe for this item
      const recipe = recipes.find(r => r.product_code === recipeCode);
      
      // Ensure the item has a status (default to 'planned' if not set)
      const itemStatus = status || 'planned';
      
      // Create a new schedule item
      const newItem = {
        id: id || `${date}-${recipeCode}-${Date.now()}`,
        recipeCode,
        plannedQty: Number(plannedQty),
        handlerName,
        startTime,
        endTime,
        date,
        status: itemStatus,
        notes,
        productDescription: recipe?.description || recipeCode,
        changeHistory: [
          {
            timestamp: new Date().toISOString(),
            changedBy: 'Current User',
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
      
      // Get the week start date for this schedule
      const weekStartDate = getWeekStartDate(date);
      
      // Check if we're updating an existing schedule or creating a new one
      const existingScheduleIndex = schedules.findIndex(s => {
        // Handle the nested structure where schedule might have a "0" property
        const scheduleData = s["0"] || s;
        return scheduleData.weekStartDate === weekStartDate;
      });
      
      let saved;
      
      if (existingScheduleIndex >= 0) {
        // Get the existing schedule, handling the nested structure
        const existingSchedule = schedules[existingScheduleIndex];
        const scheduleData = existingSchedule["0"] || existingSchedule;
        
        // Create a deep copy of the schedule
        const updatedSchedule = JSON.parse(JSON.stringify(scheduleData));
        
        // Check if we're updating an existing item or adding a new one
        const existingItemIndex = updatedSchedule.items ? 
          updatedSchedule.items.findIndex(item => item.id === newItem.id) : -1;
        
        if (!updatedSchedule.items) {
          updatedSchedule.items = [];
        }
        
        if (existingItemIndex >= 0) {
          // Update existing item
          updatedSchedule.items[existingItemIndex] = {
            ...updatedSchedule.items[existingItemIndex],
            ...newItem,
            changeHistory: [
              ...newItem.changeHistory,
              ...(updatedSchedule.items[existingItemIndex].changeHistory || [])
            ]
          };
        } else {
          // Add new item to existing schedule
          updatedSchedule.items.push(newItem);
        }
        
        // Update existing schedule via PUT
        // Get all unique handler names from items, including the new one
        const allHandlers = updatedSchedule.items
          .map(item => item.handlerName)
          .filter(Boolean);
        
        // Add the new handler if it's not already in the list
        if (handlerName && !allHandlers.includes(handlerName)) {
          allHandlers.push(handlerName);
        }
        
        // If we have existing handlers in scheduleData.handlersNames, parse them and merge
        let existingHandlers = [];
        if (scheduleData.handlersNames) {
          existingHandlers = scheduleData.handlersNames.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        // Combine all handlers and remove duplicates
        const uniqueHandlers = [...new Set([...existingHandlers, ...allHandlers])].filter(Boolean);
        
        const schedule = {
          id: scheduleData.id,
          department,
          weekStartDate,
          managerName: dataManagerName || scheduleData.managerName || '',
          handlersNames: uniqueHandlers.join(', '),
          items: updatedSchedule.items
        };
        
        // Save to database
        saved = await saveSchedule(department, schedule);
        console.log('Updated schedule in database:', saved);
        
        // Update local state immediately for responsive UI
        setSchedules(prevSchedules => {
          return prevSchedules.map(s => {
            const schedId = s["0"] ? s["0"].id : s.id;
            return schedId === schedule.id ? saved : s;
          });
        });
      } else {
        // Create a new schedule via POST
        const schedule = {
          department,
          weekStartDate,
          managerName: dataManagerName || '',
          handlersNames: handlerName || '',
          items: [newItem]
        };
        
        // Save to database
        saved = await saveSchedule(department, schedule);
        console.log('Created new schedule in database:', saved);
        
        // Update local state immediately for responsive UI
        setSchedules(prevSchedules => [...prevSchedules, saved]);
      }
      
      // If this is a completion, create an audit record
      if (itemStatus === 'completed') {
        const auditData = createAuditData(data, recipe);
        await saveAudit(department, auditData);
      }
      
      // Emit event for other components to react
      if (typeof window.bus !== 'undefined') {
        window.bus.emit('schedule-updated', saved);
        window.bus.emit('data-updated', { type: 'schedule', data: saved });
      }
      
      // Update calendar events
      updateCalendarEvents();
      
      return newItem;
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  }, [department, recipes, schedules, setSchedules, createAuditData, updateCalendarEvents]);
  
  /**
   * Get the start date of the week for a given date
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} Week start date in YYYY-MM-DD format
   */
  const getWeekStartDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };
  
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
  
  // Functions moved up to fix ESLint warnings

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
  const handleDirectUpdate = useCallback(async (info) => {
    try {
      const { event } = info;
      // Extract the item and other relevant information from extendedProps
      const { item, scheduleId } = event.extendedProps;
      
      // Get the new date and time from the dropped event
      const newDate = event.start.toISOString().split('T')[0];
      
      // Format start time properly as HH:MM
      const startHours = event.start.getHours().toString().padStart(2, '0');
      const startMinutes = event.start.getMinutes().toString().padStart(2, '0');
      const newStartTime = `${startHours}:${startMinutes}`;
      
      // Format end time properly as HH:MM if end exists
      let newEndTime = '';
      if (event.end) {
        const endHours = event.end.getHours().toString().padStart(2, '0');
        const endMinutes = event.end.getMinutes().toString().padStart(2, '0');
        newEndTime = `${endHours}:${endMinutes}`;
      }
      
      // Log the extracted time information for debugging
      console.log('Direct update - Extracted time from drag event:', {
        scheduleId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime
      });
      
      // Find the recipe for this item
      const recipe = recipes.find(r => r.product_code === item.recipeCode);
      
      // Create updated item with new date and time
      const updatedItem = {
        ...item,
        id: item.id, // Ensure we keep the same ID
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        productDescription: recipe?.description || item.recipeCode,
        // Add a change history entry for this drag-drop operation
        changeHistory: [
          ...(item.changeHistory || []),
          {
            timestamp: new Date().toISOString(),
            changedBy: 'Current User',
            changes: [
              {
                field: 'time',
                oldValue: `${item.date} ${item.startTime}-${item.endTime}`,
                newValue: `${newDate} ${newStartTime}-${newEndTime}`
              }
            ]
          }
        ]
      };
      
      // Save the updated item directly using the same pattern as in WeeklySchedulePage
      await handleSaveTimeSlot(updatedItem, true);
      
      return true;
    } catch (error) {
      console.error('Failed to directly update schedule:', error);
      return false;
    }
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
