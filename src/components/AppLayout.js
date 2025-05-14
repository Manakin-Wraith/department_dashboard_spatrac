import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, IconButton, CssBaseline, useTheme, useMediaQuery, Divider } from '@mui/material';
import { Link, useLocation, useParams } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt'; // For Recipes List
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // For Weekly Schedule
import PeopleIcon from '@mui/icons-material/People'; // For Staff Management
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // For Audit
import BusinessIcon from '@mui/icons-material/Business'; // For Suppliers

import departmentsData from '../data/department_table.json'; // Import department data

const drawerWidth = 240;

const AppLayout = ({ children, pageTitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { department: departmentCode } = useParams(); // Get department code from URL

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  let currentNavItems = [];

  // Always show Dashboard and Suppliers links first
  currentNavItems.push({ text: 'Dashboard', icon: <DashboardIcon />, path: '/' });
  

  if (departmentCode) {
    const departmentObj = departmentsData.find(d => d.department_code === departmentCode);
    if (departmentObj) {
      currentNavItems.push({ type: 'divider' }); // Divider after Dashboard when in department context
      currentNavItems.push({
        text: `${departmentObj.department} Overview`,
        icon: <CalendarTodayIcon />,
        path: `/production/${departmentCode}/overview`
      });
      currentNavItems.push({
        text: 'Recipes',
        icon: <ListAltIcon />,
        path: `/production/${departmentCode}/recipes`
      });
      currentNavItems.push({
        text: 'Audit',
        icon: <AssignmentTurnedInIcon />,
        path: `/production/${departmentCode}/audit`
      });
      currentNavItems.push({
        text: 'Staff',
        icon: <PeopleIcon />,
        path: `/production/${departmentCode}/staff`
      });
      currentNavItems.push({ 
        text: 'Suppliers', 
        icon: <BusinessIcon />, 
        path: `/production/${departmentCode}/suppliers` });
    }
  } else {
    // Global context (not inside a specific department)
    // Currently, App.js does not define global routes for /recipes, /schedule, /staff.
    // So, we only show Dashboard. If global pages are added, links can be added here.
    // Example of how they might have been added (now commented out due to lack of routes):
    // currentNavItems.push({ type: 'divider' });
    // currentNavItems.push({ text: 'All Recipes', icon: <ListAltIcon />, path: '/recipes' }); // Needs global /recipes route
    // currentNavItems.push({ text: 'Master Schedule', icon: <CalendarTodayIcon />, path: '/schedule' }); // Needs global /schedule route
    // currentNavItems.push({ text: 'Staff Management', icon: <PeopleIcon />, path: '/staff' }); // Needs global /staff route
  }

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
          SPATRAC
        </Typography>
      </Toolbar>
      <List>
        {currentNavItems.map((item, index) => {
          if (item.type === 'divider') {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
          }
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1 )}
                onClick={isMobile ? handleDrawerToggle : undefined}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1) ? theme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper, // Or theme.palette.primary.main for colored AppBar
          color: theme.palette.text.primary, // Ensure text is readable on paper background
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            {pageTitle || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={isMobile ? handleDrawerToggle : undefined}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;
