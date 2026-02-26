'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight,
  Building2, Package, FolderTree, Tag,
  RefreshCw, X
} from 'lucide-react';
import { masterDataService } from '../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatCurrency } from '../utils';
import { includes as viIncludes } from '../utils/normalizeVietnamese';

// Config per master data type (takes t for i18n)
const getTypeConfig = (t) => ({
  brands: {
    title: t('masterData.titleBrands'),
    icon: Building2,
    fetchFn: () => masterDataService.getBrands(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colBrandName') },
      { key: 'groupBrand', label: t('masterData.colGroup'), render: (v) => v?.name || v || '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
  skus: {
    title: t('masterData.titleSkuCatalog'),
    icon: Package,
    fetchFn: () => masterDataService.getSkuCatalog(),
    columns: [
      { key: 'skuCode', label: t('masterData.colSkuCode'), width: '140px', mono: true },
      { key: 'productName', label: t('masterData.colProductName') },
      { key: 'productType', label: t('masterData.colCategory'), width: '150px', render: (v) => v?.name || v || '-' },
      { key: 'color', label: t('masterData.colColor'), width: '120px', render: (v) => v?.name || v || '-' },
      { key: 'theme', label: t('masterData.colTheme'), width: '120px', render: (v) => v?.name || v || '-' },
      { key: 'srp', label: t('masterData.colSRP'), width: '120px', render: (v) => v ? formatCurrency(v) : '-', mono: true },
    ],
    searchFields: ['skuCode', 'productName', 'color'],
  },
  categories: {
    title: t('masterData.titleCategories'),
    icon: FolderTree,
    fetchFn: () => masterDataService.getCategories(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colCategoryName') },
      { key: 'gender', label: t('masterData.colGender'), render: (v) => v?.name || v || '-' },
      { key: 'subCategories', label: t('masterData.colSubCategories'), render: (v) => Array.isArray(v) ? t('masterData.items', { count: v.length }) : '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
  subcategories: {
    title: t('masterData.titleSubCategories'),
    icon: Tag,
    fetchFn: () => masterDataService.getSubCategories(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colSubCategoryName') },
      { key: 'parent', label: t('masterData.colParentCategory'), render: (v) => v?.name || '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
});

const MasterDataScreen = ({ type = 'brands' }) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const TYPE_CONFIG = useMemo(() => getTypeConfig(t), [t]);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.brands;
  const Icon = config.icon;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await config.fetchFn();
      const list = Array.isArray(result) ? result : (result?.data || []);
      setData(list);
    } catch (err) {
      console.error('Master data fetch error:', err);
      setError(t('masterData.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter(item =>
      config.searchFields.some(field => {
        const value = item[field];
        return value && viIncludes(value.toString(), searchTerm);
      })
    );
  }, [data, searchTerm, config.searchFields]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const renderBadge = (value) => {
    const isActive = value === 'Active';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
          : 'bg-red-50 text-[#DC3545]'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-[#1B6B45]' : 'bg-[#DC3545]'}`} />
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header + Search - Merged compact */}
      <div className="rounded-lg border overflow-hidden border-[#E8E2DB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <Icon size={14} className="text-content-muted" />
            <div>
              <h1 className="text-sm font-bold font-brand leading-tight text-[#2C2417]">
                {config.title}
              </h1>
              <p className="text-[10px] font-data text-[#8C8178]">
                {loading ? t('common.loading') : t('masterData.records', { count: filteredData.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C8178]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={`${t('masterData.search')} ${config.title.toLowerCase()}...`}
                className="w-40 md:w-56 pl-8 pr-7 py-1 border rounded-md text-xs font-brand transition-all focus:outline-none focus:ring-1 focus:ring-[#D4B082] bg-[#FFFFFF] border-[#E8E2DB] text-[#2C2417] placeholder-[#8C8178]"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8178] hover:text-[#6B5D4F]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs font-brand transition-all text-[#6B5D4F] hover:text-[#A67B3D] hover:bg-[rgba(196,151,90,0.12)] border border-[#E8E2DB]"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {t('masterData.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border overflow-hidden border-[#E8E2DB] bg-white">
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-[#A67B3D]" />
            <p className="text-xs font-brand text-[#8C8178]">{t('masterData.loadingData')}</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-[#DC3545] mb-3 text-xs font-brand">{error}</p>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-[#C4975A] text-[#FFFFFF] rounded-md font-medium text-xs font-brand hover:bg-[#A67B3D] transition-colors"
            >
              {t('masterData.tryAgain')}
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-10 text-center">
            <Icon size={32} className="mx-auto mb-3 text-[#D4CBBC]" />
            <p className="text-xs font-brand text-[#8C8178]">
              {searchTerm ? t('masterData.noResultsFound') : t('masterData.noDataAvailable')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FBF9F7]">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand w-10 text-[#8C8178]">
                      #
                    </th>
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-brand text-[#8C8178]"
                        style={{ width: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="border-t transition-colors border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.05)]"
                    >
                      <td className="px-3 py-1.5 text-xs font-data text-[#D4CBBC]">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      {config.columns.map((col) => {
                        const rawValue = item[col.key];
                        const displayValue = col.render ? col.render(rawValue, item) : (rawValue || '-');

                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-1.5 text-xs ${
                              col.mono ? "font-data" : "font-brand"
                            } text-[#2C2417]`}
                          >
                            {col.badge ? renderBadge(displayValue) : displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#E8E2DB]">
                <p className="text-[10px] font-data text-[#8C8178]">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(196,151,90,0.12)] text-[#6B5D4F]"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 py-0.5 text-[10px] font-data text-[#2C2417]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(196,151,90,0.12)] text-[#6B5D4F]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MasterDataScreen;
