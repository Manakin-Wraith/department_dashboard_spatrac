import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { API_BASE } from '../services/api';

/**
 * Admin component for manually triggering supplier updates
 */
const AdminSupplierUpdates = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  /**
   * Trigger a manual supplier update
   */
  const triggerSupplierUpdate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/update-suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier information');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error updating supplier information:', err);
      setError(err.message || 'An error occurred while updating supplier information');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format the output details for display
   */
  const formatDetails = (details) => {
    if (!details) return [];
    
    return details
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => (
        <ListItem key={index} divider={index < details.split('\n').length - 1}>
          <ListItemText 
            primary={line} 
            primaryTypographyProps={{ 
              variant: 'body2',
              style: { 
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }
            }} 
          />
        </ListItem>
      ));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Supplier Information Updates
      </Typography>
      
      <Typography variant="body1" paragraph>
        This tool allows you to manually update supplier information for all audit records.
        Use this when you've made changes to supplier data or when you notice missing supplier details.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={triggerSupplierUpdate}
          disabled={loading}
        >
          Update Supplier Information Now
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ScheduleIcon />}
          onClick={() => window.open('/docs/scheduled_supplier_updates.md', '_blank')}
        >
          View Scheduling Options
        </Button>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
          <CircularProgress size={24} />
          <Typography>Updating supplier information. This may take a few moments...</Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {result && (
        <Alert severity="success" sx={{ my: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {result.message}
          
          {result.details && (
            <>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  mt: 1
                }}
                onClick={() => setExpanded(!expanded)}
              >
                <Typography variant="body2" fontWeight="bold">
                  {expanded ? 'Hide' : 'Show'} Details
                </Typography>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              
              <Collapse in={expanded}>
                <Box sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                  <List dense disablePadding>
                    {formatDetails(result.details)}
                  </List>
                </Box>
              </Collapse>
            </>
          )}
        </Alert>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" color="text.secondary">
        Note: Supplier updates are also scheduled to run automatically every day at 1:00 AM.
      </Typography>
    </Paper>
  );
};

export default AdminSupplierUpdates;
