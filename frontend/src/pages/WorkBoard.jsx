import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Loader2, LayoutGrid, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STATUSES, SERVICE_TYPES } from '../lib/workflow';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const API = process.env.REACT_APP_BACKEND_URL;

export default function WorkBoard() {
  const { token, user, isAdmin } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(null);

  // filters
  const [fClient, setFClient] = useState('');
  const [fService, setFService] = useState('');
  const [fAssignee, setFAssignee] = useState('');

  const [modal, setModal] = useState(null); // { task } or { task: null } for create

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, m] = await Promise.all([
        axios.get(`${API}/api/tasks`, { headers }),
        axios.get(`${API}/api/clients`, { headers }),
        axios.get(`${API}/api/members`, { headers }),
      ]);
      setTasks(t.data || []);
      setClients(c.data || []);
      setMembers(m.data || []);
    } catch {
      toast.error('Gagal memuat papan kerja');
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (fClient && t.client_id !== fClient) return false;
    if (fService && t.service_type !== fService) return false;
    if (fAssignee === '__me__' && t.assignee_id !== user?.id) return false;
    if (fAssignee && fAssignee !== '__me__' && t.assignee_id !== fAssignee) return false;
    return true;
  }), [tasks, fClient, fService, fAssignee, user]);

  const byStatus = (status) => filtered.filter((t) => t.status === status);

  const moveTask = async (taskId, status) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      await axios.put(`${API}/api/tasks/${taskId}`, { status }, { headers });
    } catch {
      toast.error('Gagal memindahkan tugas');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)));
    }
  };

  const onSaved = (saved) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
  };
  const onDeleted = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const selectClass = 'text-sm rounded-lg border border-gray-200 px-3 py-2 bg-white focus:border-cyan-500 outline-none';

  return (
    <div className="px-4 md:px-8 py-6 md:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-cyan-600" size={24} /> Papan Kerja
          </h1>
          <p className="text-gray-500 text-sm mt-1">Pantau semua pekerjaan tim — geser kartu untuk ubah status</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Muat ulang"><RefreshCw size={16} /></button>
          <button onClick={() => setModal({ task: null })}
            className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700"
            data-testid="add-task">
            <Plus size={16} /> Tugas Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select value={fClient} onChange={(e) => setFClient(e.target.value)} className={selectClass}>
          <option value="">Semua Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={fService} onChange={(e) => setFService(e.target.value)} className={selectClass}>
          <option value="">Semua Layanan</option>
          {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className={selectClass}>
          <option value="">Semua Orang</option>
          <option value="__me__">Tugas Saya</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {(fClient || fService || fAssignee) && (
          <button onClick={() => { setFClient(''); setFService(''); setFAssignee(''); }}
            className="text-sm text-cyan-600 hover:underline px-2">Reset filter</button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((col) => {
            const colTasks = byStatus(col.value);
            return (
              <div
                key={col.value}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.value); }}
                onDragLeave={() => setDragOver((d) => (d === col.value ? null : d))}
                onDrop={(e) => { e.preventDefault(); setDragOver(null); moveTask(e.dataTransfer.getData('id'), col.value); }}
                className={`rounded-xl p-3 transition-colors min-h-[140px] ${dragOver === col.value ? 'bg-cyan-50 ring-2 ring-cyan-200' : 'bg-slate-100/70'}`}
                data-testid={`column-${col.value}`}
              >
                <div className="flex items-center gap-2 px-1 mb-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                  <h3 className={`text-sm font-semibold ${col.head}`}>{col.label}</h3>
                  <span className="text-xs text-gray-400 font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('id', t.id)}
                      onClick={() => setModal({ task: t })}
                    />
                  ))}
                  {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Kosong</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal
        open={!!modal}
        task={modal?.task}
        clients={clients}
        members={members}
        canDelete={isAdmin || modal?.task?.created_by === user?.id}
        onClose={() => setModal(null)}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  );
}
