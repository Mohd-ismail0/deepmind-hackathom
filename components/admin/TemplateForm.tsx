import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import * as apiClient from '../../services/apiClient';
import type { Template } from '../../services/apiClient';

type StepRow = { id: string; action: string; target: string; value: string; description: string; promptText: string; responseKey: string };

const STEP_ACTIONS = ['visit', 'click', 'fill', 'prompt_user', 'read', 'verify', 'upload'] as const;

const TemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [url, setUrl] = useState('');
  const [steps, setSteps] = useState<StepRow[]>([
    { id: '1', action: 'visit', target: '', value: '', description: 'Navigate to URL', promptText: '', responseKey: '' },
  ]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const t = await apiClient.fetchTemplate(id);
        setName(t.name);
        setDocumentType(t.documentType);
        setUrl(t.url);
        setSteps(
          (t.steps && t.steps.length)
            ? t.steps.map((s: { id?: string; action?: string; target?: string; value?: string; description?: string; promptText?: string; responseKey?: string }, i: number) => ({
                id: s.id ?? String(i + 1),
                action: s.action ?? 'click',
                target: s.target ?? '',
                value: s.value ?? '',
                description: s.description ?? '',
                promptText: s.promptText ?? '',
                responseKey: s.responseKey ?? '',
              }))
            : [{ id: '1', action: 'visit', target: '', value: '', description: 'Navigate to URL', promptText: '', responseKey: '' }]
        );
      } catch (err) {
        setError((err as Error).message || 'Failed to load template');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        action: 'click',
        target: '',
        value: '',
        description: '',
        promptText: '',
        responseKey: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepRow, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const stepsPayload = steps.map((s) => ({
        id: s.id,
        action: s.action,
        target: s.target,
        ...(s.value ? { value: s.value } : {}),
        description: s.description || s.action,
        ...(s.action === 'prompt_user' && (s.promptText || s.responseKey) ? { promptText: s.promptText, responseKey: s.responseKey } : {}),
      }));
      if (isEdit && id) {
        await apiClient.updateTemplate(id, { name: name.trim(), documentType: documentType.trim(), url: url.trim(), steps: stepsPayload });
      } else {
        await apiClient.createTemplate({ name: name.trim(), documentType: documentType.trim(), url: url.trim(), steps: stepsPayload });
      }
      navigate('/admin/templates', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/templates')}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit template' : 'New template'}</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Passport Renewal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document type</label>
              <input
                type="text"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. passport, license"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL (used directly in automation)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Steps</label>
              <button type="button" onClick={addStep} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={14} /> Add step
              </button>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">Step {index + 1}</span>
                    <button type="button" onClick={() => removeStep(index)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Action</label>
                      <select
                        value={step.action}
                        onChange={(e) => updateStep(index, 'action', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        {STEP_ACTIONS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Target (selector or URL for visit)</label>
                      <input
                        type="text"
                        value={step.target}
                        onChange={(e) => updateStep(index, 'target', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                        placeholder="#selector or text=Button"
                      />
                    </div>
                    {(step.action === 'fill' || step.action === 'prompt_user') && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-500 mb-0.5">
                          {step.action === 'fill' ? 'Value (use {fieldName} for user data)' : 'Prompt text (for prompt_user)'}
                        </label>
                        <input
                          type="text"
                          value={step.action === 'prompt_user' ? step.promptText : step.value}
                          onChange={(e) =>
                            step.action === 'prompt_user'
                              ? updateStep(index, 'promptText', e.target.value)
                              : updateStep(index, 'value', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder={step.action === 'fill' ? '{email}, {fullName}' : 'e.g. Please enter the OTP'}
                        />
                      </div>
                    )}
                    {step.action === 'prompt_user' && (
                      <div>
                        <label className="block text-xs text-slate-500 mb-0.5">Response key (store user reply as)</label>
                        <input
                          type="text"
                          value={step.responseKey}
                          onChange={(e) => updateStep(index, 'responseKey', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="e.g. otp"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-500 mb-0.5">Description</label>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Human-readable description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/admin/templates')} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateForm;
