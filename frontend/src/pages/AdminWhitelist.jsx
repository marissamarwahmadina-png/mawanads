import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Shield, Plus, Pencil, Trash2, RefreshCw, FileText, Upload,
  ChevronDown, ChevronUp, X, Users, DollarSign, TrendingUp, Download
} from 'lucide-react';
import AdminNav from '../components/AdminNav';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const MONTHS = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const fmtRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

// ─── Modal wrapper ───
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid="modal-close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Form field ───
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// ─── User Form (Add/Edit) ───
function UserForm({ user, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cashback_percentage: 10, referral: '', notes: '',
    bank_name: '', account_name: '', account_number: '',
    ...(user || {})
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div>
      <Field label="Nama *"><Input data-testid="wl-form-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nama lengkap" /></Field>
      <Field label="Email"><Input data-testid="wl-form-email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@contoh.com" /></Field>
      <Field label="Telepon / WhatsApp"><Input data-testid="wl-form-phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" /></Field>
      <Field label="Cashback (%)"><Input data-testid="wl-form-cb" type="number" min={0} max={100} step={0.1} value={form.cashback_percentage} onChange={e => set('cashback_percentage', parseFloat(e.target.value) || 0)} /></Field>
      <Field label="Referral"><Input data-testid="wl-form-referral" value={form.referral} onChange={e => set('referral', e.target.value)} placeholder="Nama referral / affiliate" /></Field>
      <div className="border-t pt-3 mt-3 mb-1"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informasi Rekening</p></div>
      <Field label="Nama Bank"><Input data-testid="wl-form-bank" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="BCA, BRI, Mandiri, dll" /></Field>
      <Field label="Nama Rekening"><Input data-testid="wl-form-account-name" value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="Nama pemilik rekening" /></Field>
      <Field label="Nomor Rekening"><Input data-testid="wl-form-account-number" value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="Nomor rekening" /></Field>
      <Field label="Catatan"><Input data-testid="wl-form-notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan opsional" /></Field>
      <div className="flex gap-2 pt-2">
        <Button data-testid="wl-form-save" disabled={saving || !form.name.trim()} onClick={() => onSave(form)} className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1">
          {saving ? <RefreshCw size={14} className="animate-spin mr-1" /> : null}{user ? 'Simpan' : 'Tambah User'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}

// ─── Spend Form (Add/Edit) ───
function SpendForm({ spend, onSave, onCancel, saving }) {
  const now = new Date();
  const [form, setForm] = useState({
    month: now.getMonth() + 1, year: now.getFullYear(), spend_amount: 0, notes: '',
    ...(spend || {})
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bulan">
          <select data-testid="spend-form-month" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" value={form.month} onChange={e => set('month', parseInt(e.target.value))}>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Tahun"><Input data-testid="spend-form-year" type="number" value={form.year} onChange={e => set('year', parseInt(e.target.value) || now.getFullYear())} /></Field>
      </div>
      <Field label="Jumlah Ad Spend (Rp)"><Input data-testid="spend-form-amount" type="number" min={0} value={form.spend_amount} onChange={e => set('spend_amount', parseFloat(e.target.value) || 0)} /></Field>
      <Field label="Catatan"><Input data-testid="spend-form-notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan opsional" /></Field>
      <div className="flex gap-2 pt-2">
        <Button data-testid="spend-form-save" disabled={saving || !form.spend_amount} onClick={() => onSave(form)} className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1">
          {saving ? <RefreshCw size={14} className="animate-spin mr-1" /> : null}{spend ? 'Simpan' : 'Tambah Spend'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}

// ─── Spend Row ───
function SpendRow({ spend, onEdit, onDelete, onUploadProof, deleting }) {
  const fileRef = React.useRef(null);
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 text-sm" data-testid={`spend-row-${spend.id}`}>
      <td className="py-2 px-3">{MONTHS[spend.month]} {spend.year}</td>
      <td className="py-2 px-3 text-right font-medium">{fmtRp(spend.spend_amount)}</td>
      <td className="py-2 px-3 text-center">{spend.cashback_percentage}%</td>
      <td className="py-2 px-3 text-right font-medium text-green-700">{fmtRp(spend.cashback_amount)}</td>
      <td className="py-2 px-3 text-center">
        {spend.proof_url ? (
          <a href={`${API}${spend.proof_url}`} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline text-xs" data-testid={`proof-link-${spend.id}`}>Lihat</a>
        ) : <span className="text-gray-400 text-xs">-</span>}
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center justify-end gap-1">
          <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf" onChange={e => { if (e.target.files[0]) onUploadProof(spend.id, e.target.files[0]); }} />
          <button onClick={() => fileRef.current?.click()} className="p-1 rounded hover:bg-blue-50 text-blue-500" title="Upload Bukti" data-testid={`upload-proof-${spend.id}`}><Upload size={14} /></button>
          <button onClick={() => onEdit(spend)} className="p-1 rounded hover:bg-yellow-50 text-yellow-600" title="Edit" data-testid={`edit-spend-${spend.id}`}><Pencil size={14} /></button>
          {deleting === spend.id ? (
            <div className="flex gap-0.5">
              <button onClick={() => onDelete(spend.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs" data-testid={`confirm-delete-spend-${spend.id}`}>Ya</button>
              <button onClick={() => onDelete(null)} className="px-1.5 py-0.5 rounded bg-gray-200 text-xs">Batal</button>
            </div>
          ) : (
            <button onClick={() => onDelete(spend.id, true)} className="p-1 rounded hover:bg-red-50 text-red-400" title="Hapus" data-testid={`delete-spend-${spend.id}`}><Trash2 size={14} /></button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── User Card with Expandable Spends ───
function UserCard({ user, stats, onEdit, onDelete, onRefresh, deleting }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [spends, setSpends] = useState([]);
  const [loadingSpends, setLoadingSpends] = useState(false);
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [editingSpend, setEditingSpend] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingSpend, setDeletingSpend] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const loadSpends = useCallback(async () => {
    setLoadingSpends(true);
    try {
      const res = await axios.get(`${API}/api/admin/whitelist/${user.id}/spends`, { headers });
      setSpends(res.data);
    } catch { toast.error('Gagal memuat data spending'); }
    setLoadingSpends(false);
  }, [user.id]);

  useEffect(() => { if (expanded) loadSpends(); }, [expanded, loadSpends]);

  const handleSaveSpend = async (form) => {
    setSaving(true);
    try {
      if (editingSpend) {
        await axios.put(`${API}/api/admin/whitelist/spends/${editingSpend.id}`, form, { headers });
        toast.success('Spending diupdate');
      } else {
        await axios.post(`${API}/api/admin/whitelist/${user.id}/spends`, form, { headers });
        toast.success('Spending ditambahkan');
      }
      setShowSpendForm(false);
      setEditingSpend(null);
      loadSpends();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan spending');
    }
    setSaving(false);
  };

  const handleDeleteSpend = async (id, confirm) => {
    if (confirm) { setDeletingSpend(id); return; }
    if (!id) { setDeletingSpend(null); return; }
    try {
      await axios.delete(`${API}/api/admin/whitelist/spends/${id}`, { headers });
      toast.success('Spending dihapus');
      loadSpends();
      onRefresh();
    } catch { toast.error('Gagal menghapus spending'); }
    setDeletingSpend(null);
  };

  const handleUploadProof = async (spendId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await axios.post(`${API}/api/admin/whitelist/spends/${spendId}/proof`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bukti pembayaran diupload');
      loadSpends();
    } catch { toast.error('Gagal upload bukti'); }
  };

  const handleDownloadPdf = () => {
    window.open(`${API}/api/admin/whitelist/${user.id}/pdf`, '_blank');
  };

  return (
    <Card className="overflow-hidden" data-testid={`wl-user-card-${user.id}`}>
      <div className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-cyan-700" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate" data-testid={`wl-user-name-${user.id}`}>{user.name}</h3>
            <p className="text-xs text-gray-500 truncate">
              {user.referral && <span className="text-cyan-600 font-medium">Ref: {user.referral}</span>}
              {user.referral && user.email && ' · '}
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">CB</p>
            <p className="text-sm font-bold text-cyan-700">{user.cashback_percentage}%</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500">Total Spend</p>
            <p className="text-sm font-medium">{fmtRp(stats.total_spend)}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500">Total Cashback</p>
            <p className="text-sm font-medium text-green-700">{fmtRp(stats.total_cashback)}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t">
          {/* User info & actions */}
          <div className="px-5 py-3 bg-gray-50/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Tel: <b className="text-gray-700">{user.phone || '-'}</b></span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Email: <b className="text-gray-700">{user.email || '-'}</b></span>
            {user.bank_name && <><span className="text-gray-300">|</span><span className="text-gray-500">Bank: <b className="text-gray-700">{user.bank_name} - {user.account_name} ({user.account_number})</b></span></>}
            {user.notes && <><span className="text-gray-300">|</span><span className="text-gray-500">Note: {user.notes}</span></>}
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDownloadPdf()} data-testid={`pdf-user-${user.id}`}>
                <FileText size={12} className="mr-1" />PDF
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(user)} data-testid={`edit-user-${user.id}`}>
                <Pencil size={12} className="mr-1" />Edit
              </Button>
              {deleting === user.id ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onDelete(user.id)} data-testid={`confirm-delete-user-${user.id}`}>Hapus</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onDelete(null)}>Batal</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-600" onClick={() => onDelete(user.id, true)} data-testid={`delete-user-${user.id}`}>
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          </div>

          {/* Spends table */}
          <div className="px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Data Spending Bulanan</h4>
              <Button size="sm" className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => { setEditingSpend(null); setShowSpendForm(true); }} data-testid={`add-spend-${user.id}`}>
                <Plus size={12} className="mr-1" />Tambah
              </Button>
            </div>

            {showSpendForm && (
              <div className="mb-3 p-3 rounded-lg border bg-cyan-50/30">
                <SpendForm spend={editingSpend} saving={saving} onSave={handleSaveSpend} onCancel={() => { setShowSpendForm(false); setEditingSpend(null); }} />
              </div>
            )}

            {loadingSpends ? (
              <div className="py-4 text-center text-gray-400 text-sm"><RefreshCw size={16} className="inline animate-spin mr-1" />Memuat...</div>
            ) : spends.length === 0 ? (
              <div className="py-4 text-center text-gray-400 text-sm">Belum ada data spending</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="py-2 px-3 text-left">Bulan</th>
                    <th className="py-2 px-3 text-right">Ad Spend</th>
                    <th className="py-2 px-3 text-center">CB %</th>
                    <th className="py-2 px-3 text-right">Cashback</th>
                    <th className="py-2 px-3 text-center">Bukti</th>
                    <th className="py-2 px-3 text-right">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {spends.map(s => (
                      <SpendRow key={s.id} spend={s} deleting={deletingSpend}
                        onEdit={sp => { setEditingSpend(sp); setShowSpendForm(true); }}
                        onDelete={handleDeleteSpend}
                        onUploadProof={handleUploadProof}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ───
export default function AdminWhitelist() {
  const { token } = useAuth();
  const [summary, setSummary] = useState({ users: [], referrals: [], total_users: 0, total_spend: 0, total_cashback: 0 });
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [refFilter, setRefFilter] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/whitelist/summary`, { headers });
      setSummary(res.data);
    } catch { toast.error('Gagal memuat data whitelist'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveUser = async (form) => {
    setSaving(true);
    try {
      if (editingUser) {
        await axios.put(`${API}/api/admin/whitelist/${editingUser.id}`, form, { headers });
        toast.success('User diupdate');
      } else {
        await axios.post(`${API}/api/admin/whitelist`, form, { headers });
        toast.success('User ditambahkan');
      }
      setShowUserForm(false);
      setEditingUser(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan user');
    }
    setSaving(false);
  };

  const handleDeleteUser = async (id, confirm) => {
    if (confirm) { setDeletingUser(id); return; }
    if (!id) { setDeletingUser(null); return; }
    try {
      await axios.delete(`${API}/api/admin/whitelist/${id}`, { headers });
      toast.success('User dihapus');
      load();
    } catch { toast.error('Gagal menghapus user'); }
    setDeletingUser(null);
  };

  const handleDownloadReferralPdf = (refName) => {
    window.open(`${API}/api/admin/whitelist/referral/${encodeURIComponent(refName)}/pdf`, '_blank');
  };

  const uniqueReferrals = [...new Set(summary.users.map(u => u.referral).filter(Boolean))];

  const filteredUsers = summary.users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()) || (u.phone || '').includes(search);
    const matchRef = !refFilter || u.referral === refFilter;
    return matchSearch && matchRef;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-cyan-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-whitelist-page">
      <AdminNav />
      <div className="py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="whitelist-page-title">Whitelist Cashback</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kelola user whitelist dan laporan cashback</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={load} data-testid="refresh-whitelist"><RefreshCw size={14} className="mr-1" />Refresh</Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => { setEditingUser(null); setShowUserForm(true); }} data-testid="add-user-btn">
                <Plus size={14} className="mr-1" />Tambah User
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card data-testid="stat-total-users">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center"><Users size={18} className="text-cyan-700" /></div>
                <div><p className="text-xs text-gray-500">Total User</p><p className="text-xl font-bold text-gray-900">{summary.total_users}</p></div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-spend">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign size={18} className="text-blue-700" /></div>
                <div><p className="text-xs text-gray-500">Total Ad Spend</p><p className="text-xl font-bold text-gray-900">{fmtRp(summary.total_spend)}</p></div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-cashback">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={18} className="text-green-700" /></div>
                <div><p className="text-xs text-gray-500">Total Cashback</p><p className="text-xl font-bold text-green-700">{fmtRp(summary.total_cashback)}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Summary */}
          {summary.referrals.length > 0 && (
            <Card className="mb-6" data-testid="referral-summary-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users size={16} />Ringkasan per Referral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-xs text-gray-500 uppercase">
                      <th className="py-2 px-3 text-left">Referral</th>
                      <th className="py-2 px-3 text-center">Jumlah User</th>
                      <th className="py-2 px-3 text-right">Total Spend</th>
                      <th className="py-2 px-3 text-right">Total Cashback</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr></thead>
                    <tbody>
                      {summary.referrals.map((r, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50" data-testid={`referral-row-${r.referral}`}>
                          <td className="py-2 px-3 font-medium">{r.referral}</td>
                          <td className="py-2 px-3 text-center">{r.users}</td>
                          <td className="py-2 px-3 text-right">{fmtRp(r.total_spend)}</td>
                          <td className="py-2 px-3 text-right text-green-700 font-medium">{fmtRp(r.total_cashback)}</td>
                          <td className="py-2 px-3 text-right">
                            {r.referral !== 'Tidak ada' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDownloadReferralPdf(r.referral)} data-testid={`pdf-referral-${r.referral}`}>
                                <Download size={12} className="mr-1" />PDF
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input data-testid="wl-search" placeholder="Cari nama, email, atau telepon..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
            <select data-testid="wl-ref-filter" className="rounded-md border border-gray-200 px-3 py-2 text-sm sm:max-w-xs" value={refFilter} onChange={e => setRefFilter(e.target.value)}>
              <option value="">Semua Referral</option>
              {uniqueReferrals.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(search || refFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setRefFilter(''); }}>Reset</Button>
            )}
          </div>

          {/* User List */}
          <div className="space-y-3" data-testid="whitelist-user-list">
            {filteredUsers.length === 0 ? (
              <Card><CardContent className="p-10 text-center">
                <Shield className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">{summary.users.length === 0 ? 'Belum ada user whitelist' : 'Tidak ada user yang sesuai filter'}</p>
              </CardContent></Card>
            ) : (
              filteredUsers.map(u => (
                <UserCard key={u.id} user={u}
                  stats={{ total_spend: u.total_spend || 0, total_cashback: u.total_cashback || 0 }}
                  onEdit={usr => { setEditingUser(usr); setShowUserForm(true); }}
                  onDelete={handleDeleteUser}
                  onRefresh={load}
                  deleting={deletingUser}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <Modal open={showUserForm} onClose={() => { setShowUserForm(false); setEditingUser(null); }} title={editingUser ? 'Edit User Whitelist' : 'Tambah User Whitelist'}>
        <UserForm user={editingUser} saving={saving} onSave={handleSaveUser} onCancel={() => { setShowUserForm(false); setEditingUser(null); }} />
      </Modal>
    </div>
  );
}
