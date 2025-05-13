import React from 'react';
import { useParams } from 'react-router-dom';
import { useSchedules } from '../hooks/useScheduleData';
import ProductionCalendarContainer from '../components/production/calendar/ProductionCalendarContainer';
import PageHeader from '../components/PageHeader';
import { CircularProgress, Typography, Box } from '@mui/material';

const WeeklySchedulePage = () => {
  const { department } = useParams();
  const { isLoading, isError, error } = useSchedules(department);

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );
  if (isError) return <Typography color="error">Error loading schedules: {error.message}</Typography>;

  return (
    <>
      <PageHeader title={`Weekly Schedule: ${department}`} />
      <ProductionCalendarContainer />
    </>
  );
};

export default WeeklySchedulePage;
