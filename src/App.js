import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AppLayout from './components/AppLayout'; 
import DashboardPage from './pages/DashboardPage';
import CreateProductionDocumentPage from './pages/CreateProductionDocumentPage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeEditorPage from './pages/RecipeEditorPage';
import AuditProductionDocumentsPage from './pages/AuditProductionDocumentsPage';
import StaffManagementPage from './pages/StaffManagementPage';

import './App.css'; 

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        <Route path="/" element={<AppLayout pageTitle="Dashboard"><DashboardPage /></AppLayout>} />
        <Route path="/production/:department/overview" element={<AppLayout pageTitle="Department Overview"><CreateProductionDocumentPage /></AppLayout>} />
        {/* WeeklySchedulePage route removed - scheduling functionality consolidated in CreateProductionDocumentPage */}
        <Route path="/production/:department/audit" element={<AppLayout pageTitle="Audit Production Documents"><AuditProductionDocumentsPage /></AppLayout>} />
        <Route path="/production/:department/recipes" element={<AppLayout pageTitle="Recipes"><RecipeListPage /></AppLayout>} />
        <Route path="/production/:department/recipes/new" element={<AppLayout pageTitle="Create New Recipe"><RecipeEditorPage /></AppLayout>} />
        <Route path="/production/:department/recipes/:recipeId" element={<AppLayout pageTitle="Edit Recipe"><RecipeEditorPage /></AppLayout>} />
        <Route path="/production/:department/staff" element={<AppLayout pageTitle="Staff Management"><StaffManagementPage /></AppLayout>} />
        <Route path="/production/:department" element={<AppLayout pageTitle="Department Overview"><Navigate to="overview" replace /></AppLayout>} />
        <Route path="*" element={<AppLayout pageTitle="404 Not Found"><div>404 Not Found</div></AppLayout>} />
      </Routes>
    </LocalizationProvider>
  );
}

export default App;
