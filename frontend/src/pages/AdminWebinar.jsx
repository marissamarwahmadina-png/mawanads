import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Users, CreditCard, TrendingUp, Clock, CheckCircle2, XCircle,
  RefreshCw, Search, Download, Edit3,
  DollarSign, Calendar, LogOut, BarChart3, FileText, Trash2
} from 'lucide-react';
import AdminNav from '../components/AdminNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <Card className="border-0 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminWebinar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [registrants, setRegistrants] = useState([]);
  const [callbackLogs, setCallbackLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, regRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/webinar/dashboard`, { headers }),
        axios.get(`${BACKEND_URL}/api/admin/webinar/registrants`, { headers }),
      ]);
      setDashboard(dashRes.data);
      setRegistrants(regRes.data);
    } catch (err) {
      if (err.response?.status === 401) { logout(); return; }
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/webinar/callback-logs`, { headers });
      setCallbackLogs(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (regId, newStatus) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/webinar/registrants/${regId}/status`, { status: newStatus }, { headers });
      toast.success('Status berhasil diperbarui');
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal update status');
    }
  };

  const deleteRegistrant = async (regId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/webinar/registrants/${regId}`, { headers });
      toast.success('Registrant berhasil dihapus');
      setDeletingId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghapus');
    }
  };

  const filteredRegistrants = useMemo(() => {
    return registrants.filter(r => {
      const matchSearch = !search || r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase()) || r.invoice_id?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.ticket_status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [registrants, search, filterStatus]);

  const exportCSV = () => {
    const headers = ['Invoice', 'Nama', 'Email', 'WhatsApp', 'Tiket', 'Status', 'Total', 'Tanggal'];
    const rows = filteredRegistrants.map(r => [
      r.invoice_id, r.full_name, r.email, r.whatsapp, r.ticket_type,
      r.ticket_status, r.total_amount || r.amount, r.created_at
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'registrants.csv'; a.click();
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')} data-testid="back-to-admin">
              <ArrowLeft size={16} className="mr-1" /> Admin
            </Button>
            <span className="text-gray-300">|</span>
            <h1 className="font-bold text-gray-900">Webinar Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} data-testid="refresh-btn">
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">
              <LogOut size={14} className="mr-1" /> Keluar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6" data-testid="tab-nav">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'registrants', label: 'Registrant', icon: Users },
            { key: 'logs', label: 'Callback Logs', icon: FileText },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'logs') fetchLogs(); }}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
              <StatCard icon={Users} label="Total Registrant" value={dashboard.total_registrants} color="bg-blue-500" />
              <StatCard icon={CheckCircle2} label="Sudah Bayar" value={dashboard.total_paid} color="bg-emerald-500" />
              <StatCard icon={Clock} label="Menunggu Bayar" value={dashboard.total_pending} color="bg-amber-500" />
              <StatCard icon={DollarSign} label="Total Revenue" value={`Rp ${(dashboard.total_revenue || 0).toLocaleString('id-ID')}`} color="bg-cyan-500" />
            </div>

            {/* Events */}
            <Card>
              <CardHeader><CardTitle className="text-base">Event Webinar</CardTitle></CardHeader>
              <CardContent>
                {dashboard.events?.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`event-${ev.slug}`}>
                    <div>
                      <p className="font-semibold text-gray-900">{ev.title}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={13} /> {new Date(ev.start_datetime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Kapasitas: {ev.capacity_total}</span>
                        <span>Status: <span className="font-medium text-gray-700">{ev.status}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      {ev.ticket_prices && Object.entries(ev.ticket_prices).map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-500">{v.label}: <span className="font-semibold text-gray-700">Rp {v.price?.toLocaleString('id-ID')}</span></p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader><CardTitle className="text-base">Transaksi Terbaru</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Invoice</th>
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-left">Tiket</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dashboard.recent_transactions?.slice(0, 10).map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{r.invoice_id}</td>
                          <td className="px-4 py-3">{r.full_name}</td>
                          <td className="px-4 py-3 capitalize">{r.ticket_type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.ticket_status] || 'bg-gray-100 text-gray-600'}`}>
                              {r.ticket_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">Rp {(r.total_amount || r.amount)?.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Registrants Tab */}
        {tab === 'registrants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Cari nama, email, invoice..." value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-9" data-testid="search-registrant" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]" data-testid="filter-status">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PAID">Sudah Bayar</SelectItem>
                    <SelectItem value="PENDING_PAYMENT">Menunggu Bayar</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} data-testid="export-csv-btn">
                <Download size={14} className="mr-1" /> Export CSV
              </Button>
            </div>

            <p className="text-xs text-gray-500">{filteredRegistrants.length} registrant ditemukan</p>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="registrants-table">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Invoice</th>
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">WA</th>
                        <th className="px-4 py-3 text-left">Tiket</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-left">Metode</th>
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRegistrants.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{r.invoice_id}</td>
                          <td className="px-4 py-3 font-medium">{r.full_name}</td>
                          <td className="px-4 py-3 text-gray-500">{r.email}</td>
                          <td className="px-4 py-3 text-gray-500">{r.whatsapp}</td>
                          <td className="px-4 py-3 capitalize">{r.ticket_type}</td>
                          <td className="px-4 py-3">
                            {editingId === r.id ? (
                              <Select defaultValue={r.ticket_status} onValueChange={v => updateStatus(r.id, v)}>
                                <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PAID">PAID</SelectItem>
                                  <SelectItem value="PENDING_PAYMENT">PENDING</SelectItem>
                                  <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                                  <SelectItem value="FAILED">FAILED</SelectItem>
                                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.ticket_status] || 'bg-gray-100 text-gray-600'}`}>
                                {r.ticket_status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">Rp {(r.total_amount || r.amount)?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{r.payment_method_code || '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                              className="text-gray-400 hover:text-cyan-600 transition-colors" data-testid={`edit-status-${r.id}`}>
                              <Edit3 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRegistrants.length === 0 && (
                        <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Belum ada registrant</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Callback Logs Tab */}
        {tab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>TriPay Callback Logs</span>
                <Button variant="ghost" size="sm" onClick={fetchLogs}><RefreshCw size={14} /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="callback-logs-table">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Waktu</th>
                      <th className="px-4 py-3 text-left">Invoice</th>
                      <th className="px-4 py-3 text-left">Reference</th>
                      <th className="px-4 py-3 text-left">Signature</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {callbackLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.received_at).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.invoice_id}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.tripay_reference}</td>
                        <td className="px-4 py-3">
                          {log.signature_valid
                            ? <span className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Valid</span>
                            : <span className="text-red-600 text-xs flex items-center gap-1"><XCircle size={12} /> Invalid</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">{log.payload_json?.status || '-'}</td>
                      </tr>
                    ))}
                    {callbackLogs.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Belum ada callback logs</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
