import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaLock, FaUnlock, FaInfoCircle } from 'react-icons/fa';
import { accountApi } from '../services/accountApi';
import { fetchApi } from '../utils/api';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../types/account';
import type { UserRole } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { canManageAccounts, canAccessAllBranches } from '../utils/roleAccess';

const ROLES: UserRole[] = ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit', 'branch'];

interface Branch {
  id: number;
  name: string;
}

const emptyAccountForm: CreateAccountRequest = {
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'branch',
  branchId: undefined
};

export default function AccountManagement() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterBranch, setFilterBranch] = useState<number | 'all'>('all');
  const [form, setForm] = useState<CreateAccountRequest>(emptyAccountForm);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordAccountId, setResetPasswordAccountId] = useState<number | null>(null);

  // Check if user has account management access
  const canManage = user ? canManageAccounts(user.role) : false;
  const accessAllBranches = user ? canAccessAllBranches(user.role) : false;

  useEffect(() => {
    if (!canManage) return;
    fetchAccounts();
    fetchBranches();
  }, [canManage]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getAll();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await fetchApi<Branch[]>('/branches');
      setBranches(data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'branchId' && value ? parseInt(value) : value || (name === 'branchId' ? undefined : value)
    }));
  };

  const validateForm = () => {
    if (!editingId && (!form.username || !form.password || !form.name || !form.email || !form.role)) {
      setError('All fields are required for new accounts');
      return false;
    }
    if (editingId && (!form.name || !form.email || !form.role)) {
      setError('Name, email, and role are required');
      return false;
    }
    if (form.email && !form.email.includes('@')) {
      setError('Invalid email format');
      return false;
    }
    if (form.role === 'branch' && !form.branchId) {
      setError('Branch users must be assigned to a branch');
      return false;
    }
    // For non-full-access users, prevent creating accounts outside their branch
    if (!accessAllBranches && form.branchId && form.branchId !== user?.branchId) {
      setError('You can only manage accounts for your assigned branch');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (editingId) {
        const updateData: UpdateAccountRequest = {
          name: form.name,
          email: form.email,
          role: form.role,
          branchId: form.branchId
        };
        if (form.username) {
          updateData.username = form.username;
        }
        await accountApi.update(editingId, updateData);
        setSuccess('Account updated successfully');
      } else {
        await accountApi.create(form);
        setSuccess('Account created successfully');
      }

      await fetchAccounts();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({
      username: account.username,
      password: '',
      name: account.name,
      email: account.email,
      role: account.role,
      branchId: account.branchId
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (id === user?.id) {
      setError("Cannot delete your own account");
      return;
    }
    
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      setLoading(true);
      await accountApi.delete(id);
      setSuccess('Account deleted successfully');
      await fetchAccounts();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (id === user?.id && currentStatus) {
      setError("Cannot disable your own account");
      return;
    }

    try {
      setLoading(true);
      await accountApi.toggleStatus(id);
      setSuccess(`Account ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      await fetchAccounts();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle account status');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!resetPassword) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      await accountApi.updatePassword(id, { password: resetPassword });
      
      setSuccess('Password updated successfully');
      setResetPassword('');
      setResetPasswordAccountId(null);
      setShowResetPasswordModal(false);
      setError(null);
      
      await fetchAccounts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyAccountForm);
    setShowForm(false);
    setEditingId(null);
    setResetPassword('');
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || account.role === filterRole;
    const matchesBranch = filterBranch === 'all' || account.branchId === filterBranch;
    
    // If user doesn't have access to all branches, only show their branch
    if (!accessAllBranches && account.branchId !== user?.branchId) {
      return false;
    }
    
    return matchesSearch && matchesRole && matchesBranch;
  });

  if (!canManage) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-start gap-4 max-w-2xl">
          <FaLock className="text-red-600 text-2xl mt-1 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-700 mb-3">
              Only users with the following roles can access account management:
            </p>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              <li>General Manager (GM)</li>
              <li>Chief Executive Officer (CEO)</li>
              <li>National Sales Manager (NSM)</li>
              <li>Accounting</li>
              <li>Finance</li>
            </ul>
            <p className="text-red-600 text-sm mt-4">
              Your current role: <strong>{user?.role.toUpperCase()}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with Role Info */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Account Management</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Logged in as: <strong>{user?.name}</strong> ({user?.role.toUpperCase()})
                {user?.branchId && branches.length > 0 && (
                  <span className="ml-2">
                    | Branch: <strong>{branches.find(b => b.id === user.branchId)?.name || 'Unknown'}</strong>
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FaPlus /> New Account
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">✕</button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {editingId ? 'Edit Account' : 'Create New Account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleInputChange}
                    disabled={!!editingId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required={!editingId}
                  />
                </div>

                {/* Password - Only show when creating new account */}
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingId}
                    />
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch {form.role === 'branch' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    name="branchId"
                    value={form.branchId || ''}
                    onChange={handleInputChange}
                    disabled={!accessAllBranches && form.role === 'branch'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {accessAllBranches ? 'Select Branch' : 'Your Branch Only'}
                    </option>
                    {accessAllBranches 
                      ? branches.map(branch => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))
                      : branches
                          .filter(b => b.id === user?.branchId)
                          .map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))
                    }
                  </select>
                  {form.role === 'branch' && !form.branchId && (
                    <p className="text-xs text-red-600 mt-1">Branch users must be assigned to a branch</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showResetPasswordModal && resetPasswordAccountId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Reset Password</h2>
              <p className="text-gray-600 mb-4">Enter new password for this account:</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (resetPasswordAccountId) {
                        handleResetPassword(resetPasswordAccountId);
                      }
                    }}
                    disabled={loading || !resetPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setResetPasswordAccountId(null);
                      setResetPassword('');
                    }}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, name, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as UserRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Roles</option>
            {ROLES.map(role => (
              <option key={role} value={role}>{role.toUpperCase()}</option>
            ))}
          </select>
          {accessAllBranches && (
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading && accounts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Loading accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No accounts found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Branch</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAccounts.map(account => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{account.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{account.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {account.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {account.branch ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {account.branch.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {account.isActive ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <FaCheck /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <FaTimes /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordAccountId(account.id);
                            setShowResetPasswordModal(true);
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition"
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(account.id, account.isActive)}
                          className={`p-2 rounded-lg transition ${
                            account.isActive
                              ? 'text-orange-600 hover:bg-orange-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={account.isActive ? 'Disable' : 'Enable'}
                        >
                          {account.isActive ? <FaLock /> : <FaUnlock />}
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={account.id === user?.id}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Statistics */}
        {filteredAccounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-800">{accounts.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-600">{accounts.filter(a => a.isActive).length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{accounts.filter(a => !a.isActive).length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Filtered Results</p>
              <p className="text-2xl font-bold text-blue-600">{filteredAccounts.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
