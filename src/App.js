import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CreateProductionDocumentPage from './pages/CreateProductionDocumentPage';
import AuditProductionDocumentsPage from './pages/AuditProductionDocumentsPage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeEditorPage from './pages/RecipeEditorPage';
import WeeklySchedulePage from './pages/WeeklySchedulePage';
import StaffManagementPage from './pages/StaffManagementPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/production/:department/overview" element={<CreateProductionDocumentPage />} />
        <Route path="/production/:department/schedule" element={<WeeklySchedulePage />} />
        <Route path="/production/:department/audit" element={<AuditProductionDocumentsPage />} />
        <Route path="/production/:department/recipes" element={<RecipeListPage />} />
        <Route path="/production/:department/recipes/new" element={<RecipeEditorPage />} />
        <Route path="/production/:department/recipes/:recipeId" element={<RecipeEditorPage />} />
        <Route path="/production/:department/staff" element={<StaffManagementPage />} />
        <Route path="/production/:department" element={<Navigate to="create" replace />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
