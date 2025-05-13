import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductionCalendar from './ProductionCalendar';
import UnifiedScheduleModal from '../../UnifiedScheduleModal';
import { useSchedules, useSaveSchedule, useDeleteSchedule } from '../../../hooks/useScheduleData';
import { useSaveAuditRecords, useDeleteAuditRecords, prepareAuditEntries } from '../../../hooks/useAuditService';
import { mapSchedulesToEvents, mapSelectToModalProps, mapEventToModalProps } from '../../../hooks/useCalendarMapping';
import useNotifications from '../../../hooks/useNotifications';
import { bus } from '../../../utils/eventBus';

const ProductionCalendarContainer = () => {
  const { department } = useParams();
  const { data: schedules = [] } = useSchedules(department);
  const saveSchedule = useSaveSchedule();
  const deleteSchedule = useDeleteSchedule();
  const saveAudit = useSaveAuditRecords();
  const deleteAudit = useDeleteAuditRecords();
  const { showSuccess, showError } = useNotifications();
  const calendarRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('timeslot');
  const [modalInitial, setModalInitial] = useState({});

  const events = mapSchedulesToEvents(schedules);

  const handleSelect = (selectInfo) => {
    const { mode, initialSlot } = mapSelectToModalProps(selectInfo);
    setModalMode(mode);
    setModalInitial(initialSlot);
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const { mode, initialEvent } = mapEventToModalProps(clickInfo, []);
    setModalMode(mode);
    setModalInitial(initialEvent);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      // Save or update schedule
      await saveSchedule.mutateAsync({ department, schedule: data.schedule });
      // Prepare and save audit records if provided
      if (data.auditItems) {
        const records = prepareAuditEntries(data.auditItems, data.context);
        await saveAudit.mutateAsync({ department, records });
      }
      showSuccess('Schedule saved');
      setModalOpen(false);
      bus.emit('schedule-updated', data.schedule);
    } catch (e) {
      console.error(e);
      showError('Failed to save schedule');
    }
  };

  const handleDelete = async ({ id, filterFn }) => {
    try {
      await deleteSchedule.mutateAsync({ department, id });
      await deleteAudit.mutateAsync({ department, filterFn });
      showSuccess('Deleted successfully');
      bus.emit('scheduleDeleted', id);
    } catch (e) {
      console.error(e);
      showError('Failed to delete');
    }
  };

  return (
    <>
      <ProductionCalendar
        ref={calendarRef}
        calendarEvents={events}
        onSelect={handleSelect}
        onEventClick={handleEventClick}
        // onEventDrop, onDateClick can be added similarly
      />

      <UnifiedScheduleModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        {...modalInitial}
      />
    </>
  );
};

export default ProductionCalendarContainer;
