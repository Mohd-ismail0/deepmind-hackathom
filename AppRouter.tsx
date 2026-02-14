import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as apiClient from './services/apiClient';
import App from './App';
import AdminGate from './components/admin/AdminGate';
import AdminLayout from './components/admin/AdminLayout';
import TemplatesList from './components/admin/TemplatesList';
import TemplateForm from './components/admin/TemplateForm';

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={apiClient.getAdminToken() ? <Navigate to="templates" replace /> : <AdminGate />} />
        <Route path="templates" element={<TemplatesList />} />
        <Route path="templates/new" element={<TemplateForm />} />
        <Route path="templates/:id" element={<TemplateForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
