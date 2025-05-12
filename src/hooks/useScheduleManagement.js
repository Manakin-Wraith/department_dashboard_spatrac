import { useState, useCallback } from 'react';
import { saveSchedule, saveAudit, deleteSchedule } from '../services/api';
import { 
  SCHEDULE_STATUS, 
  normalizeStatus, 
  isValidStatusTransition, 
  getStatusColor as getStatusColorUtil,
  createStatusChangeHistoryEntry
} from '../utils/statusUtils';

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
  
  // Helper function for logging status messages
  const logStatus = useCallback((message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // In a real app, this would show a toast or notification UI
    // but for now we'll just log to console
  }, []);
  
  /**
   * Create audit data from schedule item
   * @param {Object} data - Schedule item data
   * @param {Object} recipe - Recipe data
   * @returns {Object} Audit data
   */
  const createAuditData = useCallback((data, recipe) => {
    const { 
      recipeCode, plannedQty, handlerName, date, actualQty, 
      qualityScore, notes, deviations, batchCodes, sellByDates, 
      receivingDates, managerName, id: productionId 
    } = data;
    
    // Get ingredient information from the recipe
    const ingredientList = recipe?.ingredients?.map(ing => ing.description) || [];
    const supplierNames = recipe?.ingredients?.map(ing => ing.supplier_name || 'Unknown') || [];
    const addressOfSupplier = recipe?.ingredients?.map(ing => ing.supplier_address || 'Unknown') || [];
    const countryOfOrigin = recipe?.ingredients?.map(ing => ing.country_of_origin || 'Unknown') || [];
    
    // Create batch codes for each ingredient if not provided
    const ingredientBatchCodes = recipe?.ingredients?.map((_, i) => 
      `BATCH-${recipeCode}-${i+1}-${Date.now().toString().slice(-6)}`) || [];
    
    // Create audit data structure that matches the required format
    return {
      uid: `${date}-${recipeCode}-${Date.now()}`,
      department,
      department_manager: managerName,
      food_handler_responsible: handlerName,
      packing_batch_code: batchCodes || [`PKG-${recipeCode}-${Date.now().toString().slice(-6)}`],
      product_name: [recipe?.description || recipeCode],
      ingredient_list: ingredientList,
      supplier_name: supplierNames,
      address_of_supplier: addressOfSupplier,
      batch_code: ingredientBatchCodes,
      sell_by_date: sellByDates || recipe?.ingredients?.map(() => '') || [],
      receiving_date: receivingDates || recipe?.ingredients?.map(() => '') || [],
      country_of_origin: countryOfOrigin,
      planned_qty: Number(plannedQty) || 0,
      actual_qty: Number(actualQty) || Number(plannedQty) || 0,
      notes: notes || '',
      quality_score: Number(qualityScore) || 5,
      deviations: deviations || [],
      confirmation_timestamp: new Date().toISOString(),
      productDescription: recipe?.description,
      date,
      production_id: productionId
    };
  }, [department]);
  
  /**
   * Handle saving a time slot
   * @param {Object} formData - Form data
   * @param {boolean} skipModal - Whether to skip the modal
   * @returns {Promise<Object>} Saved item
   */
  const handleSaveTimeSlot = useCallback(async (formData, skipModal = false) => {
    try {
      // Extract data from formData, handling both object formats
      let id, recipeCode, plannedQty, handlerName, startTime, endTime, date, notes, status;
      
      // Normalize the data format regardless of source
      if (formData.id) {
        id = formData.id;
        recipeCode = formData.recipeCode;
        plannedQty = formData.plannedQty;
        handlerName = formData.handlerName;
        startTime = formData.startTime;
        endTime = formData.endTime;
        date = formData.date;
        notes = formData.notes;
        status = normalizeStatus(formData.status || SCHEDULE_STATUS.SCHEDULED);
      } else {
        // Handle the case where data is spread across multiple fields
        id = formData.itemId;
        recipeCode = formData.recipeCode;
        plannedQty = formData.qty;
        handlerName = formData.handlerName;
        startTime = formData.startTime;
        endTime = formData.endTime;
        date = formData.date;
        notes = formData.notes;
        status = normalizeStatus(formData.status || SCHEDULE_STATUS.SCHEDULED);
      }
      
      // Generate ID if not provided
      const itemId = id || `${date}-${recipeCode}-${Date.now()}`;
      
      // Find the recipe
      const recipe = recipes.find(r => r.product_code === recipeCode);
      
      // Create the item object
      const item = {
        id: itemId,
        recipeCode,
        plannedQty: Number(plannedQty) || 1,
        handlerName,
        startTime,
        endTime,
        date,
        status,
        notes,
        productDescription: recipe?.description,
        // Add change history if not already present
        changeHistory: formData.changeHistory || [{
          timestamp: new Date().toISOString(),
          changedBy: 'Current User', // In a real app, get from auth context
          changes: [
            {
              field: 'created',
              oldValue: null,
              newValue: 'new item'
            }
          ]
        }]
      };
      
      // Find existing schedule for this date
      let schedule = schedules.find(s => s.weekStartDate === date);
      let savedSchedule;
      
      // Handle completed items (move to audit)
      if (status === SCHEDULE_STATUS.COMPLETED) {
        try {
          // Create audit data
          const auditData = createAuditData(item, recipe);
          
          // Save audit record
          await saveAudit(auditData);
          
          // Remove the item from the schedule if it exists
          if (schedule) {
            // Filter out the completed item
            schedule = {
              ...schedule,
              items: schedule.items.filter(i => i.id !== itemId)
            };
            
            // Save the updated schedule with the item removed
            savedSchedule = await saveSchedule(department, schedule);
            setSchedules(prevSchedules =>
              prevSchedules.map(s => s.id === savedSchedule.id ? savedSchedule : s)
            );
          }
          
          logStatus(`Production completed and moved to audit`, 'success');
          return item;
        } catch (error) {
          logStatus(`Failed to create audit record: ${error.message}`, 'error');
          console.error('Failed to create audit record:', error);
          return null;
        }
      } else {
        // Handle regular schedule updates (not completed items)
        try {
          if (!schedule) {
            // Create new schedule
            schedule = {
              id: `${department}-${date}`,
              department,
              weekStartDate: date,
              managerName: formData.managerName || '',
              handlersNames: handlerName || formData.handlersNames || '',
              items: [item]
            };
          } else {
            // Check if the item already exists in the schedule
            const existingItemIndex = schedule.items.findIndex(i => i.id === itemId);
            
            if (existingItemIndex >= 0) {
              // Update existing item
              schedule.items[existingItemIndex] = {
                ...schedule.items[existingItemIndex],
                ...item
              };
            } else {
              // Add new item
              schedule.items.push(item);
            }
          }
          
          // Save the schedule
          try {
            savedSchedule = await saveSchedule(department, schedule);
            
            // Update the schedules state
            setSchedules(prevSchedules => {
              const scheduleIndex = prevSchedules.findIndex(s => s.id === savedSchedule.id);
              if (scheduleIndex >= 0) {
                // Update existing schedule
                return prevSchedules.map(s => s.id === savedSchedule.id ? savedSchedule : s);
              } else {
                // Add new schedule
                return [...prevSchedules, savedSchedule];
              }
            });
            
            logStatus(`Schedule saved successfully`, 'success');
            return item;
          } catch (error) {
            logStatus(`Failed to save schedule: ${error.message}`, 'error');
            console.error('Failed to save schedule:', error);
            return null;
          }
        } catch (error) {
          logStatus(`Error handling regular schedule update: ${error.message}`, 'error');
          console.error('Error handling regular schedule update:', error);
          return null;
        }
      }
    } catch (error) {
      logStatus(`Error in handleSaveTimeSlot: ${error.message}`, 'error');
      console.error('Error in handleSaveTimeSlot:', error);
      return null;
    }
  }, [department, schedules, recipes, setSchedules, createAuditData, logStatus]);

  /**
   * Create a new schedule item
   * @param {Object} scheduleData - Schedule data
   * @param {Object} itemData - Item data
   */
  const createScheduleItem = useCallback(async (scheduleData, itemData) => {
    try {
      // Ensure the item has a valid status
      if (!itemData.status) {
        itemData.status = SCHEDULE_STATUS.SCHEDULED;
      } else {
        // Normalize any legacy status values
        itemData.status = normalizeStatus(itemData.status);
      }
      
      // Ensure change history is initialized
      if (!itemData.changeHistory) {
        itemData.changeHistory = [{
          timestamp: new Date().toISOString(),
          changedBy: 'Current User', // In a real app, get from auth context
          changes: [
            {
              field: 'created',
              oldValue: null,
              newValue: 'new item'
            }
          ]
        }];
      }
      
      // Check if schedule exists
      let scheduleIndex = schedules.findIndex(s => s.id === scheduleData.id);
      let updatedSchedule;
      
      if (scheduleIndex === -1) {
        // Create new schedule
        updatedSchedule = {
          ...scheduleData,
          items: [itemData]
        };
        
        // Save to API
        const savedSchedule = await saveSchedule(updatedSchedule);
        
        // Update local state
        setSchedules(prev => [...prev, savedSchedule]);
        logStatus(`Created new schedule for ${scheduleData.weekStartDate}`, 'success');
      } else {
        // Add item to existing schedule
        updatedSchedule = {
          ...schedules[scheduleIndex],
          ...scheduleData,
          items: [...schedules[scheduleIndex].items, itemData]
        };
        
        // Save to API
        await saveSchedule(updatedSchedule);
        
        // Update local state
        const updatedSchedules = [...schedules];
        updatedSchedules[scheduleIndex] = updatedSchedule;
        setSchedules(updatedSchedules);
        logStatus(`Added item to schedule for ${scheduleData.weekStartDate}`, 'success');
      }
      
      return updatedSchedule;
    } catch (error) {
      logStatus(`Error creating schedule item: ${error.message}`, 'error');
      console.error('Error creating schedule item:', error);
      return null;
    }
  }, [schedules, setSchedules, logStatus]);

  /**
   * Update a schedule item
   * @param {Object} scheduleData - Schedule data
   * @param {Object} itemData - Item data
   */
  const updateScheduleItem = useCallback(async (scheduleData, itemData) => {
    try {
      // Find the schedule to update
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleData.id);
      
      if (scheduleIndex === -1) {
        logStatus(`Schedule with ID ${scheduleData.id} not found`, 'error');
        return null;
      }
      
      // Find the item to update
      const itemIndex = schedules[scheduleIndex].items.findIndex(i => i.id === itemData.id);
      
      if (itemIndex === -1) {
        logStatus(`Item with ID ${itemData.id} not found in schedule ${scheduleData.id}`, 'error');
        return null;
      }
      
      // Get the current item
      const currentItem = schedules[scheduleIndex].items[itemIndex];
      
      // If status is changing, validate the transition
      if (itemData.status && itemData.status !== currentItem.status) {
        // Normalize status values
        const normalizedCurrentStatus = normalizeStatus(currentItem.status);
        const normalizedNewStatus = normalizeStatus(itemData.status);
        
        // Only proceed if the transition is valid
        if (!isValidStatusTransition(normalizedCurrentStatus, normalizedNewStatus)) {
          logStatus(`Invalid status transition from ${normalizedCurrentStatus} to ${normalizedNewStatus}`, 'error');
          return null;
        }
        
        // Add status change to history
        if (!itemData.changeHistory) {
          itemData.changeHistory = [...(currentItem.changeHistory || [])];
        }
        
        itemData.changeHistory.push(
          createStatusChangeHistoryEntry(
            normalizedCurrentStatus,
            normalizedNewStatus,
            'Current User' // In a real app, get from auth context
          )
        );
      }
      
      // Create updated schedule
      const updatedSchedule = {
        ...schedules[scheduleIndex],
        ...scheduleData,
        items: [...schedules[scheduleIndex].items]
      };
      
      // Update the specific item
      updatedSchedule.items[itemIndex] = {
        ...updatedSchedule.items[itemIndex],
        ...itemData
      };
      
      // Save to API
      await saveSchedule(updatedSchedule);
      
      // Update local state
      const updatedSchedules = [...schedules];
      updatedSchedules[scheduleIndex] = updatedSchedule;
      setSchedules(updatedSchedules);
      
      logStatus(`Updated schedule item ${itemData.id}`, 'success');
      return updatedSchedule;
    } catch (error) {
      logStatus(`Error updating schedule item: ${error.message}`, 'error');
      console.error('Error updating schedule item:', error);
      return null;
    }
  }, [schedules, setSchedules, logStatus]);

  /**
   * Delete a schedule item
   * @param {Object} scheduleData - Schedule data
   * @param {Object} itemData - Item data
   */
  const deleteScheduleItem = useCallback(async (scheduleData, itemData) => {
    try {
      // Find the schedule to update
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleData.id);
      
      if (scheduleIndex === -1) {
        logStatus(`Schedule with ID ${scheduleData.id} not found`, 'error');
        return null;
      }
      
      // Create updated schedule with the item removed
      const updatedSchedule = {
        ...schedules[scheduleIndex],
        items: schedules[scheduleIndex].items.filter(i => i.id !== itemData.id)
      };
      
      // If there are no more items, delete the entire schedule
      if (updatedSchedule.items.length === 0) {
        // Delete the schedule from the API
        await deleteSchedule(updatedSchedule.id);
        
        // Update local state
        const updatedSchedules = schedules.filter((_, i) => i !== scheduleIndex);
        setSchedules(updatedSchedules);
        logStatus(`Deleted empty schedule ${updatedSchedule.id}`, 'success');
      } else {
        // Save the updated schedule to the API
        await saveSchedule(updatedSchedule);
        
        // Update local state
        const updatedSchedules = [...schedules];
        updatedSchedules[scheduleIndex] = updatedSchedule;
        setSchedules(updatedSchedules);
        logStatus(`Removed item ${itemData.id} from schedule`, 'success');
      }
      
      return true;
    } catch (error) {
      logStatus(`Error deleting schedule item: ${error.message}`, 'error');
      console.error('Error deleting schedule item:', error);
      return null;
    }
  }, [schedules, setSchedules, logStatus]);

  /**
   * Confirm a production item (mark as completed)
   * @param {Object} scheduleItem - Schedule item to confirm
   * @param {Object} confirmData - Confirmation data
   */
  const confirmProduction = useCallback(async (scheduleItem, confirmData) => {
    try {
      // Find the schedule containing this item
      const scheduleIndex = schedules.findIndex(s => 
        s.items.some(item => item.id === scheduleItem.id)
      );
      
      if (scheduleIndex === -1) {
        logStatus(`Schedule containing item ${scheduleItem.id} not found`, 'error');
        return null;
      }
      
      // Find the item index
      const itemIndex = schedules[scheduleIndex].items.findIndex(
        item => item.id === scheduleItem.id
      );
      
      // Get the current status and normalize it
      const currentStatus = normalizeStatus(schedules[scheduleIndex].items[itemIndex].status);
      const newStatus = SCHEDULE_STATUS.COMPLETED;
      
      // Validate the status transition
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        logStatus(`Cannot confirm item with status ${currentStatus}`, 'error');
        return null;
      }
      
      // Create updated schedule
      const updatedSchedule = { ...schedules[scheduleIndex] };
      updatedSchedule.items = [...updatedSchedule.items];
      
      // Update the item with confirmation data
      updatedSchedule.items[itemIndex] = {
        ...updatedSchedule.items[itemIndex],
        status: newStatus,
        ...confirmData,
        confirmationTimestamp: new Date().toISOString()
      };
      
      // Add to change history
      if (!updatedSchedule.items[itemIndex].changeHistory) {
        updatedSchedule.items[itemIndex].changeHistory = [];
      }
      
      updatedSchedule.items[itemIndex].changeHistory.push({
        timestamp: new Date().toISOString(),
        changedBy: 'Current User', // In a real app, get from auth context
        changes: [
          {
            field: 'status',
            oldValue: currentStatus,
            newValue: newStatus
          },
          {
            field: 'actualQty',
            oldValue: scheduleItem.actualQty,
            newValue: confirmData.actualQty
          }
        ]
      });
      
      // Save to API
      await saveSchedule(updatedSchedule);
      
      // Create audit record
      const auditData = createAuditData(updatedSchedule.items[itemIndex], 
        recipes.find(r => r.code === updatedSchedule.items[itemIndex].recipeCode));
      
      await saveAudit(auditData);
      
      // Update local state
      const updatedSchedules = [...schedules];
      updatedSchedules[scheduleIndex] = updatedSchedule;
      setSchedules(updatedSchedules);
      
      logStatus(`Confirmed production for ${scheduleItem.id}`, 'success');
      return updatedSchedule;
    } catch (error) {
      logStatus(`Error confirming production: ${error.message}`, 'error');
      console.error('Error confirming production:', error);
      return null;
    }
  }, [schedules, setSchedules, recipes, logStatus, createAuditData]);

  /**
   * Get color based on status
   * @param {string} status - Status string
   * @returns {string} Color hex code
   */
  const getStatusColor = useCallback((status) => {
    // Use the centralized status color utility
    return getStatusColorUtil(status);
  }, []);

  // Convert schedules to calendar events format
  const convertSchedulesToEvents = useCallback((schedules) => {
    if (!schedules || !schedules.length) return [];
    
    const events = [];
    
    schedules.forEach(schedule => {
      if (!schedule.items || !schedule.items.length) return;
      
      schedule.items.forEach((item, index) => {
        if (!item.date) return;
        
        // Skip items without a start time or end time if they're scheduled
        if (item.status === SCHEDULE_STATUS.SCHEDULED && (!item.startTime || !item.endTime)) return;
        
        const date = new Date(item.date);
        const recipe = recipes.find(r => r.product_code === item.recipeCode);
        
        // For scheduled items with time slots
        if (item.status === SCHEDULE_STATUS.SCHEDULED && item.startTime && item.endTime) {
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
          // For items without specific time slots
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
  }, [recipes, getStatusColor]);

  /**
   * Update calendar events based on schedules
   */
  const updateCalendarEvents = useCallback(() => {
    const events = convertSchedulesToEvents(schedules);
    setCalendarEvents(events);
  }, [schedules, convertSchedulesToEvents]);

  // This section was moved up before updateCalendarEvents

  /**
   * Handle direct update from drag-drop without opening modal
   * @param {Object} info - Event info from FullCalendar
   * @returns {Promise<boolean>} Success status
   */
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
      
      // Find the recipe for this item (used in change history)
      // eslint-disable-next-line no-unused-vars
      const recipe = recipes.find(r => r.product_code === item.recipeCode);
      
      // Create a timestamp for all changes
      const timestamp = new Date().toISOString();
      
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
        notes: item.notes,
        // Add a change history entry for the time/date change
        changeHistory: [
          ...(item.changeHistory || []),
          {
            timestamp: timestamp,
            changedBy: 'User (Drag & Drop)',
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
      
      // Find the schedule that contains this item
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) {
        console.error(`Schedule with ID ${scheduleId} not found`);
        return false;
      }
      
      // Create a copy of the schedule with the updated item
      const updatedSchedule = {
        ...schedule,
        items: schedule.items.map(i => i.id === updatedItem.id ? updatedItem : i)
      };
      
      // Update the local state immediately for a responsive UI
      setSchedules(prevSchedules => 
        prevSchedules.map(s => s.id === scheduleId ? updatedSchedule : s)
      );
      
      // Save the updated item to the mock data
      try {
        await saveSchedule(department, updatedSchedule);
        
        logStatus('Successfully updated schedule with drag-drop operation', 'success');
        return true;
      } catch (error) {
        logStatus(`Failed to save schedule after drag-drop: ${error.message}`, 'error');
        console.error('Failed to save schedule after drag-drop:', error);
        // Revert the local state update if the save failed
        setSchedules(prevSchedules => 
          prevSchedules.map(s => s.id === scheduleId ? schedule : s)
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to directly update schedule:', error);
      return false;
    }
  }, [schedules, department, recipes, logStatus, setSchedules]);

  return {
    // State
    selectedSchedule,
    setSelectedSchedule,
    selectedItem,
    setSelectedItem,
    currentEventInfo,
    setCurrentEventInfo,
    currentSlotInfo,
    setCurrentSlotInfo,
    calendarEvents,
    
    // Functions
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    confirmProduction,
    updateCalendarEvents,
    getStatusColor,
    handleSaveTimeSlot,
    handleDirectUpdate,
    
    // Status utilities
    normalizeStatus,
    isValidStatusTransition,
  };
};

export default useScheduleManagement;
