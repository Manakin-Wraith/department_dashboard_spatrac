import { format } from 'date-fns';

/**
 * Map schedule objects to FullCalendar event format
 */
export function mapSchedulesToEvents(schedules = []) {
  return schedules.flatMap((sched) => {
    const { id: scheduleId, weekStartDate, items = [] } = sched;
    return items.map((item, index) => ({
      id: `${scheduleId}-${index}`,
      title: item.recipeCode || '',
      start: `${item.date || weekStartDate}T${item.startTime || '00:00'}`,
      end: `${item.date || weekStartDate}T${item.endTime || '00:00'}`,
      extendedProps: {
        scheduleId,
        itemIndex: index,
        item,
      }
    }));
  });
}

/**
 * Convert a date select event into UnifiedScheduleModal props
 */
export function mapSelectToModalProps(selectInfo) {
  const date = format(new Date(selectInfo.startStr), 'yyyy-MM-dd');
  const startTime = selectInfo.startStr.substring(11, 16);
  const endTime = selectInfo.endStr
    ? selectInfo.endStr.substring(11, 16)
    : `${Number(startTime.slice(0,2)) + 1}:00`;

  return { mode: 'timeslot', initialSlot: { date, startTime, endTime } };
}

/**
 * Convert an event click into UnifiedScheduleModal props
 */
export function mapEventToModalProps(clickInfo, recipes = []) {
  const evt = clickInfo.event;
  const { scheduleId, itemIndex, item } = evt.extendedProps;
  const recipe = recipes.find(r => r.product_code === item.recipeCode) || item;
  const mode = item.status === 'COMPLETED' ? 'production' : 'timeslot';

  return {
    mode,
    initialEvent: { scheduleId, itemIndex, item: { ...item, recipe } }
  };
}
