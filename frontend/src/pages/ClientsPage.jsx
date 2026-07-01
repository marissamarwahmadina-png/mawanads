import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, Loader2, X, Phone, User2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SERVICE_TYPES, findOpt } from '../lib/workflow';

const API = process.env.REACT_APP_BACKEND_URL;
const blank = { name: '', services: [], pic: '', contact: '', notes: '', status: 'active' };

export default function ClientsPage() {
  const { token, isAdmin } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { client } | { client: null }
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/clients`, { headers });
      setClients(res.data || []);
    } catch {
      toast.error('Gagal memuat client');
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(blank); setModal({ client: null }); };
  const openEdit = (c) => {
    setForm({ name: c.name, services: c.services || [], pic: c.pic || '', contact: c.contact || '', notes: c.notes || '', status: c.status || 'active' });
    setModal({ client: c });
  };
  const toggleService = (v) => setForm((p) => ({
    ...p, services: p.services.includes(v) ? p.services.filter((s) => s !== v) : [...p.services, v],
  }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nama client wajib diisi');
    setSaving(true);
    try {
      if (modal.client) {
        await axios.put(`${API}/api/clients/${modal.client.id}`, form, { headers });
      } else {
        await axios.post(`${API}/api/clients`, form, { headers });
      }
      toast.success('Client disimpan');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  const remove = async (c) => {
    if (!window.confirm(`Hapus client ${c.name}? Tugas terkait tidak ikut terhapus.`)) return;
    try {
      await axios.delete(`${API}/api/clients/${c.id}`, { headers });
      toast.success('Client dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const field = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-cyan-600" size={24} /> Clients
          </h1>
          <p className="text-gray-500 text-sm mt-1">Daftar client dan layanan yang mereka ambil</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700 shrink-0" data-testid="add-client">
            <Plus size={16} /> Tambah Client
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : clients.length === 0 ? (
        <div className="py-16 text-center text-gray-400">Belum ada client</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.status !== 'active' && <span className="text-[11px] text-gray-400">({c.status})</span>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-cyan-600 p-1"><Pencil size={15} /></button>
                    <button onClick={() => remove(c)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {(c.services || []).map((s) => {
                  const svc = findOpt(SERVICE_TYPES, s);
                  return <span key={s} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${svc?.color || 'bg-gray-100 text-gray-600'}`}>{svc?.label || s}</span>;
                })}
                {(!c.services || c.services.length === 0) && <span className="text-xs text-gray-400">Belum ada layanan</span>}
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-500">
                {c.pic && <p className="flex items-center gap-1.5"><User2 size={13} /> {c.pic}</p>}
                {c.contact && <p className="flex items-center gap-1.5"><Phone size={13} /> {c.contact}</p>}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="font-medium text-cyan-600">{c.open_tasks || 0}</span> tugas aktif
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal.client ? 'Edit Client' : 'Tambah Client'}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Layanan</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((s) => {
                  const on = form.services.includes(s.value);
                  return (
                    <button type="button" key={s.value} onClick={() => toggleService(s.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${on ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIC / Kontak Person</label>
                <input value={form.pic} onChange={(e) => setForm({ ...form, pic: e.target.value })} className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Kontak</label>
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={field} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {saving && <Loader2 size={15} className="animate-spin" />} Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
