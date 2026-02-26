'use client';

import React, { useState } from 'react';
import {
  User, Mail, Phone, Building2, Shield, Calendar,
  Camera, Edit3, Save, X, CheckCircle, Key, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatDate } from '../utils';

const ProfileScreen = ({ user: propUser, onUpdateUser }) => {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  // Use prop user, then auth context user
  const user = propUser || authUser || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      onUpdateUser && await onUpdateUser(formData);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
    });
    setIsEditing(false);
  };

  const InfoCard = ({ icon: Icon, label, value, field, editable = true }) => (
    <div className="p-4 rounded-xl border transition-all duration-200 bg-[#FFFFFF] border-[#E8E2DB] hover:border-[#D4B082]">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#F0EBE5]">
          <Icon size={18} className="text-[#C4975A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider mb-1 text-[#6B5D4F]">
            {label}
          </div>
          {isEditing && editable ? (
            <input
              type={field === 'email' ? 'email' : 'text'}
              value={formData[field] || ''}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm font-medium outline-none transition-all bg-[#FBF9F7] border-[#E8E2DB] text-[#2C2417] focus:border-[#C4975A]"
            />
          ) : (
            <div className="text-sm font-medium text-[#2C2417]">
              {value || '-'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold font-brand text-[#2C2417]">
            {t('profile.title')}
          </h1>
          <p className="text-xs mt-0.5 text-[#6B5D4F]">
            {t('profile.subtitle')}
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#EDE0D0] text-[#A67B3D] border border-[#D4B082] hover:bg-[#D4B082] hover:text-[#7D5A28]"
          >
            <Edit3 size={16} />
            {t('profile.editProfile')}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#F0EBE5] text-[#6B5D4F] border border-[#E8E2DB] hover:text-[#2C2417]"
            >
              <X size={16} />
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#1B6B45] text-white hover:bg-[#155a39] ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('profile.saveChanges')}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border overflow-hidden bg-[#FBF9F7] border-[#E8E2DB]">
        {/* Header with Avatar */}
        <div className="p-3 md:p-6 border-b bg-gradient-to-r from-[rgba(196,151,90,0.08)] to-[rgba(27,107,69,0.06)] border-[#E8E2DB]">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold font-brand border-[#C4975A] text-[#A67B3D]"
              style={{ borderWidth: '3px', borderStyle: 'solid' }}
              >
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#1B6B45] border-2 border-[#FBF9F7]" />
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/40">
                <Camera size={24} className="text-white" />
              </div>
            </div>

            {/* Name & Role */}
            <div className="flex-1">
              <h2 className="text-xl font-bold font-brand text-[#2C2417]">
                {user?.name || 'User'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={14} className="text-[#C4975A]" />
                <span className="text-sm text-[#6B5D4F]">
                  {user?.role?.name || 'User'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(27,107,69,0.1)] text-[#1B6B45]">
                  <CheckCircle size={12} />
                  Active
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-[#F0EBE5] text-[#6B5D4F]">
                  <Calendar size={12} />
                  Joined {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={User} label={t('profile.fullName')} value={user?.name} field="name" />
            <InfoCard icon={Mail} label={t('profile.emailAddress')} value={user?.email} field="email" />
            <InfoCard icon={Phone} label={t('profile.phoneNumber')} value={user?.phone || t('profile.notSet')} field="phone" />
            <InfoCard icon={Building2} label={t('profile.department')} value={user?.department || t('profile.notSet')} field="department" />
            <InfoCard icon={Shield} label={t('profile.role')} value={user?.role?.name} field="role" editable={false} />
            <InfoCard icon={Key} label={t('profile.userId')} value={user?.id || 'N/A'} field="id" editable={false} />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border p-3 md:p-6 border-[#E8E2DB]" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(196,151,90,0.04) 35%, rgba(196,151,90,0.10) 100%)',
        boxShadow: 'inset 0 -1px 0 rgba(44,36,23,0.06)',
      }}>
        <h3 className="text-base font-semibold font-brand mb-4 text-[#2C2417]">
          {t('profile.security')}
        </h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg border transition-all bg-[#FBF9F7] border-[#E8E2DB] hover:border-[#D4B082]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F0EBE5]">
                <Key size={18} className="text-[#8C8178]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-[#2C2417]">
                  {t('profile.changePassword')}
                </div>
                <div className="text-xs text-[#6B5D4F]">
                  {t('profile.updatePasswordRegularly')}
                </div>
              </div>
            </div>
            <div className="text-xs text-[#6B5D4F]">
              →
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border transition-all bg-[#FBF9F7] border-[#E8E2DB] hover:border-[#D4B082]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F0EBE5]">
                <Bell size={18} className="text-[#8C8178]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-[#2C2417]">
                  {t('profile.notificationPreferences')}
                </div>
                <div className="text-xs text-[#6B5D4F]">
                  {t('profile.manageNotifications')}
                </div>
              </div>
            </div>
            <div className="text-xs text-[#6B5D4F]">
              →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
