import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  MessageSquare, CreditCard, Settings, ScrollText, LogOut,
} from 'lucide-react';

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/properties',    icon: Building2,        label: 'Properties'  },
  { to: '/users',         icon: Users,            label: 'Users'       },
  { to: '/kyc',           icon: ShieldCheck,      label: 'KYC'         },
  { to: '/complaints',    icon: MessageSquare,    label: 'Complaints'  },
  { to: '/transactions',  icon: CreditCard,       label: 'Transactions'},
  { to: '/settings',      icon: Settings,         label: 'Settings'    },
  { to: '/audit',         icon: ScrollText,       label: 'Audit Logs'  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  };

  const user = JSON.parse(localStorage.getItem('admin_user') ?? '{}');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AssetHub</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
