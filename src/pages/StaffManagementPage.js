import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { deleteHandler, fetchSchedules, fetchRecipes, fetchAudits } from '../services/api';
import { bus } from '../utils/eventBus';
import { 
  Box, Typography, TextField, ListItemButton, Paper, Chip, 
  IconButton, Card, CardContent, Avatar, Tabs, Tab, Divider,
  Rating, List, ListItem, ListItemText, ListItemIcon, Grid
} from '@mui/material';
// ArrowBackIcon import removed as the back button was removed
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import PageHeader from '../components/PageHeader';
import { useTheme, alpha } from '@mui/material/styles';
import departments from '../data/department_table.json';

const StaffManagementPage = () => {
  const { department } = useParams();
  const theme = useTheme();
  
  // Wrap deptObj initialization in useMemo to prevent recreation on every render
  const deptObj = useMemo(() => {
    return departments.find(d => d.department_code === department) || {};
  }, [department]);
  
  const pageBg = alpha(deptObj.color || '#000', 1.0);
  const pageTextColor = theme.palette.text.primary;
  const accentColor = deptObj.color || theme.palette.primary.main;
  const [handlers, setHandlers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filter, setFilter] = useState('');
  const [recipeMap, setRecipeMap] = useState({});
  // We don't directly use recipes in the UI, but we need it for the recipe map
  const [, setRecipes] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [departmentManager, setDepartmentManager] = useState('');

  // Function to load data from API - wrapped in useCallback to prevent recreation on every render
  const loadData = useCallback(async () => {
    try {
      console.log('Loading data for StaffManagementPage...');
      // Fetch data from API
      const [sch, recs, auditRecords] = await Promise.all([
        fetchSchedules(department),
        fetchRecipes(department),
        fetchAudits(department)
      ]);
      
      // Get the specific department manager name from department_table.json
      const managerName = deptObj.department_manager || 'Department Manager';
      setDepartmentManager(managerName);
      
      // Setup handlers with real data
      const defaultList = (deptObj.handlers || []).map((name, idx) => {
        // Get all schedules and audits for this handler
        const handlerSchedules = sch.filter(s => {
          // Check if this handler is mentioned in the schedule
          return s.handlersNames && s.handlersNames.split(',').map(h => h.trim()).includes(name);
        });
        
        // Get all production items for this handler from schedules
        const scheduledItems = handlerSchedules.flatMap(s => 
          s.items.filter(item => item.handlerName === name)
        );
        
        // Get all completed productions for this handler from audits
        const completedProductions = auditRecords.filter(a => 
          a.food_handler_responsible === name
        );
        
        // Calculate performance metrics from real data
        const totalCompletedRecipes = completedProductions.length;
        
        // Calculate average quality score if available
        let avgQualityScore = 0;
        const qualityScores = completedProductions
          .filter(p => p.quality_score)
          .map(p => Number(p.quality_score));
        
        if (qualityScores.length > 0) {
          avgQualityScore = (qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length).toFixed(1);
        }
        
        // Calculate on-time percentage if timestamps are available
        let onTimeCount = 0;
        let totalWithTimestamps = 0;
        
        completedProductions.forEach(p => {
          if (p.scheduled_time && p.confirmation_timestamp) {
            totalWithTimestamps++;
            const scheduledTime = new Date(p.scheduled_time);
            const completionTime = new Date(p.confirmation_timestamp);
            if (completionTime <= scheduledTime) {
              onTimeCount++;
            }
          }
        });
        
        const onTimePercentage = totalWithTimestamps > 0 
          ? Math.round((onTimeCount / totalWithTimestamps) * 100) 
          : 100; // Default to 100% if no data
        
        return { 
          id: `handler-${idx}`, 
          department, 
          name,
          role: 'Food Handler', // All are food handlers
          skills: ['Food Safety', 'Recipe Preparation'],
          performance: {
            qualityScore: avgQualityScore || '0.0',
            completedRecipes: totalCompletedRecipes,
            onTimePercentage: onTimePercentage,
            scheduledItems: scheduledItems.length
          }
        };
      });
      
      setHandlers(defaultList);
      setSchedules(sch);
      setAudits(auditRecords);
      
      // Flatten and filter recipes for this department
      const flatRecs = Array.isArray(recs[0]) ? recs.flat() : recs;
      // Use department code (1155) instead of department name (HMR) for filtering
      const deptRecipes = flatRecs.filter(r => r.department === department);
      setRecipes(deptRecipes);
      // Create a map of recipe codes to descriptions for display
      const map = deptRecipes.reduce((acc, r) => { acc[r.product_code] = r.description; return acc; }, {});
      setRecipeMap(map);
      
      console.log('Data loaded successfully for StaffManagementPage');
    } catch (error) {
      console.error('Error loading data for StaffManagementPage:', error);
    }
  }, [department, deptObj, setHandlers, setSchedules, setAudits, setRecipes, setRecipeMap, setDepartmentManager]);
  
  // Initial data loading
  useEffect(() => {
    loadData();
  }, [department, deptObj.handlers, deptObj.department, deptObj.department_manager, loadData]);

  useEffect(() => {
    // Listen for schedule deletions
    const onScheduleDeleted = id => {
      console.log('Schedule deleted event received:', id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    };
    bus.on('schedule-deleted', onScheduleDeleted);
    
    // Listen for new audit records
    const onNewAudit = (audit) => {
      console.log('New audit event received:', audit);
      setAudits(prev => [audit, ...prev]);
      
      // Reload all data to ensure we have the latest
      loadData();
    };
    bus.on('new-audit', onNewAudit);
    
    // Listen for schedule updates
    const onScheduleUpdate = (updatedSchedule) => {
      console.log('Schedule updated event received:', updatedSchedule);
      // Update the schedules list when a schedule is updated elsewhere
      if (updatedSchedule.department === department) {
        setSchedules(prev => {
          const exists = prev.some(s => s.id === updatedSchedule.id);
          if (exists) {
            return prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
          } else {
            return [...prev, updatedSchedule];
          }
        });
      }
    };
    bus.on('schedule-updated', onScheduleUpdate);
    
    // Listen for general data updates
    const onDataUpdated = (data) => {
      console.log('Data updated event received:', data);
      // Reload all data to ensure we have the latest
      loadData();
    };
    bus.on('data-updated', onDataUpdated);
    
    return () => {
      bus.off('schedule-deleted', onScheduleDeleted);
      bus.off('new-audit', onNewAudit);
      bus.off('schedule-updated', onScheduleUpdate);
      bus.off('data-updated', onDataUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, loadData]);

  // Handle selecting a staff member for detailed view
  const handleSelectStaff = (handler) => {
    setSelectedStaff(handler);
    setActiveTab(0);
  };
  
  // Handle tab change in staff detail view
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };



  const handleDelete = async (id) => {
    if (window.confirm('Delete handler?')) {
      await deleteHandler(id);
      setHandlers(prev => prev.filter(h => h.id !== id));
      if (selectedStaff && selectedStaff.id === id) {
        setSelectedStaff(null);
      }
    }
  };

  // Get current assignments for a handler (only planned, not confirmed)
  const getAssignments = (handlerName) => {
    // Filter schedules where this staff member is assigned
    // In Option 2, schedules only contain planned items (not confirmed)
    return schedules
      .filter(s => s.handlersNames === handlerName)
      .map(s => ({
        id: s.id,
        date: s.weekStartDate,
        recipes: s.items,
        status: 'Planned' // All items in schedules collection are now 'Planned'
      }));
  };
      
  // Get production history (confirmed recipes) for a handler
  // In Option 2, all confirmed items are in the audits collection
  const getProductionHistory = (handlerName) =>
    audits
      .filter(a => a.food_handler_responsible === handlerName)
      .map(audit => ({
        id: audit.id,
        date: audit.date,
        recipeCode: audit.product_name?.[0] || '',
        description: audit.productDescription || '',
        plannedQty: audit.planned_qty,
        actualQty: audit.actual_qty,
        qualityScore: audit.quality_score,
        confirmationTimestamp: audit.confirmation_timestamp,
        status: 'Confirmed'
      }))
      .sort((a, b) => new Date(b.confirmationTimestamp || b.date) - new Date(a.confirmationTimestamp || a.date));

  // Filter handlers based on search
  const filteredHandlers = handlers.filter(h => h.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        <PageHeader title="Staff Management" />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Department Manager: <strong>{departmentManager}</strong>
          </Typography>
        </Box>
        
        {/* Main content layout - staff list and details */}
        <Grid container spacing={3}>
          {/* Staff list panel */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Department Staff</Typography>
                <TextField
                  placeholder="Search staff..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Box>
              
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {filteredHandlers.map((handler) => {
                  // Calculate activity indicators
                  const hasCurrentAssignments = getAssignments(handler.name).length > 0;
                  const hasCompletedProductions = getProductionHistory(handler.name).length > 0;
                  
                  return (
                    <ListItem 
                      key={handler.id}
                      disablePadding
                      secondaryAction={
                        handler.id && (
                          <IconButton edge="end" size="small" color="error" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(handler.id);
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemButton 
                        onClick={() => handleSelectStaff(handler)}
                        selected={selectedStaff?.id === handler.id}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': {
                            backgroundColor: alpha(accentColor, 0.1),
                          }
                        }}
                      >
                        <ListItemText 
                          primary={handler.name}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              {hasCurrentAssignments && (
                                <Chip 
                                  label={`${handler.performance.scheduledItems} Scheduled`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {hasCompletedProductions && (
                                <Chip 
                                  label={`${handler.performance.completedRecipes} Completed`} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
          
          {/* Staff details panel */}
          {selectedStaff ? (
            <Grid item xs={12} md={8} lg={9}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: accentColor,
                        width: 64, 
                        height: 64,
                        mr: 2 
                      }}
                    >
                      {selectedStaff.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h5">{selectedStaff.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{selectedStaff.role}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">Staff ID</Typography>
                          <Typography variant="body1">{selectedStaff.id.replace('handler-', '')}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', mt: 1 }}>
                        {selectedStaff.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom>Quality Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Rating value={Number(selectedStaff.performance.qualityScore)} precision={0.5} readOnly />
                        </Box>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          {selectedStaff.performance.qualityScore}/5
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom>Completed Productions</Typography>
                        <Typography variant="h4">{selectedStaff.performance.completedRecipes}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom>Scheduled Productions</Typography>
                        <Typography variant="h4">{selectedStaff.performance.scheduledItems}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Current Assignments" icon={<AssignmentIcon />} iconPosition="start" />
                <Tab label="Production History" icon={<HistoryIcon />} iconPosition="start" />
                <Tab label="Skills & Training" icon={<SchoolIcon />} iconPosition="start" />
              </Tabs>
              
              {/* Tab content */}
              {activeTab === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Current Assignments</Typography>
                    {getAssignments(selectedStaff.name).length > 0 ? (
                      <List>
                        {getAssignments(selectedStaff.name).map((assignment) => (
                          <ListItem key={assignment.id || assignment.date} divider>
                            <ListItemIcon>
                              <AssignmentIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1">Week Starting: {assignment.date}</Typography>
                                  <Chip 
                                    label={assignment.status} 
                                    color={assignment.status === 'Confirmed' ? 'success' : 'primary'}
                                    size="small" 
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Scheduled Recipes:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {assignment.recipes.map((recipe, idx) => {
                                      // Get recipe description from the map or use the code as fallback
                                      const recipeDesc = recipeMap[recipe.recipeCode] || `Recipe ${recipe.recipeCode}`;
                                      return (
                                        <Chip
                                          key={idx}
                                          label={`${recipe.plannedQty}x ${recipeDesc}`}
                                          size="small"
                                          sx={{ mr: 0.5, mt: 0.5 }}
                                          color="primary"
                                          variant="outlined"
                                        />
                                      );
                                    })}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No current assignments found for this staff member.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 1 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Production History</Typography>
                    {getProductionHistory(selectedStaff.name).length > 0 ? (
                      <List>
                        {getProductionHistory(selectedStaff.name).map((production) => (
                          <ListItem key={production.id} divider>
                            <ListItemIcon>
                              <HistoryIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1">{production.description || production.recipeCode}</Typography>
                                  <Chip 
                                    label="Confirmed" 
                                    color="success"
                                    size="small" 
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Date: {production.date || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Confirmed: {production.confirmationTimestamp ? new Date(production.confirmationTimestamp).toLocaleDateString() : 'Unknown'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Planned Qty: {production.plannedQty || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Actual Qty: {production.actualQty || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  
                                  {production.qualityScore && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Quality Score:</Typography>
                                      <Rating value={Number(production.qualityScore)} size="small" readOnly precision={0.5} />
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No production history found for this staff member.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 2 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Skills & Training</Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Current Skills</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedStaff.skills.map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            color="primary" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle1" gutterBottom>Recommended Training</Typography>
                    <List>
                      <ListItem divider>
                        <ListItemIcon>
                          <SchoolIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Advanced Food Safety"
                          secondary="Recommended to improve quality scores"
                        />
                      </ListItem>
                      <ListItem divider>
                        <ListItemIcon>
                          <EmojiEventsIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Recipe Specialization"
                          secondary="Based on most frequently assigned recipes"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
          ) : (
            <Grid item xs={12} md={8} lg={9}>
              <Paper sx={{ p: 4, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a staff member to view details
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

      </Box>
    </Box>
  );
};

export default StaffManagementPage;
