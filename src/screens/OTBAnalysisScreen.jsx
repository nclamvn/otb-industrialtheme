'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3, Filter, ChevronDown, Check,
  Calendar, Tag, Layers, Users, Info, Pencil, X, Star,
  Sparkles, FileText, Clock, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils';
import { STORES, GENDERS } from '../utils/constants';
import { budgetService, masterDataService, planningService } from '../services';

import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

// Constants
const SEASON_GROUPS = [
  { id: 'SS', label: 'Spring Summer' },
  { id: 'FW', label: 'Fall Winter' }
];

const SEASONS = [
  { id: 'Pre', label: 'Pre' },
  { id: 'Main/Show', label: 'Main/Show' }
];

const TABS = [
  { id: 'collection', label: 'Collection', icon: Layers },
  { id: 'gender', label: 'Gender', icon: Users },
  { id: 'category', label: 'Category', icon: Tag }
];

// Reusable editable cell component (memoized to prevent unnecessary re-renders)
const EditableCell = React.memo(({ cellKey, value, isEditing, editValue, onStartEdit, onSaveEdit, onChangeValue, onKeyDown, readOnly = false, darkMode = false }) => {
  const { t } = useLanguage();
  if (isEditing && !readOnly) {
    return (
      <div className="flex items-center justify-center animate-in zoom-in duration-200">
        <input
          type="number"
          value={editValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => onSaveEdit(cellKey)}
          onKeyDown={(e) => onKeyDown(e, cellKey)}
          className="w-20 px-2 py-1.5 text-center border-2 border-[#C4975A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.5)] font-['JetBrains_Mono'] font-medium transition-all bg-white text-[#2C2417]"
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg min-w-[70px] justify-center bg-[#FBF9F7] border-[#C4B5A5]">
          <span className="font-['JetBrains_Mono'] font-medium text-[#8C8178]">
            {typeof value === 'number' ? value.toFixed(0) : value}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(cellKey, value)}
      className="group flex items-center justify-center gap-1 cursor-pointer"
      title={t ? t('otbAnalysis.clickToEdit') : 'Click to edit'}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all min-w-[70px] justify-center bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] hover:bg-[rgba(215,183,151,0.25)] hover:border-[rgba(215,183,151,0.5)]">
        <span className="font-['JetBrains_Mono'] font-medium text-[#8A6340]">
          {typeof value === 'number' ? value.toFixed(0) : value}%
        </span>
        <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8A6340]" />
      </div>
    </div>
  );
});

