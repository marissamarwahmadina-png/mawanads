import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, TrendingUp, Database, RefreshCw, Calendar } from 'lucide-react';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subMonths, isWithinInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

const periodOptions = [
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' },
];

const dateRangePresets = [
  { key: '7d', label: '7 Hari', days: 7 },
  { key: '30d', label: '30 Hari', days: 30 },
  { key: '90d', label: '3 Bulan', days: 90 },
  { key: '365d', label: '1 Tahun', days: 365 },
  { key: 'all', label: 'Semua', days: null },
];

function groupByPeriod(items, period, startDate, endDate) {
  const filtered = items.filter(item => {
    const d = new Date(item.submittedAt);
    return d >= startDate && d <= endDate;
  });

  const map = {};

  if (period === 'daily') {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = { label: format(day, 'dd MMM', { locale: idLocale }), contacts: 0, affiliates: 0 };
    });
  } else if (period === 'weekly') {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    weeks.forEach(week => {
      const key = format(week, 'yyyy-ww');
      map[key] = { label: format(week, 'dd MMM', { locale: idLocale }), contacts: 0, affiliates: 0 };
    });
  } else if (period === 'monthly') {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    months.forEach(month => {
      const key = format(month, 'yyyy-MM');
      map[key] = { label: format(month, 'MMM yyyy', { locale: idLocale }), contacts: 0, affiliates: 0 };
    });
  } else {
    filtered.forEach(item => {
      const d = new Date(item.submittedAt);
      const key = format(d, 'yyyy');
      if (!map[key]) map[key] = { label: key, contacts: 0, affiliates: 0 };
    });
  }

  filtered.forEach(item => {
    const d = new Date(item.submittedAt);
    let key;
    if (period === 'daily') key = format(d, 'yyyy-MM-dd');
    else if (period === 'weekly') key = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-ww');
    else if (period === 'monthly') key = format(d, 'yyyy-MM');
    else key = format(d, 'yyyy');

    if (map[key]) {
      if (item._type === 'contact') map[key].contacts++;
      else map[key].affiliates++;
    }
  });

  return Object.values(map);
}

export const AdminDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [affiliateLeads, setAffiliateLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState('30d');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contactsRes, leadsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/contacts`),
        axios.get(`${BACKEND_URL}/api/affiliate-leads`)
      ]);
      setContacts(contactsRes.data);
      setAffiliateLeads(leadsRes.data);
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const preset = dateRangePresets.find(p => p.key === dateRange);
    if (!preset || !preset.days) {
      const allDates = [...contacts, ...affiliateLeads].map(i => new Date(i.submittedAt));
      const earliest = allDates.length > 0 ? new Date(Math.min(...allDates)) : subDays(end, 30);
      return { startDate: startOfDay(earliest), endDate: end };
    }
    return { startDate: startOfDay(subDays(end, preset.days)), endDate: end };
  }, [dateRange, contacts, affiliateLeads]);

  const allItems = useMemo(() => [
    ...contacts.map(c => ({ ...c, _type: 'contact' })),
    ...affiliateLeads.map(l => ({ ...l, _type: 'affiliate' }))
  ], [contacts, affiliateLeads]);

  const chartData = useMemo(() => groupByPeriod(allItems, period, startDate, endDate), [allItems, period, startDate, endDate]);

  const affiliatorStats = useMemo(() => {
    const statsMap = {};
    affiliateLeads.forEach(lead => {
      const name = lead.affiliator || 'unknown';
      if (!statsMap[name]) statsMap[name] = { name, total: 0, latest: null };
      statsMap[name].total++;
      const d = new Date(lead.submittedAt);
      if (!statsMap[name].latest || d > new Date(statsMap[name].latest)) statsMap[name].latest = lead.submittedAt;
    });
    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [affiliateLeads]);

  const affiliatorChartData = useMemo(() =>
    affiliatorStats.map(s => ({ name: s.name, leads: s.total })),
  [affiliatorStats]);

  const totalLeads = contacts.length + affiliateLeads.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="animate-spin mx-auto mb-4 text-cyan-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1" data-testid="analytics-page-title">Analytics Dashboard</h1>
            <p className="text-gray-500">Pantau performa lead dan affiliator</p>
          </div>
          <div className="flex gap-3">
            <Button data-testid="refresh-btn" onClick={fetchData} variant="outline"><RefreshCw className="mr-2" size={18} />Refresh</Button>
          </div>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"><p className="text-red-700">{error}</p></div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-total-leads" className="border-l-4 border-cyan-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Semua Lead</p>
                <p className="text-4xl font-bold text-gray-900">{totalLeads}</p>
              </div>
              <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-cyan-600" size={28} />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-total-contacts" className="border-l-4 border-emerald-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact Form</p>
                <p className="text-4xl font-bold text-gray-900">{contacts.length}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="text-emerald-600" size={28} />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-total-affiliates" className="border-l-4 border-blue-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Affiliate Leads</p>
                <p className="text-4xl font-bold text-gray-900">{affiliateLeads.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserCheck className="text-blue-600" size={28} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Trend Chart */}
        <Card className="mb-8" data-testid="lead-trend-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={22} className="text-cyan-600" />
                Tren Jumlah Lead
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {/* Date range presets */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {dateRangePresets.map(preset => (
                    <button
                      key={preset.key}
                      data-testid={`date-range-${preset.key}`}
                      onClick={() => setDateRange(preset.key)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${
                        dateRange === preset.key
                          ? 'bg-white text-cyan-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {/* Period selector */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {periodOptions.map(opt => (
                    <button
                      key={opt.key}
                      data-testid={`period-${opt.key}`}
                      onClick={() => setPeriod(opt.key)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${
                        period === opt.key
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]" data-testid="lead-trend-chart">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">Tidak ada data untuk periode ini</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value, name) => [value, name === 'contacts' ? 'Contact Form' : 'Affiliate']}
                    />
                    <Legend formatter={(value) => value === 'contacts' ? 'Contact Form' : 'Affiliate'} />
                    <Bar dataKey="contacts" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="affiliates" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Affiliator Performance */}
        <Card data-testid="affiliator-performance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck size={22} className="text-blue-600" />
              Capaian Affiliator
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliatorStats.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <UserCheck className="mx-auto mb-3" size={48} />
                <p>Belum ada data affiliator</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="h-[300px]" data-testid="affiliator-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={affiliatorChartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} width={100} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
                        {affiliatorChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Table */}
                <div data-testid="affiliator-table">
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Affiliator</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Lead</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Terbaru</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {affiliatorStats.map((stat, i) => (
                          <tr key={stat.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold`}
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                                {i + 1}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-gray-900 capitalize">{stat.name}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                {stat.total}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-500">
                              {stat.latest ? (() => {
                                try { return format(parseISO(stat.latest), 'dd MMM yyyy HH:mm', { locale: idLocale }); }
                                catch { return stat.latest; }
                              })() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
