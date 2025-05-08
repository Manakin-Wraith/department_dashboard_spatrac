import React, { useEffect, useCallback, forwardRef } from 'react';
import { Box } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

/**
 * Production Calendar component for visualizing and managing production schedules
 */
const ProductionCalendar = forwardRef((
  {
    calendarEvents,
    onDateClick,
    onEventClick,
    onEventDrop,
    onSelect
  }, 
  ref
) => {

  /**
   * Render custom content for calendar events
   */
  const renderEventContent = useCallback((eventInfo) => {
    const { item, status } = eventInfo.event.extendedProps;
    
    return (
      <Box sx={{ 
        p: 0.5, 
        fontSize: '0.85rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%'
      }}>
        <div style={{ fontWeight: 'bold' }}>{eventInfo.event.title}</div>
        {item?.handlerName && (
          <div style={{ fontSize: '0.75rem' }}>Handler: {item.handlerName}</div>
        )}
        {status && (
          <div style={{ 
            fontSize: '0.7rem', 
            fontStyle: 'italic',
            textTransform: 'capitalize' 
          }}>
            Status: {status}
          </div>
        )}
      </Box>
    );
  }, []);

  // Update calendar when events change
  useEffect(() => {
    if (ref && ref.current) {
      const calendarApi = ref.current.getApi();
      
      // Remove existing events
      const eventSources = calendarApi.getEventSources();
      if (eventSources.length > 0) {
        eventSources[0].remove();
      }
      
      // Add updated events
      calendarApi.addEventSource(calendarEvents);
    }
  }, [calendarEvents, ref]);

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        eventContent={renderEventContent}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        select={onSelect}
        allDaySlot={true}
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }}
      />
    </Box>
  );
});

export default ProductionCalendar;
