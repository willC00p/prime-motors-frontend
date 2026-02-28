import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canManageAccounts } from '../utils/roleAccess';
import type { UserRole } from '../types/auth';
import {
  Menu as IconMenu,
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  ShoppingCart,
  Users,
  Building2,
  Truck,
  CreditCard,
  BadgeCheck,
  LogOut,
  Monitor
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const dashboardRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'accounting', 'finance', 'audit'];
  const canAccessDashboard = user && dashboardRoles.includes(user.role as UserRole);

  const navItems = [
    ...(canAccessDashboard 
      ? [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }]
      : []),
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { to: '/sales', label: 'Sales', icon: Users },
    { to: '/management', label: 'Branch/Models', icon: Building2 },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/loan-payments', label: 'Loan Payments', icon: CreditCard },
    { to: '/lto-registration', label: 'LTO Registration', icon: BadgeCheck },
    { to: '/presentation', label: 'Presentation', icon: Monitor },
    ...(user && canManageAccounts(user.role) 
      ? [{ to: '/accounts', label: 'Account Management', icon: Users }]
      : [])
  ];

  const sidebarWidth = collapsed ? '72px' : '240px';

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full bg-white/95 border-r border-gray-100 neon-bg"
        style={{ width: sidebarWidth, transition: 'width 200ms ease' }}
      >
        <div className="h-16 flex items-center justify-between px-3 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <span className={`text-xl font-extrabold neon-text ${collapsed ? 'hidden' : ''}`}>Prime Motors</span>
          </Link>
          <button
            className="p-2 rounded-md hover:bg-gray-50 text-gray-700 neon-glow"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <IconMenu size={18} />
          </button>
        </div>
        <nav className="py-3">
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-neon/10 text-gray-900 ring-1 ring-neon neon-border'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={18} color="#39FF14" />
                  <span className={collapsed ? 'hidden' : ''}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} text-xs text-gray-600`}> 
            {!collapsed && (
              <div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-gray-500">{user?.role}</div>
              </div>
            )}
            <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
              <LogOut size={16} />
              <span className={collapsed ? 'hidden' : ''}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1" style={{ marginLeft: sidebarWidth, transition: 'margin-left 200ms ease' }}>
  <header className="h-16 flex items-center px-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-base font-semibold text-gray-800">
            <span className="neon-text font-extrabold">Prime Motors</span>
            <span className="text-gray-400"> • </span>
            
          </h1>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