const OTBAnalysisScreen = ({ otbContext, onOpenSkuProposal, darkMode = false }) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [activeTab, setActiveTab] = useState('collection');

  // API data states
  const [categoryStructure, setCategoryStructure] = useState([]);
  const [collectionSections, setCollectionSections] = useState([]);
  const [apiDataLoading, setApiDataLoading] = useState(true);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Version states
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({ status: 'APPROVED' });
      const budgetList = (response.data || response || []).map(budget => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.groupBrandId || budget.brandId,
        brandName: budget.groupBrand?.name || budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: Number(budget.totalBudget) || Number(budget.totalAmount) || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
        seasonGroup: budget.seasonGroupId || budget.seasonGroup || '',
        seasonType: budget.seasonType || '',
        status: (budget.status || 'DRAFT').toLowerCase(),
        details: budget.details || []
      }));
      setApiBudgets(budgetList);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      toast.error(t('budget.failedToLoadBudgets'));
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Filter states
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [budgetContext, setBudgetContext] = useState(null); // Budget info from Planning Screen
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);

  // Fetch planning versions when budget is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedBudgetId || selectedBudgetId === 'all') {
        setVersions([]);
        setSelectedVersionId(null);
        return;
      }
      setLoadingVersions(true);
      try {
        const response = await planningService.getAll({ budgetId: selectedBudgetId });
        const list = Array.isArray(response) ? response : (response?.data || []);
        setVersions(list.map(v => ({
          id: v.id,
          name: v.name || v.versionName || `Version ${v.versionNumber || v.id}`,
          status: v.status || 'DRAFT',
          isFinal: v.isFinal || v.status === 'FINAL' || false,
          versionNumber: v.versionNumber
        })));
        // Auto-select the final version if one exists
        const finalVersion = list.find(v => v.isFinal || v.status === 'FINAL');
        if (finalVersion) {
          setSelectedVersionId(finalVersion.id);
        } else {
          setSelectedVersionId(null);
        }
      } catch (err) {
        console.error('Failed to fetch planning versions:', err);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [selectedBudgetId]);

  // Category tab filter states
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(null);

  // Editable cell states
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState({});

  // Category hierarchy collapse states
  const [expandedGenders, setExpandedGenders] = useState({ female: true, male: true });
  const [expandedCategories, setExpandedCategories] = useState({});


  // Refs
  const dropdownRefs = useRef({});
  const setDropdownRef = (key) => (el) => {
    dropdownRefs.current[key] = el;
  };
  // Fetch categories, collections, and planning versions from API
  useEffect(() => {
    const fetchApiData = async () => {
      setApiDataLoading(true);
      try {
        const [categoriesRes, collectionsRes] = await Promise.all([
          masterDataService.getCategories().catch(() => []),
          masterDataService.getCollections().catch(() => [])
        ]);

        // Transform categories into hierarchy
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        if (categories.length > 0) {
          const genderMap = {};
          categories.forEach(cat => {
            const genderId = (cat.gender?.id || cat.genderId || 'unknown').toLowerCase();
            const genderName = cat.gender?.name || cat.genderName || genderId;
            if (!genderMap[genderId]) {
              genderMap[genderId] = { gender: { id: genderId, name: genderName }, categories: [] };
            }
            const catId = cat.id || cat.categoryId;
            const catName = cat.name || cat.categoryName;
            let existingCat = genderMap[genderId].categories.find(c => c.id === catId);
            if (!existingCat) {
              existingCat = { id: catId, name: catName, subCategories: [] };
              genderMap[genderId].categories.push(existingCat);
            }
            if (cat.subCategories && cat.subCategories.length > 0) {
              cat.subCategories.forEach(sub => {
                if (!existingCat.subCategories.find(s => s.id === (sub.id || sub.subCategoryId))) {
                  existingCat.subCategories.push({ id: sub.id || sub.subCategoryId, name: sub.name || sub.subCategoryName });
                }
              });
            }
          });
          setCategoryStructure(Object.values(genderMap));
        }

        // Transform collections into sections
        const collections = Array.isArray(collectionsRes) ? collectionsRes : (collectionsRes?.data || []);
        if (collections.length > 0) {
          setCollectionSections(collections.map(c => ({ id: c.id || c.code, name: c.name || c.collectionName })));
        } else {
          setCollectionSections([
            { id: 'carryover', name: 'Carry Over/Commercial' },
            { id: 'seasonal', name: 'Seasonal' }
          ]);
        }

      } catch (err) {
        console.error('Failed to fetch OTB analysis data:', err);
      } finally {
        setApiDataLoading(false);
      }
    };
    fetchApiData();
  }, [otbContext?.budgetId]);

  // Initialize local data for editable cells (zeros instead of random — will be populated by API)
  useEffect(() => {
    const initialData = {};

    // Initialize Category tab data
    categoryStructure.forEach(genderGroup => {
      genderGroup.categories.forEach(cat => {
        cat.subCategories.forEach(subCat => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          initialData[key] = {
            buyPct: 0,
            salesPct: 0,
            stPct: 0,
            buyProposed: 0,
            otbProposed: 0,
            varPct: 0,
            otbSubmitted: 0,
            buyActual: 0
          };
        });
      });
    });

    // Initialize Collection tab data
    collectionSections.forEach(section => {
      STORES.forEach(store => {
        const key = `collection_${section.id}_${store.id}`;
        initialData[key] = {
          buyPct: 0,
          salesPct: 0,
          stPct: 0,
          moc: '0.0',
          userBuyPct: 0,
          otbValue: 0
        };
      });
    });

    // Initialize Gender tab data
    GENDERS.forEach(gender => {
      STORES.forEach(store => {
        const key = `gender_${gender.id}_${store.id}`;
        initialData[key] = {
          buyPct: 0,
          salesPct: 0,
          stPct: 0,
          userBuyPct: 0,
          otbValue: 0
        };
      });
    });

    setLocalData(initialData);
  }, [categoryStructure, collectionSections]);

  useEffect(() => {
    if (!otbContext) return;
    const { budgetId, budgetName, seasonGroup, season, rex, ttp, fiscalYear, brandName, groupBrand, totalBudget, status } = otbContext;

    // Try to find matching budget in loaded budgets
    let matchedBudget = null;
    if (budgetId && apiBudgets.find(b => b.id === budgetId)) {
      matchedBudget = apiBudgets.find(b => b.id === budgetId);
      setSelectedBudgetId(budgetId);
    } else if (budgetName) {
      matchedBudget = apiBudgets.find(b => b.budgetName === budgetName);
      if (matchedBudget) {
        setSelectedBudgetId(matchedBudget.id);
      }
    }

    // Store full budget context from Planning Screen (whether matched or passed directly)
    setBudgetContext({
      budgetId: budgetId || matchedBudget?.id,
      budgetName: budgetName || matchedBudget?.budgetName,
      fiscalYear: fiscalYear || matchedBudget?.fiscalYear || new Date().getFullYear(),
      brandName: brandName || matchedBudget?.brandName,
      groupBrand: groupBrand || matchedBudget?.groupBrand,
      totalBudget: totalBudget || matchedBudget?.totalBudget || 0,
      status: status || matchedBudget?.status || 'draft',
      seasonGroup: seasonGroup || 'all',
      season: season || 'all',
      rex: rex ?? 0,
      ttp: ttp ?? 0
    });

    if (seasonGroup) {
      setSelectedSeasonGroup(seasonGroup);
    }
    if (season) {
      setSelectedSeason(season);
    }
  }, [otbContext, apiBudgets]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const el = dropdownRefs.current[openDropdown];
        if (el && !el.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      if (openCategoryDropdown) {
        const el = dropdownRefs.current[openCategoryDropdown];
        if (el && !el.contains(event.target)) {
          setOpenCategoryDropdown(null);
        }
      }
};
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, openCategoryDropdown]);

  // Edit handlers
  const handleStartEdit = (cellKey, currentValue) => {
    setEditingCell(cellKey);
    setEditValue(typeof currentValue === 'number' ? currentValue.toFixed(0) : currentValue.toString());
  };

  const handleSaveEdit = (cellKey) => {
    const newValue = parseFloat(editValue) || 0;
    const isCollectionOrGender = cellKey.startsWith('collection_') || cellKey.startsWith('gender_');
    const fieldToUpdate = isCollectionOrGender ? 'userBuyPct' : 'buyProposed';

    setLocalData(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        [fieldToUpdate]: newValue
      }
    }));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e, cellKey) => {
    if (e.key === 'Enter') {
      handleSaveEdit(cellKey);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle set version as final
  const handleSetFinalVersion = async (versionId, e) => {
    e.stopPropagation();
    try {
      await planningService.finalize(versionId);
      toast.success(t('planning.latestVersion'));
      setVersions(prev => prev.map(v => ({
        ...v,
        isFinal: v.id === versionId
      })));
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error('Failed to set version as final:', err);
      toast.error(t('approval.failedToSave'));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBudgetId('all');
    setSelectedVersionId(null);
    setVersions([]);
  };

  const hasActiveFilters = selectedBudgetId !== 'all' || selectedSeasonGroup !== 'all' || selectedSeason !== 'all' || selectedVersionId;
  const selectedBudget = selectedBudgetId === 'all'
    ? null
    : apiBudgets.find(b => b.id === selectedBudgetId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // Build current allocation from localData for AI comparison
  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalOtbValue = 0;

    // Sum from collection data
    collectionSections.forEach(section => {
      STORES.forEach(store => {
        const key = `collection_${section.id}_${store.id}`;
        totalOtbValue += localData[key]?.otbValue || 0;
      });
    });

    return { otbValue: totalOtbValue };
  }, [localData]);

  // Toggle expanded state for hierarchy
  const toggleGenderExpanded = (genderId) => {
    setExpandedGenders(prev => ({ ...prev, [genderId]: !prev[genderId] }));
  };

  const toggleCategoryExpanded = (genderId, categoryId) => {
    const key = `${genderId}_${categoryId}`;
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate filter options from categoryStructure
  const filterOptions = useMemo(() => {
    const genders = [{ id: 'all', name: 'All Genders' }];
    const categories = [{ id: 'all', name: 'All Categories' }];
    const subCategories = [{ id: 'all', name: 'All Sub-Categories' }];

    categoryStructure.forEach(genderGroup => {
      genders.push({ id: genderGroup.gender.id, name: genderGroup.gender.name });
      genderGroup.categories.forEach(cat => {
        if (!categories.find(c => c.id === cat.id)) {
          categories.push({ id: cat.id, name: cat.name, genderId: genderGroup.gender.id });
        }
        cat.subCategories.forEach(subCat => {
          if (!subCategories.find(sc => sc.id === subCat.id)) {
            subCategories.push({ id: subCat.id, name: subCat.name, categoryId: cat.id, genderId: genderGroup.gender.id });
          }
        });
      });
    });

    return { genders, categories, subCategories };
  }, [categoryStructure]);

  // Get filtered categories based on gender selection
  const filteredCategoryOptions = useMemo(() => {
    if (genderFilter === 'all') return filterOptions.categories;
    return [
      { id: 'all', name: 'All Categories' },
      ...filterOptions.categories.filter(c => c.id !== 'all' && c.genderId === genderFilter)
    ];
  }, [genderFilter, filterOptions.categories]);

  // Get filtered sub-categories based on gender and category selection
  const filteredSubCategoryOptions = useMemo(() => {
    let options = filterOptions.subCategories;
    if (genderFilter !== 'all') {
      options = options.filter(sc => sc.id === 'all' || sc.genderId === genderFilter);
    }
    if (categoryFilter !== 'all') {
      options = options.filter(sc => sc.id === 'all' || sc.categoryId === categoryFilter);
    }
    return [{ id: 'all', name: 'All Sub-Categories' }, ...options.filter(o => o.id !== 'all')];
  }, [genderFilter, categoryFilter, filterOptions.subCategories]);

  // Reset dependent filters when parent filter changes
  const handleGenderFilterChange = (value) => {
    setGenderFilter(value);
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleSubCategoryFilterChange = (value) => {
    setSubCategoryFilter(value);
    setOpenCategoryDropdown(null);
  };

  // Common table styles - DAFC Design System
  const headerCellClass = "px-4 py-3 text-center text-xs font-semibold tracking-wide font-['Montserrat']";
  const headerDarkCell = 'bg-[#FBF9F7] text-[#6B5D4F]';
  const headerGoldCell = 'bg-[rgba(215,183,151,0.3)] text-[#8A6340]';
  const headerBrownCell = 'bg-[rgba(139,115,85,0.2)] text-[#5C4033]';
  const headerDarkBrownCell = 'bg-[rgba(92,64,51,0.2)] text-[#5C4033]';
  const groupRowClass = "bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] border-l-4 border-[#C4975A]";
  const sumRowClass = "bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] text-[#5C4A32] font-semibold";

  // Render Collection Tab
  const renderCollectionTab = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`}>{t('otbAnalysis.collection')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>MOC</th>
              <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
              <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
              <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
            </tr>
          </thead>
          <tbody>
            {collectionSections.map((section) => (
              <React.Fragment key={`col-${section.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-3" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-['Montserrat'] text-[#8A6340]">{section.name}</span>
                      <Info size={14} className="text-[#6B5D4F]" />
                    </div>
                  </td>
                </tr>

                {STORES.map((store) => {
                  const cellKey = `collection_${section.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = userBuyPctValue - (cellData.salesPct || 0);

                  return (
                    <tr
                      key={cellKey}
                      className="border-b transition-colors border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.08)]"
                    >
                      <td className="px-4 py-3 pl-8">
                        <span className="text-[#8C8178]">{store.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{cellData.moc || 0}</td>
                      <td className="px-4 py-3 bg-[rgba(160,120,75,0.12)]">
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-medium font-['JetBrains_Mono'] text-[#2C2417]">{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
                        variance < 0 ? 'text-[#DC3545]' : variance > 0 ? 'text-[#1B6B45]' : 'text-[#8C8178]'
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-bold font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Gender Tab
  const renderGenderTab = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`}>{t('otbAnalysis.gender')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
              <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
              <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
              <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
            </tr>
          </thead>
          <tbody>
            {GENDERS.map((gen) => (
              <React.Fragment key={`gen-${gen.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-3" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-['Montserrat'] text-[#8A6340]">{gen.name}</span>
                      <Info size={14} className="text-[#6B5D4F]" />
                    </div>
                  </td>
                </tr>

                {STORES.map((store) => {
                  const cellKey = `gender_${gen.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = userBuyPctValue - (cellData.salesPct || 0);

                  return (
                    <tr
                      key={cellKey}
                      className="border-b transition-colors border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.08)]"
                    >
                      <td className="px-4 py-3 pl-8">
                        <span className="text-[#8C8178]">{store.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono'] text-[#8C8178]">{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 bg-[rgba(160,120,75,0.12)]">
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-medium font-['JetBrains_Mono'] text-[#2C2417]">{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
                        variance < 0 ? 'text-[#DC3545]' : variance > 0 ? 'text-[#1B6B45]' : 'text-[#8C8178]'
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-bold font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center font-['JetBrains_Mono']">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Category Tab - Hierarchical Collapsible
  const renderCategoryTab = () => {
    const calculateGenderTotals = (genderGroup) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      genderGroup.categories.forEach(cat => {
        cat.subCategories.forEach(subCat => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          const data = localData[key] || {};
          totals.buyPct += data.buyPct || 0;
          totals.salesPct += data.salesPct || 0;
          totals.buyProposed += data.buyProposed || 0;
          totals.otbProposed += data.otbProposed || 0;
          totals.otbSubmitted += data.otbSubmitted || 0;
          totals.buyActual += data.buyActual || 0;
        });
      });
      totals.stPct = 90;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    const calculateCategoryTotals = (genderId, cat) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      cat.subCategories.forEach(subCat => {
        const key = `${genderId}_${cat.id}_${subCat.id}`;
        const data = localData[key] || {};
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.buyProposed += data.buyProposed || 0;
        totals.otbProposed += data.otbProposed || 0;
        totals.otbSubmitted += data.otbSubmitted || 0;
        totals.buyActual += data.buyActual || 0;
      });
      totals.stPct = 47;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    const filteredData = categoryStructure.filter(genderGroup => {
      if (genderFilter !== 'all' && genderGroup.gender.id !== genderFilter) return false;
      return true;
    }).map(genderGroup => ({
      ...genderGroup,
      categories: genderGroup.categories.filter(cat => {
        if (categoryFilter !== 'all' && cat.id !== categoryFilter) return false;
        return true;
      }).map(cat => ({
        ...cat,
        subCategories: cat.subCategories.filter(subCat => {
          if (subCategoryFilter !== 'all' && subCat.id !== subCategoryFilter) return false;
          return true;
        })
      })).filter(cat => cat.subCategories.length > 0)
    })).filter(genderGroup => genderGroup.categories.length > 0);

    const getSelectedLabel = (options, value) => {
      const option = options.find(o => o.id === value);
      return option ? option.name : 'Select...';
    };

    return (
      <div className="p-4 space-y-3">
        {/* Filter Section */}
        <div className="px-4 py-3 rounded-xl border mb-4 bg-[#FBF9F7] border-[#E8E2DB]">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 text-[#8C8178]">
              <Filter size={16} />
              <span className="font-medium text-sm font-['Montserrat']">{t('otbAnalysis.filters')}:</span>
            </div>

            {/* Gender Filter */}
            <div className="relative" ref={setDropdownRef('genderFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev) => (prev === 'genderFilter' ? null : 'genderFilter'));
                  setOpenDropdown(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[150px] bg-white border-[#E8E2DB] hover:border-[rgba(215,183,151,0.5)]"
              >
                <Users size={14} className="text-[#C4975A]" />
                <span className="text-sm font-medium flex-1 text-left truncate text-[#2C2417]">
                  {getSelectedLabel(filterOptions.genders, genderFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform text-[#6B5D4F] ${openCategoryDropdown === 'genderFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'genderFilter' && (
                <div className="absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden bg-white border-[#E8E2DB]">
                  {filterOptions.genders.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleGenderFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors hover:bg-[rgba(160,120,75,0.12)]"
                    >
                      <span className={`text-sm ${genderFilter === option.id ? 'text-[#C4975A] font-semibold' : 'text-[#2C2417]'}`}>
                        {option.name}
                      </span>
                      {genderFilter === option.id && <Check size={14} className="text-[#C4975A] ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative" ref={setDropdownRef('categoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev) => (prev === 'categoryFilter' ? null : 'categoryFilter'));
                  setOpenDropdown(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[180px] bg-white border-[#E8E2DB] hover:border-[rgba(215,183,151,0.5)]"
              >
                <Tag size={14} className="text-[#C4975A]" />
                <span className="text-sm font-medium flex-1 text-left truncate text-[#2C2417]">
                  {getSelectedLabel(filterOptions.categories, categoryFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform text-[#6B5D4F] ${openCategoryDropdown === 'categoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'categoryFilter' && (
                <div className="absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto bg-white border-[#E8E2DB]">
                  {filteredCategoryOptions.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleCategoryFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors hover:bg-[rgba(160,120,75,0.12)]"
                    >
                      <span className={`text-sm ${categoryFilter === option.id ? 'text-[#C4975A] font-semibold' : 'text-[#2C2417]'}`}>
                        {option.name}
                      </span>
                      {categoryFilter === option.id && <Check size={14} className="text-[#C4975A] ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Category Filter */}
            <div className="relative" ref={setDropdownRef('subCategoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev) => (prev === 'subCategoryFilter' ? null : 'subCategoryFilter'));
                  setOpenDropdown(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[180px] bg-white border-[#E8E2DB] hover:border-[rgba(215,183,151,0.5)]"
              >
                <Layers size={14} className="text-[#1B6B45]" />
                <span className="text-sm font-medium flex-1 text-left truncate text-[#2C2417]">
                  {getSelectedLabel(filterOptions.subCategories, subCategoryFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform text-[#6B5D4F] ${openCategoryDropdown === 'subCategoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'subCategoryFilter' && (
                <div className="absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto bg-white border-[#E8E2DB]">
                  {filteredSubCategoryOptions.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleSubCategoryFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors hover:bg-[rgba(160,120,75,0.12)]"
                    >
                      <span className={`text-sm ${subCategoryFilter === option.id ? 'text-[#1B6B45] font-semibold' : 'text-[#2C2417]'}`}>
                        {option.name}
                      </span>
                      {subCategoryFilter === option.id && <Check size={14} className="text-[#1B6B45] ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setGenderFilter('all');
                  setCategoryFilter('all');
                  setSubCategoryFilter('all');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#DC3545] text-white rounded-lg hover:bg-[#DC3545]/90 transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                <X size={14} />
                {t('common.clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Hierarchical Content */}
        {filteredData.map((genderGroup) => {
          const genderTotals = calculateGenderTotals(genderGroup);
          const isGenderExpanded = expandedGenders[genderGroup.gender.id];
          const isFemale = genderGroup.gender.id === 'female';

          return (
            <div key={genderGroup.gender.id} className="rounded-xl border-2 overflow-hidden border-[#E8E2DB]">
              {/* Gender Header - Level 1 */}
              <div
                onClick={() => toggleGenderExpanded(genderGroup.gender.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]"
              >
                <button className="p-1 rounded-lg transition-colors bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]">
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isGenderExpanded ? '' : '-rotate-90'} text-[#8A6340]`}
                  />
                </button>
                <Users size={18} className="text-[#8A6340]" />
                <span className="font-bold text-lg font-['Montserrat'] text-[#5C4A3A]">{genderGroup.gender.name}</span>
                <span className="ml-auto text-sm text-[#8A6340]">
                  {genderGroup.categories.length} categories
                </span>
                <div className="flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] text-[#5C4A3A]">
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Gender Content */}
              {isGenderExpanded && (
                <div className="p-3 space-y-2 bg-[#FBF9F7]">
                  {genderGroup.categories.map((cat, catIdx) => {
                    const catKey = `${genderGroup.gender.id}_${cat.id}`;
                    const isCatExpanded = expandedCategories[catKey] !== false;
                    const catTotals = calculateCategoryTotals(genderGroup.gender.id, cat);

                    return (
                      <div key={cat.id} className="rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
                        {/* Category Header - Level 2 */}
                        <div
                          onClick={() => toggleCategoryExpanded(genderGroup.gender.id, cat.id)}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-[rgba(160,120,75,0.12)] hover:bg-[rgba(215,183,151,0.2)]"
                        >
                          <button className="p-1 rounded-lg transition-colors bg-[rgba(215,183,151,0.2)] hover:bg-[rgba(215,183,151,0.3)]">
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 text-[#C4975A] ${isCatExpanded ? '' : '-rotate-90'}`}
                            />
                          </button>
                          <Tag size={16} className="text-[#C4975A]" />
                          <span className="font-semibold font-['Montserrat'] text-[#8A6340]">
                            {cat.name}
                          </span>
                          <span className="ml-auto text-sm text-[#6B5D4F]">
                            {cat.subCategories.length} sub-categories
                          </span>
                          <div className="flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] text-[#8C8178]">
                            <span>Buy: <strong>{catTotals.buyPct}%</strong></span>
                            <span>Proposed: <strong>{catTotals.buyProposed}%</strong></span>
                            <span>OTB: <strong>{catTotals.otbProposed.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        {/* Sub-Categories Table - Level 3 */}
                        {isCatExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('nav.subCategories')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.submit')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>% Actual</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.subCategories.map((subCat, subIdx) => {
                                  const cellKey = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
                                  const rowData = localData[cellKey] || {};
                                  const isEditing = editingCell === cellKey;

                                  return (
                                    <tr
                                      key={subCat.id}
                                      className={`border-b transition-colors border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.08)] ${subIdx % 2 === 0 ? 'bg-white' : 'bg-[#FBF9F7]/50'}`}
                                    >
                                      <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#6B5D4F]"></div>
                                          <span className="text-[#2C2417]">{subCat.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-['JetBrains_Mono'] text-[#8C8178]">{rowData.buyPct || 0}%</td>
                                      <td className="px-3 py-2.5 text-center font-['JetBrains_Mono'] text-[#8C8178]">{rowData.salesPct || 0}%</td>
                                      <td className="px-3 py-2.5 text-center font-['JetBrains_Mono'] text-[#8C8178]">{rowData.stPct || 0}%</td>
                                      <td className="px-3 py-2.5 bg-[rgba(160,120,75,0.12)]">
                                        <EditableCell
                                          cellKey={cellKey}
                                          value={rowData.buyProposed || 0}
                                          isEditing={isEditing}
                                          editValue={editValue}
                                          onStartEdit={handleStartEdit}
                                          onSaveEdit={handleSaveEdit}
                                          onChangeValue={setEditValue}
                                          onKeyDown={handleKeyDown}
                                          darkMode={darkMode}
                                        />
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-medium font-['JetBrains_Mono'] text-[#2C2417]">
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-2.5 text-center font-medium font-['JetBrains_Mono'] ${
                                        (rowData.varPct || 0) < 0 ? 'text-[#DC3545]' : 'text-[#1B6B45]'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-['JetBrains_Mono'] text-[#8C8178]">
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-['JetBrains_Mono'] text-[#8C8178]">{rowData.buyActual || 0}%</td>
                                      <td className="px-3 py-2.5 text-center">
                                        <button
                                          onClick={() => {
                                            if (onOpenSkuProposal) {
                                              onOpenSkuProposal({
                                                // Budget info
                                                budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
                                                budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
                                                fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
                                                brandName: selectedBudget?.brandName || budgetContext?.brandName,
                                                // Season info
                                                seasonGroup: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : budgetContext?.seasonGroup,
                                                season: selectedSeason !== 'all' ? selectedSeason : budgetContext?.season,
                                                // Category info
                                                gender: genderGroup.gender,
                                                category: cat,
                                                subCategory: subCat,
                                                // OTB data
                                                otbData: rowData
                                              });
                                            }
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C4975A] to-[#C4A57B] hover:from-[#C4A57B] hover:to-[#C4975A] text-[#2C2417] rounded-lg font-medium text-xs transition-all shadow-sm hover:shadow-md"
                                        >
                                          <Package size={12} />
                                          {t('nav.skuProposal')}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Category Subtotal Row */}
                                <tr className="bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium">
                                  <td className="px-4 py-2 font-semibold font-['Montserrat'] text-[#5C4A32]">{t('otbAnalysis.subTotal')}</td>
                                  <td className="px-3 py-2 text-center font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.buyPct}%</td>
                                  <td className="px-3 py-2 text-center font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.salesPct}%</td>
                                  <td className="px-3 py-2 text-center font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.stPct}%</td>
                                  <td className="px-3 py-2 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] text-[#8A6340]">{catTotals.buyProposed}%</td>
                                  <td className="px-3 py-2 text-center font-bold font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-2 text-center font-bold font-['JetBrains_Mono'] ${
                                    catTotals.varPct < 0 ? 'text-[#DC3545]' : 'text-[#5C4A32]'
                                  }`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className="px-3 py-2 text-center font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-center font-['JetBrains_Mono'] text-[#5C4A32]">{catTotals.buyActual}%</td>
                                  <td className="px-3 py-2"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Gender Total */}
                  <div className="rounded-xl p-3 border bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-['Montserrat'] text-[#8A6340]">
                        TOTAL {genderGroup.gender.name.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-6 text-sm font-['JetBrains_Mono'] text-[#8A6340]">
                        <span>% Buy: <strong>{genderTotals.buyPct}%</strong></span>
                        <span>% Sales: <strong>{genderTotals.salesPct}%</strong></span>
                        <span>% ST: <strong>{genderTotals.stPct}%</strong></span>
                        <span>% Proposed: <strong>{genderTotals.buyProposed}%</strong></span>
                        <span>$ OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                        <span className={genderTotals.varPct < 0 ? 'text-[#DC3545]' : ''}>
                          Var: <strong>{genderTotals.varPct > 0 ? '+' : ''}{genderTotals.varPct}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header Section - Same style as Planning page */}
      <div className="backdrop-blur-xl rounded-2xl shadow-xl border p-3 md:p-6 relative z-[100] bg-gradient-to-br from-white to-[rgba(215,183,151,0.1)] border-[#E8E2DB]">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl bg-gradient-to-br from-[rgba(215,183,151,0.2)] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl bg-gradient-to-tr from-[rgba(215,183,151,0.15)] to-transparent"></div>

        <div className="relative">
          {/* Filter Section - Redesigned like Planning page */}
          <div className="rounded-xl border shadow-sm bg-white border-[#E8E2DB]">
            {/* Filter Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#FBF9F7] to-[rgba(215,183,151,0.1)] border-[#E8E2DB]">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#6B5D4F]" />
                <span className="text-sm font-semibold font-['Montserrat'] text-[#2C2417]">{t('otbAnalysis.filters')}</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs transition-colors text-[#6B5D4F] hover:text-[#8C8178]"
                >
                  <X size={12} />
                  {t('common.clearAllFilters')}
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="p-4 relative z-[100]">
              <div className="flex flex-wrap items-end gap-3">
                {/* Budget Name Dropdown */}
                <div className="relative min-w-[200px]" ref={setDropdownRef('budget')}>
                  <label className="block text-xs font-medium mb-1.5 text-[#6B5D4F]">
                    {t('budget.budgetName')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'budget' ? null : 'budget'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedBudget
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#8A6340] hover:border-[rgba(215,183,151,0.5)]'
                        : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:border-[#E8E2DB]/80 hover:bg-[#FBF9F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className={selectedBudget ? 'text-[#C4975A]' : 'text-[#6B5D4F]'} />
                      <span className="truncate">{selectedBudget?.budgetName || t('otbAnalysis.selectBudget')}</span>
                    </div>
                    <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'budget' && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                      <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB]">
                        <span className="text-xs font-semibold uppercase tracking-wide font-['Montserrat'] text-[#6B5D4F]">{t('budget.title')}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {/* Loading state */}
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#C4975A]/30 border-t-[#C4975A] rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-[#8C8178]">{t('common.loading')}...</span>
                          </div>
                        )}
                        {/* Empty state */}
                        {!loadingBudgets && apiBudgets.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-[#8C8178]">
                            {t('budget.noMatchingBudgets')}
                          </div>
                        )}
                        {!loadingBudgets && apiBudgets.length > 0 && (
                        <div
                          onClick={() => { setSelectedBudgetId('all'); setOpenDropdown(null); }}
                          className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedBudgetId === 'all'
                              ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                              : 'hover:bg-[#FBF9F7] text-[#6B5D4F]'
                          }`}
                        >
                          <span className="font-medium">{t('otbAnalysis.selectBudget')}</span>
                          {selectedBudgetId === 'all' && <Check size={14} className="text-[#C4975A]" />}
                        </div>
                        )}
                        {!loadingBudgets && apiBudgets.map((budget) => (
                          <div
                            key={budget.id}
                            onClick={() => {
                              setSelectedBudgetId(budget.id);
                              if (budget.seasonGroup) setSelectedSeasonGroup(budget.seasonGroup);
                              if (budget.seasonType) setSelectedSeason(budget.seasonType);
                              setOpenDropdown(null);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors border-t border-[#E8E2DB] ${
                              selectedBudgetId === budget.id
                                ? 'bg-[rgba(160,120,75,0.18)]'
                                : 'hover:bg-[#FBF9F7]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className={`font-semibold text-sm ${selectedBudgetId === budget.id ? 'text-[#C4975A]' : 'text-[#2C2417]'}`}>
                                  {budget.budgetName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-[#6B5D4F]">FY{budget.fiscalYear}</span>
                                  <span className="text-[#E8E2DB]">-</span>
                                  <span className="text-xs text-[#6B5D4F]">{budget.brandName}</span>
                                  <span className="text-[#E8E2DB]">-</span>
                                  <span className="text-xs font-medium text-[#C4975A] font-['JetBrains_Mono']">{formatCurrency(budget.totalBudget)}</span>
                                </div>
                              </div>
                              {selectedBudgetId === budget.id && (
                                <div className="w-5 h-5 rounded-full bg-[#C4975A] flex items-center justify-center flex-shrink-0 ml-2">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-10 w-px hidden sm:block bg-[#E8E2DB]"></div>

                {/* Season Group Filter */}
                <div className="relative min-w-[140px]" ref={setDropdownRef('seasonGroup')}>
                  <label className="block text-xs font-medium mb-1.5 text-[#6B5D4F]">
                    {t('otbAnalysis.seasonGroup')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedSeasonGroup !== 'all'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#8A6340] hover:border-[rgba(215,183,151,0.5)]'
                        : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:border-[#E8E2DB]/80 hover:bg-[#FBF9F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={selectedSeasonGroup !== 'all' ? 'text-[#C4975A]' : 'text-[#6B5D4F]'} />
                      <span>{SEASON_GROUPS.find(s => s.id === selectedSeasonGroup)?.label || t('otbAnalysis.seasonGroup')}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonGroup' && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                      {SEASON_GROUPS.map((season) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeasonGroup(season.id); setOpenDropdown(null); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedSeasonGroup === season.id
                              ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                              : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                          }`}
                        >
                          <span className="font-medium">{season.label}</span>
                          {selectedSeasonGroup === season.id && <Check size={14} className="text-[#C4975A]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Season Filter */}
                <div className="relative min-w-[140px]" ref={setDropdownRef('season')}>
                  <label className="block text-xs font-medium mb-1.5 text-[#6B5D4F]">
                    {t('otbAnalysis.season')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'season' ? null : 'season'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedSeason !== 'all'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#8A6340] hover:border-[rgba(215,183,151,0.5)]'
                        : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:border-[#E8E2DB]/80 hover:bg-[#FBF9F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={selectedSeason !== 'all' ? 'text-[#C4975A]' : 'text-[#6B5D4F]'} />
                      <span>{SEASONS.find(s => s.id === selectedSeason)?.label || t('otbAnalysis.season')}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'season' && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                      {SEASONS.map((season) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeason(season.id); setOpenDropdown(null); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedSeason === season.id
                              ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                              : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                          }`}
                        >
                          <span className="font-medium">{season.label}</span>
                          {selectedSeason === season.id && <Check size={14} className="text-[#C4975A]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Version Filter */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className="h-10 w-px hidden sm:block bg-[#E8E2DB]"></div>
                <div className="relative min-w-[200px]" ref={setDropdownRef('version')}>
                  <label className="block text-xs font-medium mb-1.5 text-[#6B5D4F]">
                    Version
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'version' ? null : 'version'));
                      setOpenCategoryDropdown(null);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      versions.length === 0 && !loadingVersions
                        ? 'bg-[#FBF9F7] border-[#E8E2DB] text-[#6B5D4F] cursor-not-allowed opacity-50'
                        : selectedVersion
                          ? selectedVersion.isFinal
                            ? 'bg-[rgba(215,183,151,0.2)] border-[#C4975A] text-[#8A6340]'
                            : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#8A6340]'
                          : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:border-[#E8E2DB]/80 hover:bg-[#FBF9F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedVersion?.isFinal ? (
                        <Star size={14} className="text-[#C4975A] fill-[#C4975A]" />
                      ) : (
                        <Sparkles size={14} className={selectedVersion ? 'text-[#C4975A]' : 'text-[#6B5D4F]'} />
                      )}
                      <span className="truncate">
                        {loadingVersions ? `${t('common.loading')}...` : selectedVersion ? selectedVersion.name : t('common.version')}
                      </span>
                      {selectedVersion?.isFinal && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#C4975A] text-white rounded flex-shrink-0">FINAL</span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'version' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'version' && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                      <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB]">
                        <span className="text-xs font-semibold uppercase tracking-wide font-['Montserrat'] text-[#6B5D4F]">Planning Versions</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {loadingVersions && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#C4975A]/30 border-t-[#C4975A] rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-[#8C8178]">{t('common.loading')}...</span>
                          </div>
                        )}
                        {!loadingVersions && versions.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-[#8C8178]">
                            {t('planning.noVersions')}
                          </div>
                        )}
                        {!loadingVersions && versions.map((version) => (
                          <div
                            key={version.id}
                            onClick={() => { setSelectedVersionId(version.id); setOpenDropdown(null); }}
                            className={`px-4 py-3 cursor-pointer transition-colors border-t border-[#E8E2DB] ${
                              selectedVersionId === version.id
                                ? 'bg-[rgba(160,120,75,0.18)]'
                                : 'hover:bg-[#FBF9F7]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {version.isFinal && <Star size={14} className="text-[#C4975A] fill-[#C4975A] flex-shrink-0" />}
                                <span className={`font-semibold text-sm font-['Montserrat'] truncate ${selectedVersionId === version.id ? 'text-[#C4975A]' : 'text-[#2C2417]'}`}>
                                  {version.name}
                                </span>
                                {version.isFinal && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#C4975A] text-white rounded flex-shrink-0">FINAL</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  version.status === 'APPROVED' ? 'bg-[rgba(27,107,69,0.15)] text-[#1B6B45]' :
                                  version.status === 'SUBMITTED' ? 'bg-[rgba(217,119,6,0.15)] text-[#D97706]' :
                                  'bg-[#FBF9F7] text-[#8C8178]'
                                }`}>{version.status}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {!version.isFinal && (
                                  <button
                                    onClick={(e) => handleSetFinalVersion(version.id, e)}
                                    className="px-2 py-1 text-xs font-medium rounded transition-colors bg-[rgba(215,183,151,0.2)] text-[#8A6340] hover:bg-[rgba(215,183,151,0.35)]"
                                  >
                                    {t('planning.latestVersion')}
                                  </button>
                                )}
                                {selectedVersionId === version.id && <Check size={14} className="text-[#C4975A]" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Budget Context Card */}
                {((selectedBudget  && selectedSeasonGroup && selectedSeason) || budgetContext) && (
                  <>
                    <div className="h-10 w-px hidden sm:block bg-[#E8E2DB]"></div>
                    <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-[rgba(215,183,151,0.4)] bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.1)]">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold font-['Montserrat'] truncate max-w-[160px] text-[#8A6340]">
                          {selectedBudget?.budgetName || budgetContext?.budgetName || 'Budget'}
                        </span>
                        <span className="text-xs text-[#8A6340]/70">
                          FY {selectedBudget?.fiscalYear || budgetContext?.fiscalYear} - {selectedBudget?.brandName || budgetContext?.brandName || 'Brand'}
                        </span>
                      </div>
                      <div className="w-px h-10 bg-[rgba(215,183,151,0.4)]"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold font-['JetBrains_Mono'] text-[#8A6340]">
                          {formatCurrency(
                            budgetContext?.rex || budgetContext?.ttp
                              ? (budgetContext.rex || 0) + (budgetContext.ttp || 0)
                              : selectedBudget?.totalBudget || 0
                          )}
                        </span>
                        <div className="flex items-center gap-3 text-xs font-['JetBrains_Mono'] text-[#8A6340]/70">
                          {budgetContext?.rex || budgetContext?.ttp ? (
                            <>
                              <span>Rex: {formatCurrency(budgetContext?.rex || 0)}</span>
                              <span>TTP: {formatCurrency(budgetContext?.ttp || 0)}</span>
                            </>
                          ) : selectedBudget?.details?.length > 0 ? (
                            selectedBudget.details.map(d => (
                              <span key={d.id || d.store?.code}>{d.store?.code || d.storeCode}: {formatCurrency(Number(d.budgetAmount) || 0)}</span>
                            ))
                          ) : (
                            <span>{t('otbAnalysis.totalBudget')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs & Content */}
      {selectedBudget && selectedSeason && selectedSeasonGroup && (
      <div className="rounded-xl shadow-lg border overflow-hidden bg-white border-[#E8E2DB]">
        {/* Tabs */}
        <div className="border-b px-3 md:px-4 overflow-x-auto border-[#E8E2DB] bg-[#FBF9F7]">
          <div className="flex gap-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-medium font-['Montserrat'] flex items-center gap-1.5 border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-[#C4975A] text-[#8A6340] bg-white -mb-px rounded-t-md'
                      : 'border-transparent text-[#6B5D4F] hover:text-[#8C8178] hover:bg-white/50 rounded-t-md'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint for editable cells */}
        <div className="px-4 py-2 border-b flex items-center gap-1.5 text-xs bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.2)] text-[#8A6340]">
          <Pencil size={12} className="animate-bounce" style={{ animationDuration: '2s' }} />
          <span>Click on cells with gold background in "% Buy Proposed" column to edit</span>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
          {activeTab === 'collection' && renderCollectionTab()}
          {activeTab === 'gender' && renderGenderTab()}
          {activeTab === 'category' && renderCategoryTab()}
        </div>
      </div>
      )}
    </div>
  );
};

export default OTBAnalysisScreen;
