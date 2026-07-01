import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

const LOGO = 'https://qsepqrbzgyowbstrgyye.supabase.co/storage/v1/object/public/donasi-bukti/assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const landing = (admin) => (admin ? '/admin/dashboard' : '/admin/akun');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(landing(isAdmin), { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      const admin = res.user?.role === 'owner' || res.user?.role === 'admin';
      navigate(landing(admin), { replace: true });
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO} alt="Mawana" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Mawana Workspace</h1>
          <p className="text-gray-500 text-sm mt-1">Masuk untuk mengakses dashboard tim</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mawana.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition"
                data-testid="login-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition"
                data-testid="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" data-testid="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-60"
            data-testid="login-submit"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Kembali ke Home
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">🔒 Halaman terlindungi. Hanya tim Mawana.</p>
      </div>
    </div>
  );
}
