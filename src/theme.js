import { createTheme } from '@mui/material/styles';

// Define primary and secondary colors
const primaryColor = '#1976d2'; // A standard MUI blue
const secondaryColor = '#dc004e'; // A vibrant pink/red for accents

const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: secondaryColor,
    },
    // You can add other palette colors like error, warning, info, success
    // Example: an accent for department-specific elements, though this will often be applied contextually
    departmentAccent: {
      butchery: '#D32F2F', // Example Red
      bakery: '#FFC107',   // Example Amber
      hmr: '#4CAF50',      // Example Green
    },
    background: {
      default: '#f4f6f8', // A light grey background for the app
      paper: '#ffffff',    // White for paper elements like Cards, Modals
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    // You can customize other variants like body1, body2, button, caption, etc.
  },
  spacing: 8, // Default spacing unit (8px)
  components: {
    // Example of customizing a component globally
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Buttons will not be all caps by default
          borderRadius: '8px',   // Slightly more rounded buttons
        },
        containedPrimary: {
          // Example: Adding a subtle shadow to primary buttons
          // boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // More rounded cards
        },
      },
      defaultProps: {
        elevation: 3, // Set a default elevation. MUI will use theme.shadows[3] correctly.
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px -1px rgba(0,0,0,0.06), 0 4px 5px 0 rgba(0,0,0,0.05), 0 1px 10px 0 rgba(0,0,0,0.04)', // Softer AppBar shadow
        }
      },
      defaultProps: {
        elevation: 2, // A moderate shadow for the AppBar
      }
    }
    // You can add more global component overrides here
  },
});

export default theme;
