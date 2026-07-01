import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { User, KeyRound, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const ROLE_LABELS = {
  owner: 'Owner', admin: 'Admin', designer: 'Desainer',
  advertiser: 'Advertiser', business_dev: 'Business Development',
};

export default function AdminAccount() {
  const { user, token, role } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 6) return toast.error('Password baru minimal 6 karakter');
    if (next !== confirm) return toast.error('Konfirmasi password tidak cocok');
    setSaving(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, { current_password: current, new_password: next },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Password berhasil diubah');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal mengubah password');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <User className="text-cyan-600" size={24} /> Akun Saya
      </h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-cyan-600 text-white grid place-items-center text-lg font-bold">
            {(user?.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
              {ROLE_LABELS[role] || role}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <KeyRound size={18} className="text-gray-400" /> Ganti Password
        </h2>
        {['current', 'next', 'confirm'].map((field) => {
          const labels = { current: 'Password Lama', next: 'Password Baru', confirm: 'Konfirmasi Password Baru' };
          const vals = { current, next, confirm };
          const setters = { current: setCurrent, next: setNext, confirm: setConfirm };
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels[field]}</label>
              <input type="password" required value={vals[field]} onChange={(e) => setters[field](e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none" />
            </div>
          );
        })}
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 bg-cyan-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-cyan-700 disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />} Simpan Password
        </button>
      </form>
    </div>
  );
}
