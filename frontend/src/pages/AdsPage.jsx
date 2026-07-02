import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Megaphone, Plus, Loader2, Pencil, Trash2, X, TrendingUp, DollarSign, Target, Rocket, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const PLATFORMS = [
  { value: 'meta', label: 'Meta Ads', color: 'bg-blue-100 text-blue-700', bar: '#3b82f6' },
  { value: 'google', label: 'Google Ads', color: 'bg-red-100 text-red-700', bar: '#ef4444' },
  { value: 'tiktok', label: 'TikTok Ads', color: 'bg-gray-900 text-white', bar: '#0f172a' },
  { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-100 text-gray-600', bar: '#94a3b8' },
];
const STATUSES = [
  { value: 'active', label: 'Aktif', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'paused', label: 'Jeda', badge: 'bg-amber-100 text-amber-700' },
  { value: 'ended', label: 'Selesai', badge: 'bg-gray-100 text-gray-500' },
];
const OBJECTIVES = [
  { value: 'fundraising', label: 'Fundraising' }, { value: 'awareness', label: 'Awareness' },
  { value: 'traffic', label: 'Traffic' }, { value: 'leads', label: 'Leads' },
  { value: 'conversion', label: 'Conversion' }, { value: 'lainnya', label: 'Lainnya' },
];
const pf = (v) => PLATFORMS.find((x) => x.value === v) || PLATFORMS[PLATFORMS.length - 1];
const sf = (v) => STATUSES.find((x) => x.value === v) || STATUSES[0];
const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const blank = { name: '', platform: 'meta', objective: 'fundraising', client_name: '', spend: 0, revenue: 0, results: 0, target_roas: 0, status: 'active', start_date: '', end_date: '', notes: '' };

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg grid place-items-center ${color}`}><Icon size={20} /></div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-900">{value}</p></div>
    </div>
  );
}

function RoasBadge({ roas, target }) {
  if (target > 0 && roas >= target) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><Rocket size={11} /> Scale Up</span>;
  if (target > 0 && roas < target) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={11} /> Optimasi</span>;
  return null;
}

export default function AdsPage() {
  const { token, isAdmin, role } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const canDelete = isAdmin || role === 'advertiser';
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        axios.get(`${API}/api/ad-campaigns`, { headers }),
        axios.get(`${API}/api/ad-campaigns/stats`, { headers }),
      ]);
      setItems(c.data || []); setStats(s.data);
    } catch { toast.error('Gagal memuat data iklan'); }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(blank); setModal({ a: null }); };
  const openEdit = (a) => { setForm({ ...blank, ...a }); setModal({ a }); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nama campaign wajib diisi');
    setSaving(true);
    const payload = { ...form, spend: Number(form.spend) || 0, revenue: Number(form.revenue) || 0, results: Number(form.results) || 0, target_roas: Number(form.target_roas) || 0, start_date: form.start_date || null, end_date: form.end_date || null };
    try {
      if (modal.a) await axios.put(`${API}/api/ad-campaigns/${modal.a.id}`, payload, { headers });
      else await axios.post(`${API}/api/ad-campaigns`, payload, { headers });
      toast.success('Campaign disimpan'); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Gagal menyimpan'); }
    setSaving(false);
  };
  const remove = async (a) => {
    if (!window.confirm(`Hapus campaign "${a.name}"?`)) return;
    try { await axios.delete(`${API}/api/ad-campaigns/${a.id}`, { headers }); toast.success('Dihapus'); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || 'Gagal menghapus'); }
  };

  const chartData = (stats?.per_platform || []).map((p) => ({ name: pf(p.platform).label, roas: p.roas, fill: pf(p.platform).bar }));
  const fld = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Megaphone className="text-cyan-600" size={24} /> Monitor Iklan (ROAS)</h1>
          <p className="text-gray-500 text-sm mt-1">Pantau iklan berjalan, jaga ROAS, scale-up terukur</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700 shrink-0" data-testid="add-ad"><Plus size={16} /> Tambah Iklan</button>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Stat icon={DollarSign} label="Total Spend" value={fmtRp(stats.totals.spend)} color="bg-red-50 text-red-600" />
            <Stat icon={TrendingUp} label="Total Revenue" value={fmtRp(stats.totals.revenue)} color="bg-emerald-50 text-emerald-600" />
            <Stat icon={Target} label="ROAS Keseluruhan" value={`${stats.totals.roas}x`} color="bg-cyan-50 text-cyan-600" />
            <Stat icon={Rocket} label="Iklan Aktif" value={`${stats.totals.active} / ${stats.totals.count}`} color="bg-blue-50 text-blue-600" />
          </div>
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">ROAS per Platform</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
                    <Tooltip formatter={(v) => [`${v}x`, 'ROAS']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="roas" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-400">Belum ada campaign iklan</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((a) => {
            const roas = a.spend > 0 ? Math.round((a.revenue / a.spend) * 100) / 100 : 0;
            const platform = pf(a.platform);
            const healthy = a.target_roas > 0 ? roas >= a.target_roas : roas >= 1;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${platform.color}`}>{platform.label}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${sf(a.status).badge}`}>{sf(a.status).label}</span>
                      <RoasBadge roas={roas} target={a.target_roas} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1.5 leading-snug">{a.name}</h3>
                    {a.client_name && <p className="text-xs text-gray-500 mt-0.5">{a.client_name}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-cyan-600 p-1"><Pencil size={15} /></button>
                    {canDelete && <button onClick={() => remove(a)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-gray-50 rounded-lg py-2"><p className="text-[11px] text-gray-500">Spend</p><p className="text-sm font-semibold text-gray-900">{fmtRp(a.spend)}</p></div>
                  <div className="bg-gray-50 rounded-lg py-2"><p className="text-[11px] text-gray-500">Revenue</p><p className="text-sm font-semibold text-gray-900">{fmtRp(a.revenue)}</p></div>
                  <div className={`rounded-lg py-2 ${healthy ? 'bg-emerald-50' : 'bg-amber-50'}`}><p className="text-[11px] text-gray-500">ROAS</p><p className={`text-sm font-bold ${healthy ? 'text-emerald-700' : 'text-amber-700'}`}>{roas}x</p></div>
                </div>
                {a.target_roas > 0 && <p className="text-[11px] text-gray-400 mt-2 text-center">Target ROAS: {a.target_roas}x • {a.results || 0} hasil</p>}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal.a ? 'Edit Iklan' : 'Tambah Iklan'}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Campaign *</label><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fld} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={fld}>{PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                <select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} className={fld}>{OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fld}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Client</label><input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={fld} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Spend (Rp)</label><input type="number" value={form.spend} onChange={(e) => setForm({ ...form, spend: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Revenue (Rp)</label><input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Hasil</label><input type="number" value={form.results} onChange={(e) => setForm({ ...form, results: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Target ROAS</label><input type="number" step="0.1" value={form.target_roas} onChange={(e) => setForm({ ...form, target_roas: e.target.value })} className={fld} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label><input type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label><input type="date" value={form.end_date || ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={fld} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">{saving && <Loader2 size={15} className="animate-spin" />} Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
