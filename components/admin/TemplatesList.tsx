import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import * as apiClient from '../../services/apiClient';
import type { Template } from '../../services/apiClient';

const TemplatesList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await apiClient.fetchTemplates();
      setTemplates(list);
    } catch (err) {
      setError((err as Error).message || 'Failed to load templates');
      if ((err as Error & { statusCode?: number })?.message?.includes('401')) {
        apiClient.clearAdminToken();
        navigate('/admin', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    setDeletingId(id);
    try {
      await apiClient.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    apiClient.clearAdminToken();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Automation templates</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Log out
            </button>
            <Link
              to="/admin/templates/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
            >
              <Plus size={18} />
              New template
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Document type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">URL</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Steps</th>
                  <th className="w-24 py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{t.name}</td>
                    <td className="py-3 px-4 text-slate-600">{t.documentType}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]" title={t.url}>{t.url}</td>
                    <td className="py-3 px-4 text-slate-600">{Array.isArray(t.steps) ? t.steps.length : 0}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Link
                        to={`/admin/templates/${t.id}`}
                        className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === t.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {templates.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-500">No templates yet. Create one to get started.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesList;
