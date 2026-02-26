'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Edit2, Trash2, Save, X,
  ChevronRight, Users, Building2, RefreshCw,
  LayoutList, GitBranch, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { approvalWorkflowService } from '../services/approvalWorkflowService';
import { masterDataService } from '../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui';

const ApprovalWorkflowScreen = ({ darkMode = false }) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { dialogProps, confirm } = useConfirmDialog();
  const [steps, setSteps] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    brandId: '',
    stepNumber: 1,
    roleName: '',
    roleCode: '',
    description: '',
  });

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    try {
      const brandId = selectedBrandId === 'all' ? null : selectedBrandId;
      const result = await approvalWorkflowService.getAll(brandId);
      setSteps(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to fetch steps:', err);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [brandsRes, rolesRes] = await Promise.all([
          masterDataService.getBrands(),
          approvalWorkflowService.getAvailableRoles().catch(() => []),
        ]);
        const brandList = Array.isArray(brandsRes) ? brandsRes : (brandsRes?.data || []);
        setBrands(brandList);
        setAvailableRoles(Array.isArray(rolesRes) ? rolesRes : []);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const getNextStepNumber = () => {
    const brandSteps = selectedBrandId === 'all' ? steps : steps.filter(s => s.brandId === selectedBrandId);
    return brandSteps.length > 0 ? Math.max(...brandSteps.map(s => s.stepNumber)) + 1 : 1;
  };

  const openAddModal = () => {
    setEditingStep(null);
    setFormData({
      brandId: selectedBrandId !== 'all' ? selectedBrandId : '',
      stepNumber: getNextStepNumber(),
      roleName: '',
      roleCode: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (step) => {
    setEditingStep(step);
    setFormData({
      brandId: step.brandId,
      stepNumber: step.stepNumber,
      roleName: step.roleName,
      roleCode: step.roleCode || '',
      description: step.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.brandId || !formData.roleName) return;
    setSaving(true);
    try {
      if (editingStep) {
        await approvalWorkflowService.update(editingStep.id, formData);
        toast.success(t('approval.stepUpdated'));
      } else {
        await approvalWorkflowService.create(formData);
        toast.success(t('approval.stepCreated'));
      }
      setIsModalOpen(false);
      fetchSteps();
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error(err.response?.data?.message || t('approval.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: t('approval.confirmDelete'),
      message: t('approval.deleteStepWarning') || 'This action cannot be undone.',
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await approvalWorkflowService.delete(id);
          toast.success(t('approval.stepDeleted'));
          fetchSteps();
        } catch (err) {
          console.error('Failed to delete:', err);
          toast.error(t('approval.failedToDeleteStep'));
        }
      },
    });
  };

  // Group steps by brand for progress view
  const stepsByBrand = steps.reduce((acc, step) => {
    const brandName = step.brand?.name || 'Unknown';
    if (!acc[brandName]) acc[brandName] = [];
    acc[brandName].push(step);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Compact Header + Filters */}
      <div className="rounded-xl border px-3 py-2 border-[#E8E2DB] bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <Settings size={14} className="text-content-muted flex-shrink-0" />
          <div className="flex-shrink-0">
            <h1 className="text-sm font-semibold font-brand text-[#2C2417] leading-tight">
              {t('approval.title')}
            </h1>
            <p className="text-[10px] font-brand text-[#8C8178] leading-tight">
              {t('approval.subtitle')}
            </p>
          </div>

          {/* Inline Filters */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="px-2 py-1 border rounded-lg text-xs font-brand transition-all focus:outline-none focus:ring-1 focus:ring-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
            >
              <option value="all">{t('approval.brand')}</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name || brand.code}</option>
              ))}
            </select>

            <button
              onClick={fetchSteps}
              disabled={loading}
              className="p-1.5 rounded-lg transition-colors text-content-muted hover:text-content hover:bg-surface-secondary"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* View Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-secondary">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-[#6B4D30] shadow-sm'
                    : 'text-[#6B5D4F]'
                }`}
                title={t('approval.tableView')}
              >
                <LayoutList size={13} />
              </button>
              <button
                onClick={() => setViewMode('progress')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'progress'
                    ? 'bg-white text-[#6B4D30] shadow-sm'
                    : 'text-[#6B5D4F]'
                }`}
                title={t('approval.progressView')}
              >
                <GitBranch size={13} />
              </button>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#C4975A] hover:bg-[#B8894E] text-white font-semibold text-xs font-brand rounded-lg transition-colors"
            >
              <Plus size={13} />
              {t('approval.addStep')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-[#6B4D30]" />
          <p className="text-sm font-brand text-[#8C8178]">{t('approval.loadingSteps')}</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand text-[#8C8178]">{t('approval.brand')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand w-16 text-[#8C8178]">{t('approval.step')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand text-[#8C8178]">{t('approval.roleUser')}</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand text-[#8C8178]">{t('common.description')}</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider font-brand w-24 text-[#8C8178]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {steps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-12 text-center text-xs font-brand text-[#8C8178]">
                    {t('approval.noStepsConfigured')}
                  </td>
                </tr>
              ) : (
                steps.map((step) => (
                  <tr key={step.id} className="border-t transition-colors border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.06)]">
                    <td className="px-3 py-1.5 text-xs font-semibold font-brand text-[#2C2417]">
                      {step.brand?.name || '-'}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] font-data bg-[rgba(196,151,90,0.2)] text-[#6B4D30]">
                        {step.stepNumber}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-brand text-[#2C2417]">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-[#8C8178]" />
                        {step.roleName}
                        {step.user && (
                          <span className="text-[10px] text-[#6B5D4F]">({step.user.name})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-brand text-[#8C8178]">
                      {step.description || '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        onClick={() => openEditModal(step)}
                        className="p-2 rounded-lg transition-colors text-[#8C8178] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(step.id)}
                        className="p-2 rounded-lg transition-colors ml-1 text-[#8C8178] hover:text-[#DC3545] hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        /* Progress View */
        <div className="space-y-3">
          {Object.entries(stepsByBrand).map(([brandName, brandSteps]) => (
            <div key={brandName} className="rounded-xl border p-4 border-[#E8E2DB] bg-white">
              <h3 className="text-sm font-semibold font-brand mb-3 flex items-center gap-2 text-[#2C2417]">
                <Building2 size={15} className="text-[#6B4D30]" />
                {brandName}
              </h3>
              <div className="flex items-center gap-4 flex-wrap">
                {brandSteps.sort((a, b) => a.stepNumber - b.stepNumber).map((step, index) => (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 bg-[rgba(160,120,75,0.18)] border-[#C4975A]">
                        <span className="font-bold font-data text-[#6B4D30]">{step.stepNumber}</span>
                      </div>
                      <span className="mt-2 text-sm font-medium font-brand text-center max-w-[100px] text-[#2C2417]">
                        {step.roleName}
                      </span>
                    </div>
                    {index < brandSteps.length - 1 && (
                      <ChevronRight size={20} className="text-[#E8E2DB]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(stepsByBrand).length === 0 && (
            <div className="p-16 text-center rounded-xl border bg-white border-[#E8E2DB]">
              <Settings size={48} className="mx-auto mb-4 text-[#E8E2DB]" />
              <p className="text-sm font-brand text-[#8C8178]">
                {t('approval.noStepsProgress')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div
            className="rounded-2xl w-full max-w-md p-6 m-4 shadow-2xl bg-white border border-[#E8E2DB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-brand text-[#2C2417]">
                {editingStep ? t('approval.editStep') : t('approval.addNewStep')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg transition-colors hover:bg-[rgba(160,120,75,0.18)] text-[#8C8178]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-medium mb-1.5 font-brand text-[#8C8178]">{t('approval.brand')}</label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                  disabled={!!editingStep}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm font-brand focus:outline-none focus:ring-2 focus:ring-[#C4975A] disabled:opacity-50 bg-white border-[#E8E2DB] text-[#2C2417]"
                >
                  <option value="">{t('approval.selectBrand')}</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name || brand.code}</option>
                  ))}
                </select>
              </div>

              {/* Step Number */}
              <div>
                <label className="block text-xs font-medium mb-1.5 font-brand text-[#8C8178]">{t('approval.stepNumber')}</label>
                <input
                  type="number"
                  min="1"
                  value={formData.stepNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, stepNumber: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm font-data focus:outline-none focus:ring-2 focus:ring-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium mb-1.5 font-brand text-[#8C8178]">{t('approval.role')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(availableRoles.length > 0 ? availableRoles : [
                    { code: 'BRAND_MANAGER', name: 'Brand Manager' },
                    { code: 'GROUP_HEAD', name: 'Group Head' },
                    { code: 'FINANCE', name: 'Finance Lead' },
                    { code: 'CEO', name: 'CEO' },
                    { code: 'ADMIN', name: 'Admin' },
                  ]).map(role => (
                    <button
                      key={role.code}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, roleName: role.name, roleCode: role.code }))}
                      className={`px-3 py-2 text-sm font-brand rounded-lg border transition-colors ${
                        formData.roleCode === role.code
                          ? 'bg-[rgba(196,151,90,0.2)] border-[#C4975A] text-[#6B4D30]'
                          : 'border-[#E8E2DB] text-[#8C8178] hover:border-[rgba(196,151,90,0.4)]'
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5 font-brand text-[#8C8178]">{t('approval.descriptionOptional')}</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('approval.descriptionPlaceholder')}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm font-brand focus:outline-none focus:ring-2 focus:ring-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417] placeholder-[#6B5D4F]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 border rounded-lg font-medium text-sm font-brand transition-colors border-[#E8E2DB] text-[#8C8178] hover:bg-[rgba(160,120,75,0.12)]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.brandId || !formData.roleName || saving}
                className="flex-1 px-4 py-2.5 bg-[#C4975A] hover:bg-[#B8894E] text-white font-semibold text-sm font-brand rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? t('approval.saving') : editingStep ? t('common.update') : t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default ApprovalWorkflowScreen;
