import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canManageAccounts } from '../utils/roleAccess';
import {
  Menu as IconMenu,
  X,
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
  Monitor,
  GitBranch
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { to: '/sales', label: 'Sales', icon: Users },
    { to: '/management', label: 'Branch/Models', icon: Building2 },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/loan-payments', label: 'Loan Payments', icon: CreditCard },
    { to: '/lto-registration', label: 'LTO Registration', icon: BadgeCheck },
    { to: '/presentation', label: 'Presentation', icon: Monitor },
    ...(user && ['branch', 'investigator', 'gm', 'ceo', 'nsm'].includes(user.role)
      ? [{ to: '/leads', label: 'Leads Monitor', icon: GitBranch }]
      : []),
    ...(user && canManageAccounts(user.role) 
      ? [{ to: '/accounts', label: 'Account Management', icon: Users }]
      : []),
    ...(user && ['investigator', 'gm', 'ceo', 'nsm'].includes(user.role)
      ? [{ to: '/cibi-applications', label: 'CI/BI Applications', icon: FileSpreadsheet }]
      : [])
  ];

  const NavContent = () => (
    <nav className="py-3">
      <ul className="space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-neon/10 text-gray-900 ring-1 ring-neon neon-border'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} color="#39FF14" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className="hidden md:block fixed md:relative left-0 top-0 h-full bg-white/95 border-r border-gray-100 neon-bg transition-all duration-200"
        style={{ width: desktopSidebarCollapsed ? '72px' : '240px' }}
      >
        <div className="h-16 flex items-center justify-between px-3 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <span className={`text-xl font-extrabold neon-text ${desktopSidebarCollapsed ? 'hidden' : ''}`}>
              Prime Motors
            </span>
          </Link>
          <button
            className="p-2 rounded-md hover:bg-gray-50 text-gray-700 neon-glow"
            onClick={() => setDesktopSidebarCollapsed(v => !v)}
            title={desktopSidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            <IconMenu size={18} />
          </button>
        </div>
        <div className={desktopSidebarCollapsed ? 'hidden' : ''}>
          <NavContent />
        </div>
        <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-100 p-3 ${desktopSidebarCollapsed ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500">{user?.role}</div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer - Visible on mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white/95 neon-bg shadow-lg">
            <div className="h-16 flex items-center justify-between px-3 border-b border-gray-100">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl font-extrabold neon-text">Prime Motors</span>
              </Link>
              <button
                className="p-2 rounded-md hover:bg-gray-50 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <NavContent />
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-gray-500">{user?.role}</div>
                </div>
                <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            className="p-2 rounded-md hover:bg-gray-50 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <IconMenu size={20} />
          </button>
          <h1 className="text-lg font-bold neon-text">Prime Motors</h1>
          <div className="w-10" />
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 items-center px-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-base font-semibold text-gray-800">
            <span className="neon-text font-extrabold">Prime Motors</span>
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
