import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STATUSES } from '../lib/workflow';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const API = process.env.REACT_APP_BACKEND_URL;

export default function MyTasks() {
  const { token, user, isAdmin } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, m] = await Promise.all([
        axios.get(`${API}/api/tasks?mine=true`, { headers }),
        axios.get(`${API}/api/clients`, { headers }),
        axios.get(`${API}/api/members`, { headers }),
      ]);
      setTasks(t.data || []);
      setClients(c.data || []);
      setMembers(m.data || []);
    } catch {
      toast.error('Gagal memuat tugas');
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const onSaved = (saved) => {
    // Task may no longer be mine after edit — drop it if reassigned away.
    setTasks((prev) => {
      const list = prev.some((t) => t.id === saved.id)
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [saved, ...prev];
      return list.filter((t) => t.assignee_id === user?.id);
    });
  };
  const onDeleted = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const active = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="text-cyan-600" size={24} /> Tugas Saya
        </h1>
        <p className="text-gray-500 text-sm mt-1">{active.length} tugas aktif • {done.length} selesai</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-300" />
          Belum ada tugas untuk kamu 🎉
        </div>
      ) : (
        <div className="space-y-6">
          {STATUSES.filter((s) => s.value !== 'done').map((col) => {
            const colTasks = active.filter((t) => t.status === col.value);
            if (colTasks.length === 0) return null;
            return (
              <div key={col.value}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                  <h3 className={`text-sm font-semibold ${col.head}`}>{col.label}</h3>
                  <span className="text-xs text-gray-400">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((t) => <TaskCard key={t.id} task={t} onClick={() => setModal({ task: t })} />)}
                </div>
              </div>
            );
          })}

          {done.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-emerald-600">Selesai</h3>
                <span className="text-xs text-gray-400">{done.length}</span>
              </div>
              <div className="space-y-2.5 opacity-70">
                {done.map((t) => <TaskCard key={t.id} task={t} onClick={() => setModal({ task: t })} />)}
              </div>
            </div>
          )}
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
