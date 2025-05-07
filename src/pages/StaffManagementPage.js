import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deleteHandler, fetchSchedules, fetchRecipes, fetchAudits } from '../services/api';
import { bus } from '../utils/eventBus';
import { 
  Box, Typography, TextField, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, Paper, Chip, 
  IconButton, Card, CardContent, Avatar, Tabs, Tab, Divider,
  Rating, List, ListItem, ListItemText, ListItemIcon
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
  const deptObj = departments.find(d => d.department_code === department) || {};
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

  useEffect(() => {
    async function load() {
      const [sch, recs, auditRecords] = await Promise.all([
        fetchSchedules(department),
        fetchRecipes(department),
        fetchAudits(department)
      ]);
      
      // Setup handlers with additional properties
      const defaultList = (deptObj.handlers || []).map((name, idx) => ({ 
        id: `handler-${idx}`, 
        department, 
        name,
        role: 'Food Handler', // All are food handlers
        skills: ['Food Safety', 'Recipe Preparation'],
        performance: {
          qualityScore: (Math.random() * 2 + 3).toFixed(1), // Random score between 3-5
          completedRecipes: Math.floor(Math.random() * 50) + 5,
          onTimePercentage: Math.floor(Math.random() * 20) + 80
        }
      }));
      
      // Get the specific department manager name from department_table.json
      const managerName = deptObj.department_manager || 'Department Manager';
      setDepartmentManager(managerName);
      
      setHandlers(defaultList);
      setSchedules(sch);
      setAudits(auditRecords);
      
      // Flatten and filter recipes for this department
      const flatRecs = Array.isArray(recs[0]) ? recs.flat() : recs;
      const deptRecipes = flatRecs.filter(r => r.department === deptObj.department);
      setRecipes(deptRecipes);
      const map = deptRecipes.reduce((acc, r) => { acc[r.product_code] = r.description; return acc; }, {});
      setRecipeMap(map);
    }
    load();
  }, [department, deptObj.handlers, deptObj.department, deptObj.department_manager]);

  useEffect(() => {
    const onDel = id => setSchedules(prev => prev.filter(s => s.id !== id));
    bus.on('scheduleDeleted', onDel);
    
    // Listen for new audit records
    const onNewAudit = (audit) => {
      setAudits(prev => [audit, ...prev]);
    };
    bus.on('new-audit', onNewAudit);
    
    return () => {
      bus.off('scheduleDeleted', onDel);
      bus.off('new-audit', onNewAudit);
    };
  }, []);

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

  // Get assignments for a handler
  const getAssignments = (handlerName) =>
    schedules
      .filter(s => s.handlersNames === handlerName)
      .map(s => ({ date: s.weekStartDate, recipes: s.items }));
      
  // Get production history (confirmed recipes) for a handler
  const getProductionHistory = (handlerName) =>
    audits
      .filter(a => a.food_handler_responsible === handlerName)
      .sort((a, b) => new Date(b.confirmation_timestamp || b.date) - new Date(a.confirmation_timestamp || a.date));

  // Filter handlers based on search
  const filteredHandlers = handlers.filter(h => h.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Box component="main" sx={{ backgroundColor: pageBg, minHeight: '100vh', p: 2 }}>
      <Box sx={{ backgroundColor: theme.palette.grey[100], color: pageTextColor, borderRadius: 2, p: 3, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
        {/* Back button removed as requested */}
        <PageHeader title="Staff Management" />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Department Manager: <strong>{departmentManager}</strong>
          </Typography>
        </Box>
        
        {/* Main content layout - staff list and details */}
        <Box sx={{ display: 'flex', mt: 4, gap: 3 }}>
          {/* Staff list panel */}
          <Box sx={{ width: '35%', minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search staff..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                size="small"
                sx={{ width: 200 }}
              />
            </Box>
            
            <Typography variant="h6" sx={{ mb: 1 }}>Department Staff</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(accentColor, 0.1) }}>
                    <TableCell>Staff Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHandlers.map((handler) => (
                    <TableRow 
                      key={handler.id} 
                      hover 
                      onClick={() => handleSelectStaff(handler)}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedStaff?.id === handler.id ? alpha(accentColor, 0.1) : 'inherit'
                      }}
                    > 
                      <TableCell>{handler.name}</TableCell>
                      <TableCell>{handler.role}</TableCell>
                      <TableCell align="right">
                        {handler.id && (
                          <IconButton size="small" color="error" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(handler.id);
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Staff performance summary */}
            <Typography variant="h6" sx={{ mb: 1 }}>Performance Overview</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(accentColor, 0.1) }}>
                    <TableCell>Staff Name</TableCell>
                    <TableCell>Quality Score</TableCell>
                    <TableCell>Completed Recipes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHandlers.map((handler) => (
                    <TableRow key={`perf-${handler.id}`}>
                      <TableCell>{handler.name}</TableCell>
                      <TableCell>
                        <Rating value={Number(handler.performance.qualityScore)} precision={0.5} readOnly size="small" />
                      </TableCell>
                      <TableCell>{handler.performance.completedRecipes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Staff details panel */}
          {selectedStaff ? (
            <Box sx={{ flex: 1 }}>
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
                    <Box>
                      <Typography variant="h5">{selectedStaff.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedStaff.role}</Typography>
                      <Box sx={{ display: 'flex', mt: 1 }}>
                        {selectedStaff.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle2">Quality Score</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={Number(selectedStaff.performance.qualityScore)} precision={0.5} readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {selectedStaff.performance.qualityScore}/5
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Completed Recipes</Typography>
                      <Typography variant="h6">{selectedStaff.performance.completedRecipes}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">On-Time Percentage</Typography>
                      <Typography variant="h6">{selectedStaff.performance.onTimePercentage}%</Typography>
                    </Box>
                  </Box>
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
                        {getAssignments(selectedStaff.name).map(({ date, recipes }) => (
                          <ListItem key={date} divider>
                            <ListItemIcon>
                              <AssignmentIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Date: ${date}`}
                              secondary={
                                <>
                                  {recipes.map((recipe, idx) => (
                                    <Chip
                                      key={idx}
                                      label={`${recipe.plannedQty}x ${recipeMap[recipe.recipeCode] || recipe.recipeCode}`}
                                      size="small"
                                      sx={{ mr: 0.5, mt: 0.5 }}
                                    />
                                  ))}
                                </>
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
                        {getProductionHistory(selectedStaff.name).map((audit) => (
                          <ListItem key={audit.uid} divider>
                            <ListItemIcon>
                              <HistoryIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${audit.product_name[0] || 'Unknown Recipe'}`}
                              secondary={
                                <>
                                  <Typography variant="body2">
                                    Date: {audit.date || 'Unknown'}
                                  </Typography>
                                  <Typography variant="body2">
                                    Quantity: {audit.actual_qty || audit.planned_qty || 'Unknown'}
                                  </Typography>
                                  {audit.quality_score && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>Quality:</Typography>
                                      <Rating value={Number(audit.quality_score)} size="small" readOnly />
                                    </Box>
                                  )}
                                </>
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
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a staff member to view details
              </Typography>
            </Box>
          )}
        </Box>

      </Box>
    </Box>
  );
};

export default StaffManagementPage;
