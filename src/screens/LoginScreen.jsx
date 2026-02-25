'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Screen: LoginScreen | API: /auth/login | Status: COMPLETE
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginScreen = () => {
  const { login, loading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError(t('login.emptyFieldError'));
      return;
    }

    try {
      await login(email, password);
      toast.success(t('login.loginSuccess'));
    } catch (err) {
      setLocalError(err.message || t('login.loginFailed'));
      toast.error(err.message || t('login.loginFailed'));
    }
  };

  // Demo accounts for quick login
  const demoAccounts = [
    { email: 'admin@dafc.com', password: 'dafc@2026', role: 'Admin', color: 'text-[#C4975A]' },
    { email: 'merch@dafc.com', password: 'dafc@2026', role: 'Merchandiser', color: 'text-[#1B6B45]' },
    { email: 'manager@dafc.com', password: 'dafc@2026', role: 'Manager', color: 'text-[#2563EB]' },
    { email: 'finance@dafc.com', password: 'dafc@2026', role: 'Finance', color: 'text-[#7D5A28]' },
  ];

  const handleDemoLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img
            src="/dafc-logo.png"
            alt="DAFC"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[#2C2417]">{t('login.title')}</h1>
          <p className="text-[#6B5D4F] mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-[#E8E2DB] rounded-2xl p-8 shadow-[0_4px_24px_rgba(44,36,23,0.06)]">
          <h2 className="text-xl font-semibold text-[#2C2417] mb-6">{t('login.signIn')}</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#6B5D4F] mb-2">
                {t('login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#FBF9F7] border border-[#E8E2DB] rounded-xl text-[#2C2417] placeholder-[#8C8178] focus:outline-none focus:border-[#C4975A] focus:ring-1 focus:ring-[#C4975A] transition-all"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B5D4F] mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FBF9F7] border border-[#E8E2DB] rounded-xl text-[#2C2417] placeholder-[#8C8178] focus:outline-none focus:border-[#C4975A] focus:ring-1 focus:ring-[#C4975A] transition-all pr-12"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8178] hover:text-[#6B5D4F]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {localError && (
              <div className="p-3 bg-[#DC3545]/10 border border-[#DC3545]/20 rounded-xl text-[#DC3545] text-sm">
                {localError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#C4975A] hover:bg-[#A67B3D] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#C4975A]/20"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('login.signingIn')}
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  {t('login.signIn')}
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-[#E8E2DB]">
            <p className="text-sm text-[#8C8178] mb-4">{t('login.quickLogin')}</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  className="flex items-center justify-between px-3 py-2.5 bg-[#FBF9F7] hover:bg-[#F0EBE5] border border-[#E8E2DB] rounded-lg transition-colors text-sm group"
                >
                  <span className="text-[#6B5D4F] truncate">{account.email.split('@')[0]}</span>
                  <span className={`font-medium ${account.color}`}>{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#8C8178] text-sm mt-8">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
