import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminGate from './AdminGate';

const AdminIndex: React.FC = () => {
  const { user, ready } = useAdminAuth();

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin/templates" replace />;
  }

  return <AdminGate />;
};

export default AdminIndex;
