import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, Users, Ticket, Shield, ClipboardList, UserCog, User,
  Home, LogOut, X, LayoutGrid, Building2, Bell, Palette, Receipt,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const LOGO = '/logo-mawana.png';

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  designer: 'Desainer',
  advertiser: 'Advertiser',
  business_dev: 'Business Dev',
};

const ALL_ROLES = ['owner', 'admin', 'designer', 'advertiser', 'business_dev'];
const ADMINS = ['owner', 'admin'];

const NAV_SECTIONS = [
  {
    title: 'Kerja',
    items: [
      { to: '/admin/board', label: 'Papan Kerja', icon: LayoutGrid, roles: ALL_ROLES },
      { to: '/admin/desain', label: 'Pengajuan Desain', icon: Palette, roles: ALL_ROLES },
      { to: '/admin/tugas', label: 'Tugas Saya', icon: ClipboardList, roles: ALL_ROLES },
      { to: '/admin/clients', label: 'Clients', icon: Building2, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Manajemen',
    items: [
      { to: '/admin/dashboard', label: 'Analytics', icon: BarChart3, roles: ADMINS },
      { to: '/admin/contact', label: 'Leads & Kontak', icon: Users, roles: ADMINS },
      { to: '/admin/webinar', label: 'Webinar', icon: Ticket, roles: ADMINS },
      { to: '/admin/whitelist', label: 'Whitelist CB', icon: Shield, roles: ADMINS, end: true },
      { to: '/admin/whitelist/spends', label: 'Input Spending', icon: ClipboardList, roles: ADMINS },
      { to: '/admin/invoice', label: 'Invoice & Omzet', icon: Receipt, roles: ADMINS },
    ],
  },
  {
    title: 'Akun',
    items: [
      { to: '/admin/notifikasi', label: 'Notifikasi', icon: Bell, roles: ALL_ROLES, badge: true },
      { to: '/admin/team', label: 'Tim', icon: UserCog, roles: ADMINS },
      { to: '/admin/akun', label: 'Akun Saya', icon: User, roles: ALL_ROLES },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user, role, logout, token } = useAuth();
  const [unread, setUnread] = useState(0);

  const pollUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/notifications/count`, { headers: { Authorization: `Bearer ${token}` } });
      setUnread(res.data?.unread || 0);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    pollUnread();
    const id = setInterval(pollUnread, 45000);
    return () => clearInterval(id);
  }, [pollUnread]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col
          transition-transform duration-300 md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        data-testid="admin-sidebar"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2.5">
            <img src={LOGO} alt="Mawana Corp" className="h-9 w-9 rounded-lg bg-white p-1 object-contain" />
            <span className="font-bold text-white text-sm">Mawana Workspace</span>
          </button>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white" aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((it) => it.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <item.icon size={17} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="h-9 w-9 rounded-full bg-cyan-600 text-white grid place-items-center text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-[11px] text-slate-400 truncate">{ROLE_LABELS[role] || role}</p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Home size={16} /> Lihat Situs
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
            data-testid="logout-button"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
