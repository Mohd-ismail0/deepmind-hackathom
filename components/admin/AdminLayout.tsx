import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import * as apiClient from '../../services/apiClient';

const AdminLayout: React.FC = () => {
  const token = apiClient.getAdminToken();
  const location = useLocation();
  if (!token && location.pathname !== '/admin') {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default AdminLayout;
