import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Loader2, Palette, RefreshCw, Calendar, Film, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DESIGN_STATUSES, DESIGN_CATEGORIES, DESIGN_PRIORITIES, findOpt } from '../lib/design';
import { formatDate, isOverdue } from '../lib/workflow';
import DesignRequestModal from '../components/DesignRequestModal';

const API = process.env.REACT_APP_BACKEND_URL;

function RequestCard({ req, onClick, onDragStart }) {
  const cat = findOpt(DESIGN_CATEGORIES, req.category);
  const prio = findOpt(DESIGN_PRIORITIES, req.priority);
  const overdue = isOverdue(req.deadline, req.status === 'selesai' ? 'done' : req.status);
  const initials = (req.designer_name || '').slice(0, 2).toUpperCase();
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-cyan-300 transition cursor-pointer">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono font-semibold text-cyan-600">{req.number}</span>
        {prio && <span className={`h-2 w-2 rounded-full ${prio.dot}`} title={prio.label} />}
      </div>
      <p className="text-sm font-medium text-gray-900 leading-snug">{req.title}</p>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {cat && <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>}
        {req.results?.length > 0 && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 size={11} />{req.results.length} hasil</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {req.footage_link && <Film size={13} className="text-gray-400" title="Ada footage" />}
        {req.brief_link && <FileText size={13} className="text-gray-400" title="Ada brief" />}
      </div>
      <div className="flex items-center justify-between mt-2">
        {req.deadline ? (
          <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            <Calendar size={12} /> {formatDate(req.deadline)}
          </span>
        ) : <span />}
        {req.designer_name && (
          <span className="h-6 w-6 rounded-full bg-cyan-600 text-white grid place-items-center text-[10px] font-bold" title={req.designer_name}>{initials}</span>
        )}
      </div>
    </div>
  );
}

export default function DesignBoard() {
  const { token, user, isAdmin } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(null);
  const [fDesigner, setFDesigner] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        axios.get(`${API}/api/design-requests`, { headers }),
        axios.get(`${API}/api/members`, { headers }),
      ]);
      setItems(r.data || []);
      setMembers(m.data || []);
    } catch {
      toast.error('Gagal memuat pengajuan desain');
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((r) => {
    if (fDesigner === '__me__' && r.designer_id !== user?.id) return false;
    if (fDesigner && fDesigner !== '__me__' && r.designer_id !== fDesigner) return false;
    return true;
  }), [items, fDesigner, user]);

  const move = async (id, status) => {
    const it = items.find((x) => x.id === id);
    if (!it || it.status === status) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      await axios.put(`${API}/api/design-requests/${id}`, { status }, { headers });
    } catch {
      toast.error('Gagal memindahkan');
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: it.status } : x)));
    }
  };

  const onSaved = (saved) => setItems((prev) => (prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]));
  const onDeleted = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="px-4 md:px-8 py-6 md:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Palette className="text-cyan-600" size={24} /> Pengajuan Desain</h1>
          <p className="text-gray-500 text-sm mt-1">Produksi desain — dari brief sampai hasil final. Geser kartu untuk ubah status.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={fDesigner} onChange={(e) => setFDesigner(e.target.value)} className="text-sm rounded-lg border border-gray-200 px-3 py-2 bg-white outline-none focus:border-cyan-500">
            <option value="">Semua Desainer</option>
            <option value="__me__">Tugas Saya</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={load} className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><RefreshCw size={16} /></button>
          <button onClick={() => setModal({ request: null })} className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700" data-testid="add-design">
            <Plus size={16} /> Pengajuan Baru
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {DESIGN_STATUSES.map((col) => {
            const colItems = filtered.filter((r) => r.status === col.value);
            return (
              <div key={col.value}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.value); }}
                onDragLeave={() => setDragOver((d) => (d === col.value ? null : d))}
                onDrop={(e) => { e.preventDefault(); setDragOver(null); move(e.dataTransfer.getData('id'), col.value); }}
                className={`rounded-xl p-3 min-h-[140px] transition-colors ${dragOver === col.value ? 'bg-cyan-50 ring-2 ring-cyan-200' : 'bg-slate-100/70'}`}>
                <div className="flex items-center gap-2 px-1 mb-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                  <h3 className={`text-sm font-semibold ${col.head}`}>{col.label}</h3>
                  <span className="text-xs text-gray-400 font-medium">{colItems.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colItems.map((r) => (
                    <RequestCard key={r.id} req={r}
                      onDragStart={(e) => e.dataTransfer.setData('id', r.id)}
                      onClick={() => setModal({ request: r })} />
                  ))}
                  {colItems.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Kosong</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DesignRequestModal
        open={!!modal}
        request={modal?.request}
        members={members}
        canDelete={isAdmin || modal?.request?.created_by === user?.id}
        onClose={() => setModal(null)}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  );
}
