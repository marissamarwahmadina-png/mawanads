import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/workflow';

const API = process.env.REACT_APP_BACKEND_URL;

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return formatDate(iso);
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/notifications`, { headers });
      setItems(res.data.items || []);
    } catch {
      toast.error('Gagal memuat notifikasi');
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const openItem = async (n) => {
    if (!n.read) {
      try { await axios.post(`${API}/api/notifications/${n.id}/read`, {}, { headers }); } catch { /* ignore */ }
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await axios.post(`${API}/api/notifications/read-all`, {}, { headers });
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      toast.success('Semua ditandai dibaca');
    } catch {
      toast.error('Gagal');
    }
  };

  const hasUnread = items.some((x) => !x.read);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="text-cyan-600" size={24} /> Notifikasi
        </h1>
        {hasUnread && (
          <button onClick={markAll} className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:underline">
            <CheckCheck size={16} /> Tandai semua dibaca
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Bell size={40} className="mx-auto mb-3 text-gray-300" />
          Belum ada notifikasi
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => openItem(n)}
              className={`w-full text-left flex gap-3 p-4 rounded-xl border transition ${
                n.read ? 'bg-white border-gray-100' : 'bg-cyan-50/60 border-cyan-100'
              } hover:border-cyan-300`}
            >
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-gray-300' : 'bg-cyan-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
