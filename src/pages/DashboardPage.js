import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Card, CardHeader, CardContent, CardActions, Button, Typography, Avatar, useTheme } from '@mui/material';
// Import specific icons you'll use
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal'; // Example for Butchery
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen'; // Example for HMR
import PageHeader from '../components/PageHeader';
import departments from '../data/department_table.json';
// Map JSON icon key to component
const iconMap = { BakeryDiningIcon, SetMealIcon, SoupKitchenIcon };



const DashboardPage = () => {
  const theme = useTheme(); // Keep for theme.shadows and dept.color dependent styles

  return (
    <>
      <PageHeader title="SPATRAC Dashboard" /* subtitle="Overview & Quick Actions" */ /> {/* Cleaner title */}

      <Grid container spacing={3} sx={{ mt: 2 }}> {/* Updated to Grid v2: use rowSpacing, columnSpacing, and columns */}
        {departments.map((dept) => (
          <Grid item key={dept.department_code} xs={12} sm={6} md={4}> {/* Use new span prop for item width */}
            <Card
  sx={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderTop: `4px solid ${dept.color}`,
    boxShadow: theme.shadows[2],
    '&:hover': {
      boxShadow: theme.shadows[5],
    },
    p: { xs: 1, sm: 2 }, // Responsive padding
    borderRadius: theme.shape.borderRadius * 1.5, // Use theme's border radius
    minWidth: 0,
  }}
>
  <CardHeader
    avatar={
      <Avatar sx={{ bgcolor: dept.color, width: 48, height: 48 }} aria-label={`${dept.department} icon`}>
        {(() => {
          const IconComponent = iconMap[dept.icon];
          return IconComponent
            ? <IconComponent fontSize="large" />
            : dept.department.charAt(0);
        })()}
      </Avatar>
    }
    title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>{dept.department}</Typography>} // Ensure consistent font weight from theme or sx
    sx={{ pb: 1, pt: 1 }}
  />
  <CardContent sx={{ flexGrow: 1, pt: 1, pb: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Manage production documents and traceability for {dept.department}.
    </Typography>
    {/* Example: Quick stat or badge can go here */}
    {/* <Chip label="5 Recent Runs" color="primary" size="small" sx={{ mt: 1 }} /> */}
  </CardContent>
  <CardActions sx={{ mt: 'auto', px: 0, pb: 2 }}>
    <Button
      fullWidth
      variant="contained"
      sx={{
        bgcolor: dept.color,
        color: theme.palette.getContrastText(dept.color),
        fontWeight: 'bold', // Ensure consistent font weight
        fontSize: { xs: '0.9rem', sm: '1rem' }, // Adjusted font size for better fit
        py: 1.2,
        // borderRadius: theme.shape.borderRadius, // Use global button border radius from theme
        boxShadow: 1,
        '&:hover': {
          bgcolor: theme.palette.augmentColor({ color: { main: dept.color } }).dark,
          boxShadow: theme.shadows[3],
        },
      }}
      component={Link}
      to={`/production/${dept.department_code}/overview`}
    >
      Go to {dept.department}
    </Button>
  </CardActions>
</Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default DashboardPage;
