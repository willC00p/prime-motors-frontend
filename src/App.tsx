import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';
import Sales from './pages/Sales';
import Management from './pages/Management';
import Suppliers from './pages/Suppliers';
import LoanPayments from './pages/LoanPayments';
import LTORegistrationManagement from './pages/LTORegistrationManagement';
import Reports from './pages/Reports';
import Presentation from './pages/Presentation';
import AccountManagement from './pages/AccountManagement';
import type { UserRole } from './types/auth';

function App() {
  // All roles that have full access to their respective areas
  const inventoryRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit', 'branch'];
  const salesRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'accounting', 'finance', 'audit', 'branch'];
  const managementRoles: UserRole[] = ['gm', 'ceo', 'nsm'];
  const accountManagementRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'accounting', 'finance'];
  const purchasingRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'purchasing'];
  // financeRoles removed — loan-payments route is accessible to all authenticated users now
  const dashboardRoles: UserRole[] = ['gm', 'ceo', 'nsm', 'accounting', 'finance', 'audit'];

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout>
                  <Outlet />
                </Layout>
              </ProtectedRoute>
            }
          >
            {/* Dashboard routes */}
            <Route index element={
              <ProtectedRoute 
                allowedRoles={dashboardRoles}
                permission="reports"
                requiresAllBranches
              >
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={
              <ProtectedRoute 
                allowedRoles={dashboardRoles}
                permission="reports"
                requiresAllBranches
              >
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute 
                allowedRoles={dashboardRoles}
                permission="reports"
                requiresAllBranches
              >
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* Feature routes */}
            <Route 
              path="inventory/*" 
              element={
                <ProtectedRoute 
                  allowedRoles={inventoryRoles}
                  permission="inventory"
                >
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purchase-orders/*" 
              element={
                <ProtectedRoute 
                  allowedRoles={purchasingRoles}
                  permission="purchasing"
                  requiresAllBranches
                >
                  <PurchaseOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="management/*" 
              element={
                <ProtectedRoute 
                  allowedRoles={managementRoles}
                  permission="management"
                  requiresAllBranches
                >
                  <Management />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="suppliers/*" 
              element={
                <ProtectedRoute 
                  allowedRoles={purchasingRoles}
                  permission="purchasing"
                  requiresAllBranches
                >
                  <Suppliers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales/*" 
              element={
                <ProtectedRoute 
                  allowedRoles={salesRoles}
                  permission="sales"
                >
                  <Sales />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="loan-payments/*" 
              element={
                <ProtectedRoute>
                  <LoanPayments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="lto-registration" 
              element={
                <ProtectedRoute 
                  allowedRoles={salesRoles}
                  permission="sales"
                >
                  <LTORegistrationManagement />
                </ProtectedRoute>
              } 
            />
            <Route
              path="presentation"
              element={
                <ProtectedRoute>
                  <Presentation />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounts"
              element={
                <ProtectedRoute
                  allowedRoles={accountManagementRoles}
                  permission="management"
                  requiresAllBranches
                >
                  <AccountManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
