import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, Users, Ticket, Shield, ClipboardList, UserCog, User,
  Home, LogOut, X,
} from 'lucide-react';

const LOGO = 'https://qsepqrbzgyowbstrgyye.supabase.co/storage/v1/object/public/donasi-bukti/assets/logo.png';

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
    title: 'Manajemen',
    items: [
      { to: '/admin/dashboard', label: 'Analytics', icon: BarChart3, roles: ADMINS },
      { to: '/admin/contact', label: 'Leads & Kontak', icon: Users, roles: ADMINS },
      { to: '/admin/webinar', label: 'Webinar', icon: Ticket, roles: ADMINS },
      { to: '/admin/whitelist', label: 'Whitelist CB', icon: Shield, roles: ADMINS, end: true },
      { to: '/admin/whitelist/spends', label: 'Input Spending', icon: ClipboardList, roles: ADMINS },
    ],
  },
  {
    title: 'Akun',
    items: [
      { to: '/admin/team', label: 'Tim', icon: UserCog, roles: ADMINS },
      { to: '/admin/akun', label: 'Akun Saya', icon: User, roles: ALL_ROLES },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

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
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2">
            <img src={LOGO} alt="Mawana" className="h-7 w-7 rounded bg-white p-0.5" />
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
                      {item.label}
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
