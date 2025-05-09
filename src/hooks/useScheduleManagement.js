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
   * Save a time slot schedule
   * @param {Object} data - Schedule data to save
   */
  const handleSaveTimeSlot = useCallback(async (data) => {
    try {
      const { recipeCode, plannedQty, handlerName, date, startTime, endTime, status, id, notes } = data;
      
      // Find the recipe for this item
      const recipe = recipes.find(r => r.product_code === recipeCode);
      
      // Create a new schedule item
      const newItem = {
        id: id || `${date}-${recipeCode}-${Date.now()}`,
        recipeCode,
        plannedQty: Number(plannedQty),
        handlerName,
        startTime,
        endTime,
        date,
        status,
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
      
      // Check if we're updating an existing schedule or creating a new one
      const existingScheduleIndex = schedules.findIndex(s => {
        // Handle the nested structure where schedule might have a "0" property
        const scheduleData = s["0"] || s;
        return scheduleData.weekStartDate === getWeekStartDate(date);
      });
      
      let updatedSchedules;
      let scheduleToSave;
      
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
        
        // Prepare the schedule to save
        scheduleToSave = updatedSchedule;
        
        // Update the schedules array
        updatedSchedules = [...schedules];
        
        // If the schedule has a nested structure, update it properly
        if (existingSchedule["0"]) {
          updatedSchedules[existingScheduleIndex] = { "0": updatedSchedule, id: existingSchedule.id };
        } else {
          updatedSchedules[existingScheduleIndex] = updatedSchedule;
        }
      } else {
        // Create a new schedule
        const newSchedule = {
          id: Date.now(),
          department,
          weekStartDate: getWeekStartDate(date),
          managerName: '',
          items: [newItem]
        };
        
        // Prepare the schedule to save
        scheduleToSave = newSchedule;
        
        // Add the new schedule to the array
        updatedSchedules = [...schedules, { "0": newSchedule, id: newSchedule.id }];
      }
      
      // Save the updated schedule to the server
      await saveSchedule(department, scheduleToSave);
      
      // Update the state
      setSchedules(updatedSchedules);
      
      // If this is a completion, create an audit record
      if (status === 'completed') {
        const auditData = createAuditData(data, recipe);
        await saveAudit(department, auditData);
      }
      
      return newItem;
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  }, [department, recipes, schedules, setSchedules, createAuditData]);
  
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
   * Convert schedules to calendar events
   * @param {Array} schedules - Schedules array
   * @returns {Array} Calendar events
   */
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
    getStatusColor
  };
};

export default useScheduleManagement;
