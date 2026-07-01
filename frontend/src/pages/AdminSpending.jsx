import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  RefreshCw, DollarSign, TrendingUp, Upload, Check, X,
  Pencil, ChevronLeft, ChevronRight, Save, Download, CheckCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

const API = process.env.REACT_APP_BACKEND_URL;

const MONTHS = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const fmtRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const COLORS = ['#0891b2', '#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9', '#2563eb', '#3b82f6', '#60a5fa', '#818cf8', '#a78bfa'];

function SpendChart({ data }) {
  const chartData = data
    .filter(d => d.spend_amount > 0)
    .sort((a, b) => b.spend_amount - a.spend_amount)
    .map(d => ({ name: d.user_name.length > 12 ? d.user_name.slice(0, 12) + '...' : d.user_name, spend: d.spend_amount, fullName: d.user_name }));

  if (chartData.length === 0) return null;

  return (
    <Card className="mb-6" data-testid="spend-chart-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Perbandingan Ad Spend per User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip
                formatter={(value) => [fmtRp(value), 'Ad Spend']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SpendTableRow({ row, onSave, onUploadProof, onTogglePayment, saving }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(row.spend_amount || 0);
  const [notes, setNotes] = useState(row.notes || '');
  const fileRef = React.useRef(null);
  const isPaid = row.payment_status === 'paid';

  useEffect(() => {
    setAmount(row.spend_amount || 0);
    setNotes(row.notes || '');
    setEditing(false);
  }, [row.spend_amount, row.notes]);

  const handleSave = async () => {
    await onSave(row, parseFloat(amount) || 0, notes);
    setEditing(false);
  };

  return (
    <tr className="border-b last:border-0 hover:bg-gray-50/50 text-sm" data-testid={`spend-row-${row.user_id}`}>
      <td className="py-3 px-3">
        <div>
          <p className="font-medium text-gray-900">{row.user_name}</p>
          <p className="text-xs text-gray-500">{row.referral && <span className="text-cyan-600">Ref: {row.referral}</span>}{row.referral && row.email ? ' · ' : ''}{row.email}</p>
        </div>
      </td>
      <td className="py-3 px-3 text-center text-xs text-gray-500">{row.cashback_percentage}%</td>
      <td className="py-3 px-3">
        {editing ? (
          <Input data-testid={`input-amount-${row.user_id}`} type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} className="w-36 h-8 text-sm" autoFocus />
        ) : (
          <span className={`font-medium ${row.has_data ? 'text-gray-900' : 'text-gray-300'}`} data-testid={`display-amount-${row.user_id}`}>
            {row.has_data ? fmtRp(row.spend_amount) : '-'}
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-medium ${row.has_data ? 'text-green-700' : 'text-gray-300'}`}>
          {row.has_data ? fmtRp(row.cashback_amount) : '-'}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        {row.has_data && row.spend_id ? (
          <button
            onClick={() => onTogglePayment(row.spend_id)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition ${isPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            data-testid={`toggle-payment-${row.user_id}`}
          >
            {isPaid ? <CheckCircle size={11} /> : <Clock size={11} />}
            {isPaid ? 'Sudah' : 'Belum'}
          </button>
        ) : <span className="text-gray-300 text-xs">-</span>}
      </td>
      <td className="py-3 px-3">
        {editing ? (
          <Input data-testid={`input-notes-${row.user_id}`} value={notes} onChange={e => setNotes(e.target.value)} className="w-32 h-8 text-sm" placeholder="Catatan..." />
        ) : (
          <span className="text-xs text-gray-500">{row.notes || '-'}</span>
        )}
      </td>
      <td className="py-3 px-3 text-center">
        {row.proof_url ? (
          <a href={`${API}${row.proof_url}?token=${localStorage.getItem('mawana_admin_token')}`} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline text-xs font-medium" data-testid={`proof-link-${row.user_id}`}>Lihat</a>
        ) : (
          <span className="text-gray-300 text-xs">-</span>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="p-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50" title="Simpan" data-testid={`save-spend-${row.user_id}`}>
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              </button>
              <button onClick={() => { setEditing(false); setAmount(row.spend_amount || 0); setNotes(row.notes || ''); }} className="p-1.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300" title="Batal" data-testid={`cancel-spend-${row.user_id}`}>
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-cyan-50 text-cyan-600" title="Input/Edit Spend" data-testid={`edit-spend-${row.user_id}`}>
                <Pencil size={13} />
              </button>
              {row.has_data && row.spend_id && (
                <>
                  <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf" onChange={e => { if (e.target.files[0]) onUploadProof(row.spend_id, e.target.files[0]); }} />
                  <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Upload Bukti Transfer" data-testid={`upload-proof-${row.user_id}`}>
                    <Upload size={13} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminSpending() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [totalCashback, setTotalCashback] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/whitelist/spends/monthly?month=${month}&year=${year}`, { headers });
      setData(res.data.data);
      setTotalSpend(res.data.total_spend);
      setTotalCashback(res.data.total_cashback);
    } catch { toast.error('Gagal memuat data spending'); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleSaveSpend = async (row, amount, notes) => {
    setSaving(true);
    try {
      if (row.has_data && row.spend_id) {
        await axios.put(`${API}/api/admin/whitelist/spends/${row.spend_id}`, { spend_amount: amount, notes }, { headers });
        toast.success(`Spending ${row.user_name} diupdate`);
      } else {
        await axios.post(`${API}/api/admin/whitelist/${row.user_id}/spends`, { month, year, spend_amount: amount, notes }, { headers });
        toast.success(`Spending ${row.user_name} ditambahkan`);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan spending');
    }
    setSaving(false);
  };

  const handleUploadProof = async (spendId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await axios.post(`${API}/api/admin/whitelist/spends/${spendId}/proof`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bukti transfer diupload');
      load();
    } catch { toast.error('Gagal upload bukti'); }
  };

  const handleTogglePayment = async (spendId) => {
    try {
      await axios.put(`${API}/api/admin/whitelist/spends/${spendId}/payment-status`, {}, { headers });
      toast.success('Status pembayaran diupdate');
      load();
    } catch { toast.error('Gagal update status'); }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const usersWithData = data.filter(d => d.has_data).length;

  const exportToExcel = () => {
    const rows = data.map(d => ({
      'Nama': d.user_name,
      'Email': d.email,
      'Referral': d.referral || '-',
      'CB (%)': d.cashback_percentage,
      'Ad Spend (Rp)': d.spend_amount || 0,
      'Cashback (Rp)': d.cashback_amount || 0,
      'Bukti Transfer': d.proof_url ? 'Ya' : '-',
      'Bank': d.bank_name || '-',
      'Nama Rekening': d.account_name || '-',
      'No Rekening': d.account_number || '-',
      'Catatan': d.notes || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Spending ${MONTHS[month]} ${year}`);
    XLSX.writeFile(wb, `Spending_${MONTHS[month]}_${year}.xlsx`);
    toast.success('File Excel berhasil didownload');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-spending-page">
      <div className="py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="spending-page-title">Input Spending Bulanan</h1>
              <p className="text-sm text-gray-500 mt-0.5">Input dan kelola data ad spend per user setiap bulan</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportToExcel} disabled={data.length === 0} data-testid="export-spending-btn"><Download size={14} className="mr-1" />Export Excel</Button>
              <Button size="sm" variant="outline" onClick={load} data-testid="refresh-spending"><RefreshCw size={14} className="mr-1" />Refresh</Button>
            </div>
          </div>

          {/* Month/Year Picker */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={prevMonth} className="p-2 rounded-lg border hover:bg-gray-100 transition" data-testid="prev-month"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2">
              <select data-testid="month-select" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <Input data-testid="year-input" type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || now.getFullYear())} className="w-24 text-center font-medium" />
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg border hover:bg-gray-100 transition" data-testid="next-month"><ChevronRight size={18} /></button>
            <span className="text-sm text-gray-500 ml-2" data-testid="spend-summary-text">
              {usersWithData}/{data.length} user sudah diinput
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card data-testid="stat-monthly-spend">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign size={18} className="text-blue-700" /></div>
                <div><p className="text-xs text-gray-500">Total Spend {MONTHS[month]} {year}</p><p className="text-xl font-bold text-gray-900">{fmtRp(totalSpend)}</p></div>
              </CardContent>
            </Card>
            <Card data-testid="stat-monthly-cashback">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={18} className="text-green-700" /></div>
                <div><p className="text-xs text-gray-500">Total Cashback {MONTHS[month]} {year}</p><p className="text-xl font-bold text-green-700">{fmtRp(totalCashback)}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <SpendChart data={data} />

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-gray-400"><RefreshCw size={24} className="inline animate-spin mr-2" />Memuat data...</div>
          ) : data.length === 0 ? (
            <Card><CardContent className="p-10 text-center">
              <DollarSign className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">Belum ada user whitelist. Tambahkan user terlebih dahulu di halaman Whitelist CB.</p>
            </CardContent></Card>
          ) : (
            <Card data-testid="spending-table-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b bg-gray-50/80 text-xs text-gray-500 uppercase">
                      <th className="py-3 px-3 text-left font-semibold">User</th>
                      <th className="py-3 px-3 text-center font-semibold">CB %</th>
                      <th className="py-3 px-3 text-left font-semibold">Ad Spend</th>
                      <th className="py-3 px-3 text-right font-semibold">Cashback</th>
                      <th className="py-3 px-3 text-center font-semibold">Status</th>
                      <th className="py-3 px-3 text-left font-semibold">Catatan</th>
                      <th className="py-3 px-3 text-center font-semibold">Bukti</th>
                      <th className="py-3 px-3 text-right font-semibold">Aksi</th>
                    </tr></thead>
                    <tbody>
                      {data.map(row => (
                        <SpendTableRow key={row.user_id} row={row} onSave={handleSaveSpend} onUploadProof={handleUploadProof} onTogglePayment={handleTogglePayment} saving={saving} />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-gray-50 font-semibold text-sm">
                        <td className="py-3 px-3">Total ({usersWithData} user)</td>
                        <td className="py-3 px-3"></td>
                        <td className="py-3 px-3">{fmtRp(totalSpend)}</td>
                        <td className="py-3 px-3 text-right text-green-700">{fmtRp(totalCashback)}</td>
                        <td className="py-3 px-3" colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
