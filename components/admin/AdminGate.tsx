import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import * as apiClient from '../../services/apiClient';

const AdminGate: React.FC = () => {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await apiClient.verifyAdminSecret(secret);
      apiClient.setAdminToken(token);
      navigate('/admin/templates', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Invalid secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full max-w-md">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-white mx-auto mb-6">
          <Lock size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 text-center mb-2">Admin access</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Enter the admin secret to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminGate;
