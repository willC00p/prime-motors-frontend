import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/bbe3c3d7-0346-4384-8100-6107ebdd5677-removebg-preview.png';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading, user } = useAuth();
  const navigate = useNavigate();
  // previous logo image removed — hero now uses the background image

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Login failed:', err);
    }
  };

  // If already authenticated, keep users away from the login page
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-black">
      {/* Left hero panel */}
      <div
        className="relative hidden lg:flex items-center justify-center bg-black"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#39FF14_0%,transparent_35%),radial-gradient(circle_at_80%_30%,#39FF14_0%,transparent_30%),radial-gradient(circle_at_50%_80%,#39FF14_0%,transparent_35%)]" />
        <div className="relative h-full w-full flex items-center justify-center p-10">
          {/* Rotated logo image slot */}
          <div className="flex items-center justify-center" />
        </div>
      </div>

      {/* Right side auth card */}
      <div className="flex items-center justify-center bg-gray-50 py-12 px-6 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold">
              <span className="text-gray-900">Welcome to </span>
              <span className="text-neon">Prime Motors</span>
              
            </h1>
            <h1 className="text-3xl font-extrabold">
              <span className="text-gray-900">Sales and</span>
              <span className="text-neon"> Inventory System</span>
              
            </h1>
            <p className="mt-2 text-sm text-gray-500">Please sign in to continue</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-gray-600 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-neon focus:ring-2 focus:ring-neon focus:outline-none"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-neon focus:ring-2 focus:ring-neon focus:outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-neon px-4 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-[color:#33e512] focus:outline-none focus:ring-2 focus:ring-neon disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block h-[1px] flex-1 bg-gray-200" />
              <span>Secured Access</span>
              <span className="inline-block h-[1px] flex-1 bg-gray-200" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
