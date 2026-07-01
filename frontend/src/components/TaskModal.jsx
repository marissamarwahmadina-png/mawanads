import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SERVICE_TYPES, STATUSES, PRIORITIES } from '../lib/workflow';

const API = process.env.REACT_APP_BACKEND_URL;

const blank = {
  title: '', description: '', client_id: '', service_type: 'other',
  assignee_id: '', status: 'todo', priority: 'medium', due_date: '',
};

export default function TaskModal({ open, task, clients, members, onClose, onSaved, onDeleted, canDelete }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '', description: task.description || '',
        client_id: task.client_id || '', service_type: task.service_type || 'other',
        assignee_id: task.assignee_id || '', status: task.status || 'todo',
        priority: task.priority || 'medium', due_date: task.due_date || '',
      });
    } else {
      setForm(blank);
    }
  }, [open, task]);

  if (!open) return null;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Judul tugas wajib diisi');
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    };
    try {
      const res = task
        ? await axios.put(`${API}/api/tasks/${task.id}`, payload, { headers })
        : await axios.post(`${API}/api/tasks`, payload, { headers });
      toast.success(task ? 'Tugas diperbarui' : 'Tugas dibuat');
      onSaved(res.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!window.confirm('Hapus tugas ini?')) return;
    try {
      await axios.delete(`${API}/api/tasks/${task.id}`, { headers });
      toast.success('Tugas dihapus');
      onDeleted(task.id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menghapus');
    }
  };

  const field = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{task ? 'Edit Tugas' : 'Tugas Baru'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
          <input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} className={field} placeholder="Contoh: Setup modul keuangan ERP" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={field} placeholder="Detail pekerjaan..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)} className={field}>
              <option value="">— Tanpa client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Layanan</label>
            <select value={form.service_type} onChange={(e) => set('service_type', e.target.value)} className={field}>
              {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penanggung Jawab</label>
            <select value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)} className={field}>
              <option value="">— Belum ditugaskan —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={field}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={field}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="date" value={form.due_date || ''} onChange={(e) => set('due_date', e.target.value)} className={field} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {task && canDelete && (
            <button type="button" onClick={remove} className="p-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50" title="Hapus"><Trash2 size={16} /></button>
          )}
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {saving && <Loader2 size={15} className="animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
