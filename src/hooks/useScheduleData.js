import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSchedules, saveSchedule, deleteSchedule } from '../services/api';

// Fetch and cache schedules for a department
export function useSchedules(department) {
  return useQuery(
    ['schedules', department],
    () => fetchSchedules(department),
    { enabled: !!department }
  );
}

// Mutation hook for saving (POST/PUT) a schedule
export function useSaveSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ department, schedule }) => saveSchedule(department, schedule),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['schedules', variables.department]);
      }
    }
  );
}

// Mutation hook for deleting a schedule
export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ department, id }) => deleteSchedule(department, id),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['schedules', variables.department]);
      }
    }
  );
}
