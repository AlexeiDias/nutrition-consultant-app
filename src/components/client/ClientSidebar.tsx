// Consultant dashboard sidebar component with navigation links and user profile info
//src/components/consultant/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/client/dashboard', icon: '📊' },
  { label: 'Log Today', href: '/client/log', icon: '✏️' },
  { label: 'My Plan', href: '/client/plan', icon: '📋' },
  { label: 'My Stats', href: '/client/stats', icon: '📈' },
  { label: 'History', href: '/client/history', icon: '📅' },
  { label: 'My Consultant', href: '/client/consultant', icon: '👤' },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🥗</span>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Nutrition App</h1>
            <p className="text-xs text-gray-500">Client Portal</p>
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
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
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
    </aside>
  );
}