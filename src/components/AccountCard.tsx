import { FaEdit, FaTrash, FaCheck, FaTimes, FaLock, FaUnlock } from 'react-icons/fa';
import type { Account } from '../types/account';

interface AccountCardProps {
  account: Account;
  currentUserId?: number;
  isLoading?: boolean;
  onEdit: (account: Account) => void;
  onResetPassword: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
}

export default function AccountCard({
  account,
  currentUserId,
  isLoading = false,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete
}: AccountCardProps) {
  const getRoleColor = (role: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      gm: { bg: 'bg-red-100', text: 'text-red-800' },
      ceo: { bg: 'bg-purple-100', text: 'text-purple-800' },
      nsm: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      accounting: { bg: 'bg-green-100', text: 'text-green-800' },
      finance: { bg: 'bg-blue-100', text: 'text-blue-800' },
      purchasing: { bg: 'bg-orange-100', text: 'text-orange-800' },
      audit: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      branch: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    };
    return colors[role] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const roleColor = getRoleColor(account.role);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{account.name}</h3>
          <p className="text-sm text-gray-600">@{account.username}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
          {account.role.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
          <p className="text-sm text-gray-900">{account.email}</p>
        </div>

        {account.branch && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Branch</p>
            <p className="text-sm text-gray-900 bg-purple-50 px-2 py-1 rounded inline-block">
              {account.branch.name}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
            <div className="flex items-center gap-1 mt-1">
              {account.isActive ? (
                <>
                  <FaCheck className="text-green-600" />
                  <span className="text-sm font-medium text-green-600">Active</span>
                </>
              ) : (
                <>
                  <FaTimes className="text-red-600" />
                  <span className="text-sm font-medium text-red-600">Inactive</span>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Created</p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(account.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t pt-4">
        <button
          onClick={() => onEdit(account)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition disabled:opacity-50"
          title="Edit account details"
        >
          <FaEdit /> Edit
        </button>

        <button
          onClick={() => onResetPassword(account.id)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-2 rounded-lg transition disabled:opacity-50"
          title="Reset password"
        >
          🔑 Password
        </button>

        <button
          onClick={() => onToggleStatus(account.id, account.isActive)}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition disabled:opacity-50 ${
            account.isActive
              ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
              : 'bg-green-50 hover:bg-green-100 text-green-600'
          }`}
          title={account.isActive ? 'Disable account' : 'Enable account'}
        >
          {account.isActive ? <FaLock /> : <FaUnlock />}
        </button>

        <button
          onClick={() => onDelete(account.id)}
          disabled={isLoading || account.id === currentUserId}
          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={account.id === currentUserId ? 'Cannot delete your own account' : 'Delete account'}
        >
          <FaTrash /> Delete
        </button>
      </div>

      {/* Current User Indicator */}
      {account.id === currentUserId && (
        <div className="mt-3 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
          This is your account
        </div>
      )}
    </div>
  );
}
