import { useState, useCallback } from 'react';
import { saveSchedule, saveAudit } from '../services/api';

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
      const existingScheduleIndex = schedules.findIndex(s => 
        s.weekStartDate === getWeekStartDate(date)
      );
      
      let updatedSchedules;
      
      if (existingScheduleIndex >= 0) {
        // Update existing schedule
        const updatedSchedule = { ...schedules[existingScheduleIndex] };
        
        // Check if we're updating an existing item or adding a new one
        const existingItemIndex = updatedSchedule.items.findIndex(item => item.id === newItem.id);
        
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
        
        // Update the schedules array
        updatedSchedules = [
          ...schedules.slice(0, existingScheduleIndex),
          updatedSchedule,
          ...schedules.slice(existingScheduleIndex + 1)
        ];
      } else {
        // Create a new schedule
        const newSchedule = {
          id: Date.now(),
          department,
          weekStartDate: getWeekStartDate(date),
          managerName: '',
          items: [newItem]
        };
        
        // Add the new schedule to the array
        updatedSchedules = [...schedules, newSchedule];
      }
      
      // Save the updated schedules
      await saveSchedule(department, updatedSchedules);
      
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
  }, [department, recipes, schedules, setSchedules]);
  
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
      actualQty: Number(actualQty) || Number(plannedQty) || 0,
      qualityScore: Number(qualityScore) || 1,
      confirmationTimestamp: new Date().toISOString()
    };
    
    return auditData;
  }, [department]);
  
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
    createAuditData,
    updateCalendarEvents,
    getStatusColor
  };
};

export default useScheduleManagement;
