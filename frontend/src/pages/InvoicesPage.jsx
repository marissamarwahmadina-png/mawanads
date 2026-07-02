import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  FileText, Plus, Loader2, Pencil, Trash2, Download, X, Wallet, Clock, FileEdit, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const STATUSES = [
  { value: 'draft', label: 'Draft', badge: 'bg-gray-100 text-gray-600' },
  { value: 'sent', label: 'Terkirim', badge: 'bg-blue-100 text-blue-700' },
  { value: 'paid', label: 'Lunas', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'overdue', label: 'Jatuh Tempo', badge: 'bg-red-100 text-red-700' },
  { value: 'cancelled', label: 'Batal', badge: 'bg-gray-100 text-gray-400' },
];
const badgeOf = (s) => STATUSES.find((x) => x.value === s) || STATUSES[0];
const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const emptyItem = { description: '', qty: 1, unit_price: 0 };
const blank = { client_id: '', client_name: '', client_detail: '', items: [{ ...emptyItem }], tax_percent: 0, discount: 0, status: 'draft', issue_date: '', due_date: '', notes: '' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg grid place-items-center ${color}`}><Icon size={20} /></div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-900">{value}</p></div>
    </div>
  );
}

export default function InvoicesPage() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cl, st] = await Promise.all([
        axios.get(`${API}/api/invoices`, { headers }),
        axios.get(`${API}/api/clients`, { headers }),
        axios.get(`${API}/api/invoices/stats`, { headers }),
      ]);
      setInvoices(inv.data || []); setClients(cl.data || []); setStats(st.data);
    } catch { toast.error('Gagal memuat invoice'); }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...blank, items: [{ ...emptyItem }], issue_date: new Date().toISOString().slice(0, 10) }); setModal({ inv: null }); };
  const openEdit = (inv) => { setForm({ ...blank, ...inv, items: inv.items?.length ? inv.items : [{ ...emptyItem }] }); setModal({ inv }); };

  const setItem = (i, k, v) => setForm((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const calcTotal = () => {
    const sub = form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
    return sub + sub * (Number(form.tax_percent) || 0) / 100 - (Number(form.discount) || 0);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) return toast.error('Nama client wajib diisi');
    setSaving(true);
    const payload = {
      ...form, client_id: form.client_id || null,
      items: form.items.filter((it) => it.description.trim()).map((it) => ({ description: it.description, qty: Number(it.qty) || 0, unit_price: Number(it.unit_price) || 0 })),
      tax_percent: Number(form.tax_percent) || 0, discount: Number(form.discount) || 0,
      issue_date: form.issue_date || null, due_date: form.due_date || null,
    };
    try {
      if (modal.inv) await axios.put(`${API}/api/invoices/${modal.inv.id}`, payload, { headers });
      else await axios.post(`${API}/api/invoices`, payload, { headers });
      toast.success('Invoice disimpan'); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Gagal menyimpan'); }
    setSaving(false);
  };

  const remove = async (inv) => {
    if (!window.confirm(`Hapus invoice ${inv.number}?`)) return;
    try { await axios.delete(`${API}/api/invoices/${inv.id}`, { headers }); toast.success('Dihapus'); load(); }
    catch { toast.error('Gagal menghapus'); }
  };
  const downloadPdf = (inv) => window.open(`${API}/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('mawana_admin_token')}`, '_blank');

  const onClientPick = (id) => {
    const c = clients.find((x) => x.id === id);
    setForm((p) => ({ ...p, client_id: id, client_name: c ? c.name : p.client_name }));
  };

  const fld = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-cyan-600" size={24} /> Invoice & Omzet</h1>
          <p className="text-gray-500 text-sm mt-1">Buat invoice untuk client & pantau pendapatan</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700 shrink-0" data-testid="add-invoice"><Plus size={16} /> Invoice Baru</button>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Wallet} label="Omzet (Lunas)" value={fmtRp(stats.revenue_paid)} color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={Clock} label="Belum Dibayar" value={fmtRp(stats.outstanding)} color="bg-amber-50 text-amber-600" />
            <StatCard icon={FileEdit} label="Draft" value={fmtRp(stats.draft_value)} color="bg-gray-100 text-gray-500" />
            <StatCard icon={TrendingUp} label="Total Invoice" value={stats.count} color="bg-cyan-50 text-cyan-600" />
          </div>
          {stats.monthly?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Omzet per Bulan (Lunas)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip formatter={(v) => [fmtRp(v), 'Omzet']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Belum ada invoice</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr><th className="px-4 py-3 font-medium">No</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium text-right">Total</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-600 font-semibold">{inv.number}</td>
                  <td className="px-4 py-3 text-gray-900">{inv.client_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtRp(inv.total)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeOf(inv.status).badge}`}>{badgeOf(inv.status).label}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{inv.issue_date || '-'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => downloadPdf(inv)} className="text-gray-400 hover:text-cyan-600 p-1.5" title="Download PDF"><Download size={15} /></button>
                    <button onClick={() => openEdit(inv)} className="text-gray-400 hover:text-cyan-600 p-1.5" title="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(inv)} className="text-gray-400 hover:text-red-600 p-1.5" title="Hapus"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h2 className="font-bold text-gray-900">{modal.inv ? `Edit ${modal.inv.number}` : 'Invoice Baru'}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select value={form.client_id} onChange={(e) => onClientPick(e.target.value)} className={fld}>
                    <option value="">— Ketik manual —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client *</label>
                  <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={fld} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detail Client (alamat/kontak)</label>
                <textarea rows={2} value={form.client_detail} onChange={(e) => setForm({ ...form, client_detail: e.target.value })} className={fld} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Item</label>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="flex gap-2">
                      <input placeholder="Deskripsi" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} className={`${fld} flex-1`} />
                      <input type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} className={`${fld} w-20`} />
                      <input type="number" placeholder="Harga" value={it.unit_price} onChange={(e) => setItem(i, 'unit_price', e.target.value)} className={`${fld} w-36`} />
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 px-1"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-cyan-600 hover:underline inline-flex items-center gap-1"><Plus size={14} /> Tambah item</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Pajak (%)</label><input type="number" value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} className={fld} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Diskon (Rp)</label><input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className={fld} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fld}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Total</label><div className="px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 font-bold text-sm">{fmtRp(calcTotal())}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Terbit</label><input type="date" value={form.issue_date || ''} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={fld} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label><input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={fld} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fld} /></div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t bg-gray-50">
              <div className="flex-1" />
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white text-sm">Batal</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-2 text-sm">{saving && <Loader2 size={15} className="animate-spin" />} Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
