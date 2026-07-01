import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Pencil, Trash2, Loader2, ShieldCheck, X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'designer', label: 'Desainer' },
  { value: 'advertiser', label: 'Advertiser' },
  { value: 'business_dev', label: 'Business Development' },
];
const ROLE_LABELS = {
  owner: 'Owner', admin: 'Admin', designer: 'Desainer',
  advertiser: 'Advertiser', business_dev: 'Business Development',
};
const ROLE_BADGE = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  designer: 'bg-pink-100 text-pink-700',
  advertiser: 'bg-amber-100 text-amber-700',
  business_dev: 'bg-emerald-100 text-emerald-700',
};

const emptyForm = { email: '', name: '', role: 'designer', password: '', active: true };

export default function TeamPage() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', user }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/users`, { headers });
      setUsers(res.data || []);
    } catch {
      toast.error('Gagal memuat data tim');
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: 'create' });
  };
  const openEdit = (u) => {
    setForm({ email: u.email, name: u.name, role: u.role === 'owner' ? 'admin' : u.role, password: '', active: u.active !== false });
    setModal({ mode: 'edit', user: u });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await axios.post(`${API}/api/users`, { email: form.email.trim().toLowerCase(), name: form.name, role: form.role, password: form.password }, { headers });
        toast.success('Anggota ditambahkan');
      } else {
        const payload = { name: form.name, active: form.active };
        if (modal.user.role !== 'owner') payload.role = form.role;
        if (form.password) payload.password = form.password;
        await axios.put(`${API}/api/users/${modal.user.id}`, payload, { headers });
        toast.success('Anggota diperbarui');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  const remove = async (u) => {
    if (!window.confirm(`Hapus anggota ${u.name} (${u.email})?`)) return;
    try {
      await axios.delete(`${API}/api/users/${u.id}`, { headers });
      toast.success('Anggota dihapus');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menghapus');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-cyan-600" size={24} /> Tim Mawana
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola anggota tim dan akses login mereka</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700 transition shrink-0"
          data-testid="add-member"
        >
          <UserPlus size={16} /> Tambah Anggota
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Belum ada anggota</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${u.active !== false ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {u.active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-cyan-600 p-1.5" aria-label="Edit"><Pencil size={15} /></button>
                    {u.role !== 'owner' && (
                      <button onClick={() => remove(u)} className="text-gray-400 hover:text-red-600 p-1.5" aria-label="Hapus"><Trash2 size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.mode === 'create' ? 'Tambah Anggota' : 'Edit Anggota'}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required disabled={modal.mode === 'edit'} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none disabled:bg-gray-50 disabled:text-gray-400" />
            </div>

            {modal.user?.role !== 'owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none">
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modal.mode === 'create' ? 'Password' : 'Reset Password (kosongkan jika tidak diubah)'}
              </label>
              <input type="text" required={modal.mode === 'create'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={modal.mode === 'create' ? 'Password awal' : '••••••'}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none" />
            </div>

            {modal.mode === 'edit' && modal.user?.role !== 'owner' && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Akun aktif (bisa login)
              </label>
            )}

            <div className="flex gap-2 pt-2">
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
