import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { BarChart3, Users, Ticket, LogOut, Home, Shield } from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/contact', label: 'Leads & Kontak', icon: Users },
  { path: '/admin/webinar', label: 'Webinar', icon: Ticket },
  { path: '/admin/whitelist', label: 'Whitelist CB', icon: Shield },
];

export default function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="bg-white border-b sticky top-0 z-30" data-testid="admin-nav">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/admin/dashboard')}
            className="font-bold text-gray-900 mr-3 text-sm" data-testid="admin-nav-brand">
            Mawana Admin
          </button>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active ? 'bg-cyan-50 text-cyan-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <item.icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} data-testid="admin-nav-home">
            <Home size={14} className="mr-1" /> Site
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/admin/login'); }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50" data-testid="admin-nav-logout">
            <LogOut size={14} className="mr-1" /> Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
