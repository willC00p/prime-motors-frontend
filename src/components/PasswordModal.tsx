import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error?: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
        <h2 className="text-lg font-bold mb-4">Enter Daily Password</h2>
        <input
          type="password"
          className="border rounded px-3 py-2 w-full mb-3"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
        />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={() => { onSubmit(password); setPassword(''); }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
