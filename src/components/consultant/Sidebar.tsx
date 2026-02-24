'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/consultant/dashboard', icon: '📊' },
  { label: 'Clients', href: '/consultant/clients', icon: '👥' },
  { label: 'Action Plans', href: '/consultant/action-plans', icon: '📋' },
  { label: 'Calculator', href: '/consultant/calculator', icon: '🧮' },
  { label: 'Reports', href: '/consultant/reports', icon: '📈' },
  { label: 'Profile', href: '/consultant/profile', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🥗</span>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Nutrition App</h1>
            <p className="text-xs text-gray-500">Consultant Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
            {profile?.name?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          🚪 Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥗</span>
          <span className="font-bold text-gray-900 text-sm">Nutrition App</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-bold text-gray-900">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col min-h-screen">
        <SidebarContent />
      </aside>
    </>
  );
}
