'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Screen: LoginScreen | API: /auth/login | Status: COMPLETE
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginScreen = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter email and password');
      return;
    }

    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (err) {
      setLocalError(err.message || 'Login failed');
      toast.error(err.message || 'Login failed');
    }
  };

  // Demo accounts for quick login
  const demoAccounts = [
    { email: 'admin@dafc.com', password: 'dafc@2026', role: 'Admin', color: 'text-[#D7B797]' },
    { email: 'merch@dafc.com', password: 'dafc@2026', role: 'Merchandiser', color: 'text-emerald-400' },
    { email: 'manager@dafc.com', password: 'dafc@2026', role: 'Manager', color: 'text-blue-400' },
    { email: 'finance@dafc.com', password: 'dafc@2026', role: 'Finance', color: 'text-purple-400' },
  ];

  const handleDemoLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img
            src="/dafc-logo.png"
            alt="DAFC"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">OTB Planning System</h1>
          <p className="text-slate-400 mt-2">Open-to-Buy Planning & Management</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#D7B797] focus:ring-1 focus:ring-[#D7B797] transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#D7B797] focus:ring-1 focus:ring-[#D7B797] transition-all pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {localError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {localError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D7B797] hover:bg-[#c9a27a] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#D7B797]/20"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-500 mb-4">Quick login (Demo accounts):</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-sm group"
                >
                  <span className="text-slate-300 truncate">{account.email.split('@')[0]}</span>
                  <span className={`font-medium ${account.color}`}>{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          DAFC Vietnam © 2025. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
