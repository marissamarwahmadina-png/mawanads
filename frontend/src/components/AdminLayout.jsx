import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b px-4 h-14">
        <button onClick={() => setOpen(true)} aria-label="Buka menu" className="text-gray-700">
          <Menu size={22} />
        </button>
        <span className="font-bold text-gray-900 text-sm">Mawana Workspace</span>
      </div>

      <main className="md:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
