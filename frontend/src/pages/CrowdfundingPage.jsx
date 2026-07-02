import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { HandHeart, Plus, Loader2, Pencil, Trash2, X, Users, HeartHandshake, Wallet, Target, ExternalLink, DownloadCloud, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const PLATFORMS = [
  { value: 'kitabisa', label: 'Kitabisa', color: 'bg-teal-100 text-teal-700', bar: '#14b8a6' },
  { value: 'niatbaik', label: 'NiatBaik', color: 'bg-blue-100 text-blue-700', bar: '#3b82f6' },
  { value: 'kawanbantu', label: 'KawanBantu', color: 'bg-amber-100 text-amber-700', bar: '#f59e0b' },
  { value: 'raihmimpi', label: 'RaihMimpi', color: 'bg-purple-100 text-purple-700', bar: '#a855f7' },
  { value: 'sharinghappiness', label: 'Sharing Happiness', color: 'bg-pink-100 text-pink-700', bar: '#ec4899' },
  { value: 'benihbaik', label: 'BenihBaik', color: 'bg-emerald-100 text-emerald-700', bar: '#10b981' },
  { value: 'wecare', label: 'WeCare.id', color: 'bg-rose-100 text-rose-700', bar: '#f43f5e' },
  { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-100 text-gray-600', bar: '#94a3b8' },
];
const STATUSES = [
  { value: 'active', label: 'Aktif', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'paused', label: 'Jeda', badge: 'bg-amber-100 text-amber-700' },
  { value: 'ended', label: 'Selesai', badge: 'bg-gray-100 text-gray-500' },
];
const pf = (v) => PLATFORMS.find((x) => x.value === v) || PLATFORMS[PLATFORMS.length - 1];
const sf = (v) => STATUSES.find((x) => x.value === v) || STATUSES[0];
const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID');
const blank = { name: '', platform: 'kitabisa', url: '', fundraiser: '', fundraiser_count: 0, donor_count: 0, raised: 0, target: 0, status: 'active', notes: '' };

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg grid place-items-center ${color}`}><Icon size={20} /></div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-900">{value}</p></div>
    </div>
  );
}

export default function CrowdfundingPage() {
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
        axios.get(`${API}/api/campaigns`, { headers }),
        axios.get(`${API}/api/campaigns/stats`, { headers }),
      ]);
      setItems(c.data || []); setStats(s.data);
    } catch { toast.error('Gagal memuat data campaign'); }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(blank); setModal({ c: null }); };
  const openEdit = (c) => { setForm({ ...blank, ...c }); setModal({ c }); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nama campaign wajib diisi');
    setSaving(true);
    const payload = {
      ...form,
      fundraiser_count: Number(form.fundraiser_count) || 0, donor_count: Number(form.donor_count) || 0,
      raised: Number(form.raised) || 0, target: Number(form.target) || 0,
    };
    try {
      if (modal.c) await axios.put(`${API}/api/campaigns/${modal.c.id}`, payload, { headers });
      else await axios.post(`${API}/api/campaigns`, payload, { headers });
      toast.success('Campaign disimpan'); setModal(null); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Gagal menyimpan'); }
    setSaving(false);
  };
  const remove = async (c) => {
    if (!window.confirm(`Hapus campaign "${c.name}"?`)) return;
    try { await axios.delete(`${API}/api/campaigns/${c.id}`, { headers }); toast.success('Dihapus'); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || 'Gagal menghapus'); }
  };

  const [scraping, setScraping] = useState(false);
  const scrapeFromUrl = async () => {
    if (!form.url.trim()) return toast.error('Isi link campaign dulu');
    setScraping(true);
    try {
      const res = await axios.post(`${API}/api/campaigns/scrape`, { url: form.url.trim() }, { headers });
      if (res.data.ok) {
        const d = res.data.data;
        setForm((p) => ({
          ...p, platform: res.data.platform || p.platform,
          name: d.name || p.name, raised: d.raised ?? p.raised, target: d.target ?? p.target,
          donor_count: d.donor_count ?? p.donor_count, fundraiser: d.fundraiser || p.fundraiser,
        }));
        toast.success('Data terisi otomatis dari link');
      } else {
        toast.error(res.data.error || 'Belum bisa auto-ambil untuk platform ini');
      }
    } catch (err) { toast.error(err?.response?.data?.detail || 'Gagal mengambil data'); }
    setScraping(false);
  };

  const [syncingId, setSyncingId] = useState(null);
  const syncCard = async (c) => {
    setSyncingId(c.id);
    try {
      await axios.post(`${API}/api/campaigns/${c.id}/sync`, {}, { headers });
      toast.success('Data campaign diperbarui'); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Gagal sync'); }
    setSyncingId(null);
  };

  const chartData = (stats?.per_platform || []).map((p) => ({ name: pf(p.platform).label, raised: p.raised, fill: pf(p.platform).bar }));
  const fld = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><HandHeart className="text-cyan-600" size={24} /> Monitor Crowdfunding</h1>
          <p className="text-gray-500 text-sm mt-1">Pantau semua campaign yang dioptimasi — lintas platform, dalam 1 layar</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-700 shrink-0" data-testid="add-campaign"><Plus size={16} /> Tambah Campaign</button>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Stat icon={Wallet} label="Total Dana Terhimpun" value={fmtRp(stats.totals.raised)} color="bg-emerald-50 text-emerald-600" />
            <Stat icon={Users} label="Total Donatur" value={fmtNum(stats.totals.donor)} color="bg-blue-50 text-blue-600" />
            <Stat icon={HeartHandshake} label="Total Fundraiser" value={fmtNum(stats.totals.fundraiser)} color="bg-pink-50 text-pink-600" />
            <Stat icon={Target} label="Campaign Aktif" value={`${stats.totals.active} / ${stats.totals.count}`} color="bg-cyan-50 text-cyan-600" />
          </div>
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Dana Terhimpun per Platform</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip formatter={(v) => [fmtRp(v), 'Terhimpun']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="raised" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
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
        <div className="py-16 text-center text-gray-400">Belum ada campaign</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => {
            const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
            const platform = pf(c.platform);
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${platform.color}`}>{platform.label}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${sf(c.status).badge}`}>{sf(c.status).label}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1.5 leading-snug">{c.name}</h3>
                    {c.fundraiser && <p className="text-xs text-gray-500 mt-0.5">oleh {c.fundraiser}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.url && <button onClick={() => syncCard(c)} disabled={syncingId === c.id} className="text-gray-400 hover:text-cyan-600 p-1" title="Sync data dari link">{syncingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}</button>}
                    {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-cyan-600 p-1"><ExternalLink size={15} /></a>}
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-cyan-600 p-1"><Pencil size={15} /></button>
                    {canDelete && <button onClick={() => remove(c)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-gray-900">{fmtRp(c.raised)}</span>
                    <span className="text-xs text-gray-500">{pct}% dari {fmtRp(c.target)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Users size={13} /> {fmtNum(c.donor_count)} donatur</span>
                  <span className="inline-flex items-center gap-1"><HeartHandshake size={13} /> {fmtNum(c.fundraiser_count)} fundraiser</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setModal(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal.c ? 'Edit Campaign' : 'Tambah Campaign'}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Campaign *</label><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fld} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={fld}>{PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fld}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Campaign</label>
              <div className="flex gap-2">
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={`${fld} flex-1`} placeholder="https://raihmimpi.id/campaign/..." />
                <button type="button" onClick={scrapeFromUrl} disabled={scraping} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 text-sm font-medium hover:bg-cyan-100 disabled:opacity-60 whitespace-nowrap">
                  {scraping ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} Ambil Data
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Auto-isi dari link (raihmimpi ✓). Platform lain: isi manual.</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fundraiser / Penyelenggara</label><input value={form.fundraiser} onChange={(e) => setForm({ ...form, fundraiser: e.target.value })} className={fld} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Dana Terhimpun (Rp)</label><input type="number" value={form.raised} onChange={(e) => setForm({ ...form, raised: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Target (Rp)</label><input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Donatur</label><input type="number" value={form.donor_count} onChange={(e) => setForm({ ...form, donor_count: e.target.value })} className={fld} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Fundraiser</label><input type="number" value={form.fundraiser_count} onChange={(e) => setForm({ ...form, fundraiser_count: e.target.value })} className={fld} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fld} /></div>
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
