import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

const InfoCard = ({ title, value, icon, sx, ...props }) => {
  const theme = useTheme();

  return (
    <Card 
      sx={{
        height: '100%', // Ensure cards in a row take same height if needed
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadows[1],
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
        // borderRadius: theme.shape.borderRadius * 1.5, // Already set in global theme for MuiCard
        ...sx // Allow parent to override or add styles
      }}
      {...props}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 2 }}>
        {icon && (
          <Box mb={1} sx={{ color: theme.palette.primary.main }}>
            {React.cloneElement(icon, { sx: { fontSize: '2.5rem' } })}
          </Box>
        )}
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          {value !== undefined && value !== null ? value : '-'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
