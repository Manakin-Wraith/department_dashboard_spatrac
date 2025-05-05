import React from 'react';
import { Link } from 'react-router-dom';
import { GridLegacy as Grid, Card, CardHeader, CardContent, CardActions, Button, Typography, Avatar, Box, useTheme } from '@mui/material';
// Import specific icons you'll use
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import SetMealIcon from '@mui/icons-material/SetMeal'; // Example for Butchery
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen'; // Example for HMR
import PageHeader from '../components/PageHeader';
import departments from '../data/department_table.json';
// Map JSON icon key to component
const iconMap = { BakeryDiningIcon, SetMealIcon, SoupKitchenIcon };



const DashboardPage = () => {
  const theme = useTheme(); // Keep if needed for more complex theme logic

  return (
    <Box sx={{ p: 2, flexGrow: 1, minHeight: '100vh', backgroundColor: theme.palette.grey[100] }}> {/* Use Box for padding, full-height, and subtle grey background */}
      <PageHeader title="SPATRAC Dashboard" /* subtitle="Overview & Quick Actions" */ /> {/* Cleaner title */}

      <Grid container spacing={3} sx={{ mt: 2 }}> {/* Updated to Grid v2: use rowSpacing, columnSpacing, and columns */}
        {departments.map((dept) => (
          <Grid item key={dept.department_code} xs={12} sm={6} md={4}> {/* Use new span prop for item width */}
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%', // Ensure cards in a row have same height
                borderTop: `4px solid ${dept.color}`, // Subtle top border accent
                boxShadow: theme.shadows[2], // Slightly softer shadow
                '&:hover': {
                  boxShadow: theme.shadows[5], // More pronounced hover shadow
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: dept.color }} aria-label={`${dept.department} icon`}>
                    {(() => {
                      const IconComponent = iconMap[dept.icon];
                      return IconComponent
                        ? <IconComponent />
                        : dept.department.charAt(0);
                    })()}
                  </Avatar>
                }
                title={dept.department}
                titleTypographyProps={{ variant: 'h6', component: 'div' }} // Good practice for semantics/styling
                sx={{ pb: 0 }} // Reduce padding bottom if content is short
              />
              <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to grow */}
                <Typography variant="body2" color="text.secondary">
                  {/* Placeholder for future stats - Keep it concise */}
                  Manage production documents and traceability for {dept.department}.
                  {/* Example Future Stats:
                  <br /> - Recent Runs: 5
                  <br /> - Stock Alerts: 1
                  */}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 1 }}>
                <Button
                  component={Link}
                  to={`/production/${dept.department_code}/overview`}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: dept.color, // Use accent color for primary action
                    color: theme.palette.getContrastText(dept.color),
                    '&:hover': {
                      backgroundColor: theme.palette.augmentColor({ color: { main: dept.color } }).dark, // Programmatic darken
                    }
                  }}
                >
                  Create Document
                </Button>
                {/* Optional: Add other actions like "View Runs" later */}
                {/* <Button size="small" variant="outlined">View Runs</Button> */}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
