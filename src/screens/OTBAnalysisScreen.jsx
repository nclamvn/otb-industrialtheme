'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3, ChevronDown, Check, ChevronRight, ArrowLeft,
  Calendar, Tag, Layers, Users, Info, Pencil, X, Star,
  Sparkles, FileText, Clock, Package, SlidersHorizontal, GitCompare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils';
import { STORES, GENDERS } from '../utils/constants';
import { budgetService, masterDataService, planningService } from '../services';

import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppContext } from '@/contexts/AppContext';
import { MobileFilterSheet } from '@/components/ui';

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
          className="w-20 px-2 py-1.5 text-center border-2 border-[#C4975A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.5)] font-data font-medium transition-all bg-white text-[#2C2417]"
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg min-w-[70px] justify-center bg-[#FBF9F7] border-[#C4B5A5]">
          <span className="font-data font-medium text-[#8C8178]">
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
        <span className="font-data font-medium text-[#8A6340]">
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
  const { registerSave, unregisterSave } = useAppContext();
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

  // OA-8: Load persisted filters from sessionStorage on mount
  const filtersLoadedRef = useRef(false);

  // Filter states — defaults may be overridden by sessionStorage below
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [comparisonType, setComparisonType] = useState('same');
  const [seasonCount, setSeasonCount] = useState(1);
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [budgetContext, setBudgetContext] = useState(null); // Budget info from Planning Screen
  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // OA-5: Historical comparison states
  const [historicalData, setHistoricalData] = useState(null);
  const [baselineData, setBaselineData] = useState(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // OA-6: Budget comparison mode states
  const [comparisonBudgetIds, setComparisonBudgetIds] = useState([]);
  const [compareModeActive, setCompareModeActive] = useState(false);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);

  // OA-8: Load persisted filters from sessionStorage on mount
  useEffect(() => {
    if (filtersLoadedRef.current) return;
    filtersLoadedRef.current = true;
    try {
      const saved = sessionStorage.getItem('otb_analysis_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedYear != null) setSelectedYear(parsed.selectedYear);
        if (parsed.selectedBudgetId != null) setSelectedBudgetId(parsed.selectedBudgetId);
        if (parsed.selectedSeasonGroup != null) setSelectedSeasonGroup(parsed.selectedSeasonGroup);
        if (parsed.selectedSeason != null) setSelectedSeason(parsed.selectedSeason);
        if (Array.isArray(parsed.selectedBrandIds)) setSelectedBrandIds(parsed.selectedBrandIds);
        if (parsed.comparisonType != null) setComparisonType(parsed.comparisonType);
        if (parsed.seasonCount != null) setSeasonCount(parsed.seasonCount);
      }
    } catch (e) {
      console.warn('Failed to load persisted OTB filters:', e);
    }
  }, []);

  // OA-8: Save filters to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('otb_analysis_filters', JSON.stringify({
        selectedYear,
        selectedBudgetId,
        selectedSeasonGroup,
        selectedSeason,
        selectedBrandIds,
        comparisonType,
        seasonCount,
      }));
    } catch (e) {
      // sessionStorage may be unavailable
    }
  }, [selectedYear, selectedBudgetId, selectedSeasonGroup, selectedSeason, selectedBrandIds, comparisonType, seasonCount]);

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

  // Load saved allocation data when version is selected
  useEffect(() => {
    if (!selectedVersionId) return;
    let ignore = false;
    const loadVersionData = async () => {
      try {
        const versionData = await planningService.getOne(selectedVersionId);
        if (ignore) return;
        const saved = versionData?.allocations;
        if (saved && typeof saved === 'object') {
          setLocalData(prev => ({ ...prev, ...saved }));
        }
      } catch (err) {
        console.error('Failed to load OTB version data:', err);
      }
    };
    loadVersionData();
    return () => { ignore = true; };
  }, [selectedVersionId]);

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

  // Save allocations to backend
  const handleSaveAllocations = useCallback(async () => {
    if (!selectedVersionId) {
      toast.error(t('planning.selectVersion') || 'Select a version first');
      return;
    }
    try {
      await planningService.update(selectedVersionId, { allocations: localData });
      toast.success(t('planning.savedSuccessfully') || 'Allocations saved');
    } catch (err) {
      console.error('Failed to save allocations:', err);
      toast.error(t('approval.failedToSave') || 'Failed to save');
    }
  }, [selectedVersionId, localData, t]);

  // Register save handler with AppContext
  useEffect(() => {
    if (selectedVersionId && registerSave) {
      registerSave(handleSaveAllocations);
      return () => unregisterSave?.();
    }
  }, [selectedVersionId, handleSaveAllocations, registerSave, unregisterSave]);

  // OA-5: Fetch historical planning data for comparison
  const fetchHistorical = useCallback(async () => {
    if (!selectedBudget || selectedBudgetId === 'all') return;
    const fiscalYear = selectedBudget.fiscalYear;
    const brandId = selectedBudget.brandId;
    if (!fiscalYear || !selectedSeasonGroup || !selectedSeason) return;
    setLoadingHistorical(true);
    try {
      const result = await planningService.getHistorical({
        fiscalYear,
        seasonGroupId: selectedSeasonGroup,
        seasonName: selectedSeason,
        brandId
      });
      setHistoricalData(result);
      setBaselineData(result);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      setHistoricalData(null);
      setBaselineData(null);
    } finally {
      setLoadingHistorical(false);
    }
  }, [selectedBudget, selectedBudgetId, selectedSeasonGroup, selectedSeason]);

  // OA-5: Trigger historical fetch when budget + season are selected
  useEffect(() => {
    if (selectedBudgetId && selectedBudgetId !== 'all' && selectedSeasonGroup && selectedSeason) {
      fetchHistorical();
    } else {
      setHistoricalData(null);
      setBaselineData(null);
    }
  }, [fetchHistorical]);

  // OA-5: Build a keyed lookup map from historical planning details
  const buildHistoricalLookup = useCallback((data, dimensionKey = 'name') => {
    if (!data?.details || !Array.isArray(data.details)) return {};
    const lookup = {};
    data.details.forEach(detail => {
      const key = (detail[dimensionKey] || detail.collection || detail.gender || detail.category || detail.name || '').toLowerCase().trim();
      if (key) {
        lookup[key] = {
          buyPct: detail.buyPct ?? detail.percentBuy ?? 0,
          salesPct: detail.salesPct ?? detail.percentSales ?? 0,
          stPct: detail.stPct ?? detail.percentST ?? detail.sellThrough ?? 0,
        };
      }
    });
    return lookup;
  }, []);

  // OA-5: Memoized historical lookups for each tab dimension
  const historicalLookup = useMemo(() => {
    if (!historicalData) return { collection: {}, gender: {}, category: {} };
    return {
      collection: buildHistoricalLookup(historicalData, 'collection'),
      gender: buildHistoricalLookup(historicalData, 'gender'),
      category: buildHistoricalLookup(historicalData, 'category'),
    };
  }, [historicalData, buildHistoricalLookup]);

  // OA-1: Year list (±2 years from current)
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i), []);

  // OA-1: Filter budgets by selected fiscal year
  const yearFilteredBudgets = useMemo(() => {
    return apiBudgets.filter(b => b.fiscalYear === selectedYear);
  }, [apiBudgets, selectedYear]);

  // OA-4: Derive unique brand list from all budgets (not year-filtered, so user can see available brands)
  const availableBrands = useMemo(() => {
    const brandMap = new Map();
    apiBudgets.forEach(b => {
      if (b.brandId && !brandMap.has(b.brandId)) {
        brandMap.set(b.brandId, { id: b.brandId, name: b.brandName || 'Unknown' });
      }
    });
    return [...brandMap.values()];
  }, [apiBudgets]);

  // OA-4 + OA-1: Final filtered budgets for the budget dropdown (year + brand filters)
  const filteredBudgetsForDropdown = useMemo(() => {
    let list = yearFilteredBudgets;
    if (selectedBrandIds.length > 0) {
      list = list.filter(b => selectedBrandIds.includes(b.brandId));
    }
    return list;
  }, [yearFilteredBudgets, selectedBrandIds]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedBudgetId('all');
    setSelectedSeasonGroup('');
    setSelectedSeason('');
    setSelectedVersionId(null);
    setVersions([]);
    setComparisonType('same');
    setSeasonCount(1);
    setSelectedBrandIds([]);
    // OA-5 + OA-6: Reset historical and comparison states
    setHistoricalData(null);
    setBaselineData(null);
    setComparisonBudgetIds([]);
    setCompareModeActive(false);
  };

  const hasActiveFilters = selectedBudgetId !== 'all' || (selectedSeasonGroup && selectedSeasonGroup !== 'all') || (selectedSeason && selectedSeason !== 'all') || selectedVersionId || selectedBrandIds.length > 0 || comparisonType !== 'same' || seasonCount !== 1;
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
    const genders = [{ id: 'all', name: t('otbAnalysis.gender') }];
    const categories = [{ id: 'all', name: t('otbAnalysis.category') }];
    const subCategories = [{ id: 'all', name: t('otbAnalysis.subCategory') }];

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
      { id: 'all', name: t('otbAnalysis.category') },
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
    return [{ id: 'all', name: t('otbAnalysis.subCategory') }, ...options.filter(o => o.id !== 'all')];
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
  const headerCellClass = "px-4 py-3 text-center text-xs font-semibold tracking-wide font-brand";
  const headerDarkCell = 'bg-[#FBF9F7] text-[#6B5D4F]';
  const headerGoldCell = 'bg-[rgba(215,183,151,0.3)] text-[#8A6340]';
  const headerBrownCell = 'bg-[rgba(139,115,85,0.2)] text-[#5C4033]';
  const headerDarkBrownCell = 'bg-[rgba(92,64,51,0.2)] text-[#5C4033]';
  const headerHistCell = 'bg-[rgba(180,160,140,0.15)] text-[#8C7A68]'; // OA-5: lighter shade for historical columns
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
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %Buy</th>
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %Sales</th>
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %ST</th>
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
                  <td className="px-4 py-3" colSpan={11}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-brand text-[#8A6340]">{section.name}</span>
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
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.stPct || 0).toFixed(0)}%</td>
                      {/* OA-5: Historical columns */}
                      {(() => {
                        const histKey = (section.name || section.id || '').toLowerCase().trim();
                        const hist = historicalLookup.collection[histKey];
                        return (
                          <>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.buyPct.toFixed(1)}%` : '-'}</td>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.salesPct.toFixed(0)}%` : '-'}</td>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.stPct.toFixed(0)}%` : '-'}</td>
                          </>
                        );
                      })()}
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{cellData.moc || 0}</td>
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
                      <td className="px-4 py-3 text-center font-medium font-data text-[#2C2417]">{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-data ${
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
              <td className="px-4 py-4 font-bold font-brand">{t('otbAnalysis.total')}</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center font-data">-</td>
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
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %Buy</th>
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %Sales</th>
              <th className={`${headerCellClass} ${headerHistCell}`}>Hist %ST</th>
              <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
              <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
              <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
            </tr>
          </thead>
          <tbody>
            {GENDERS.map((gen) => (
              <React.Fragment key={`gen-${gen.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-3" colSpan={10}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-brand text-[#8A6340]">{gen.name}</span>
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
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-data text-[#8C8178]">{(cellData.stPct || 0).toFixed(0)}%</td>
                      {/* OA-5: Historical columns */}
                      {(() => {
                        const histKey = (gen.name || gen.id || '').toLowerCase().trim();
                        const hist = historicalLookup.gender[histKey];
                        return (
                          <>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.buyPct.toFixed(1)}%` : '-'}</td>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.salesPct.toFixed(0)}%` : '-'}</td>
                            <td className="px-4 py-3 text-center font-data text-[#A89888]">{hist ? `${hist.stPct.toFixed(0)}%` : '-'}</td>
                          </>
                        );
                      })()}
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
                      <td className="px-4 py-3 text-center font-medium font-data text-[#2C2417]">{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-data ${
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
              <td className="px-4 py-4 font-bold font-brand">{t('otbAnalysis.total')}</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">-</td>
              <td className="px-4 py-4 text-center font-data">100%</td>
              <td className="px-4 py-4 text-center font-data">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center font-data">-</td>
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
      <div className="px-4 pb-4 space-y-3">
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
                <span className="font-bold text-lg font-brand text-[#5C4A3A]">{genderGroup.gender.name}</span>
                <span className="ml-auto text-sm text-[#8A6340]">
                  {genderGroup.categories.length} categories
                </span>
                <div className="flex items-center gap-4 ml-4 text-sm font-data text-[#5C4A3A]">
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
                          <span className="font-semibold font-brand text-[#8A6340]">
                            {cat.name}
                          </span>
                          <span className="ml-auto text-sm text-[#6B5D4F]">
                            {cat.subCategories.length} sub-categories
                          </span>
                          <div className="flex items-center gap-4 ml-4 text-sm font-data text-[#8C8178]">
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
                                  <th className={`px-4 py-2 text-left text-xs font-semibold font-brand ${headerDarkCell}`}>{t('nav.subCategories')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerHistCell}`}>Hist %Buy</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerHistCell}`}>Hist %Sales</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerHistCell}`}>Hist %ST</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>{t('common.submit')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>% Actual</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-brand ${headerDarkCell}`}>{t('common.actions')}</th>
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
                                      <td className="px-3 py-2.5 text-center font-data text-[#8C8178]">{rowData.buyPct || 0}%</td>
                                      <td className="px-3 py-2.5 text-center font-data text-[#8C8178]">{rowData.salesPct || 0}%</td>
                                      <td className="px-3 py-2.5 text-center font-data text-[#8C8178]">{rowData.stPct || 0}%</td>
                                      {/* OA-5: Historical columns */}
                                      {(() => {
                                        const histKey = (cat.name || cat.id || '').toLowerCase().trim();
                                        const hist = historicalLookup.category[histKey];
                                        return (
                                          <>
                                            <td className="px-3 py-2.5 text-center font-data text-[#A89888]">{hist ? `${hist.buyPct.toFixed(1)}%` : '-'}</td>
                                            <td className="px-3 py-2.5 text-center font-data text-[#A89888]">{hist ? `${hist.salesPct.toFixed(0)}%` : '-'}</td>
                                            <td className="px-3 py-2.5 text-center font-data text-[#A89888]">{hist ? `${hist.stPct.toFixed(0)}%` : '-'}</td>
                                          </>
                                        );
                                      })()}
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
                                      <td className="px-3 py-2.5 text-center font-medium font-data text-[#2C2417]">
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-2.5 text-center font-medium font-data ${
                                        (rowData.varPct || 0) < 0 ? 'text-[#DC3545]' : 'text-[#1B6B45]'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-data text-[#8C8178]">
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className="px-3 py-2.5 text-center font-data text-[#8C8178]">{rowData.buyActual || 0}%</td>
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
                                  <td className="px-4 py-2 font-semibold font-brand text-[#5C4A32]">{t('otbAnalysis.subTotal')}</td>
                                  <td className="px-3 py-2 text-center font-data text-[#5C4A32]">{catTotals.buyPct}%</td>
                                  <td className="px-3 py-2 text-center font-data text-[#5C4A32]">{catTotals.salesPct}%</td>
                                  <td className="px-3 py-2 text-center font-data text-[#5C4A32]">{catTotals.stPct}%</td>
                                  <td className="px-3 py-2 text-center font-data text-[#A89888]">-</td>
                                  <td className="px-3 py-2 text-center font-data text-[#A89888]">-</td>
                                  <td className="px-3 py-2 text-center font-data text-[#A89888]">-</td>
                                  <td className="px-3 py-2 text-center bg-[rgba(160,120,75,0.18)] font-bold font-data text-[#8A6340]">{catTotals.buyProposed}%</td>
                                  <td className="px-3 py-2 text-center font-bold font-data text-[#5C4A32]">{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-2 text-center font-bold font-data ${
                                    catTotals.varPct < 0 ? 'text-[#DC3545]' : 'text-[#5C4A32]'
                                  }`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className="px-3 py-2 text-center font-data text-[#5C4A32]">{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-center font-data text-[#5C4A32]">{catTotals.buyActual}%</td>
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
                      <span className="font-bold font-brand text-[#8A6340]">
                        TOTAL {genderGroup.gender.name.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-6 text-sm font-data text-[#8A6340]">
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

  // OA-6: Get the comparison budgets data
  const comparisonBudgets = useMemo(() => {
    if (comparisonBudgetIds.length < 2) return [];
    return comparisonBudgetIds.map(id => apiBudgets.find(b => b.id === id)).filter(Boolean);
  }, [comparisonBudgetIds, apiBudgets]);

  // OA-6: Toggle a budget into/out of comparison selection
  const toggleComparisonBudget = (budgetId) => {
    setComparisonBudgetIds(prev => {
      if (prev.includes(budgetId)) {
        return prev.filter(id => id !== budgetId);
      }
      if (prev.length >= 3) return prev; // max 3
      return [...prev, budgetId];
    });
  };

  // OA-6: Render Budget Comparison View
  const renderBudgetComparison = () => {
    if (comparisonBudgets.length < 2) return null;

    return (
      <div className="overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#E8E2DB] bg-[rgba(215,183,151,0.08)]">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-[#8A6340]" />
            <span className="font-bold font-brand text-[#5C4A3A]">Budget Comparison</span>
            <span className="text-xs text-[#8C8178] ml-2">Comparing {comparisonBudgets.length} budgets</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`}>Dimension</th>
              {comparisonBudgets.map(budget => (
                <React.Fragment key={budget.id}>
                  <th className={`${headerCellClass} ${headerGoldCell}`} colSpan={3}>
                    <div className="flex flex-col items-center">
                      <span className="truncate max-w-[140px]">{budget.budgetName}</span>
                      <span className="text-[10px] font-normal opacity-70">FY{budget.fiscalYear} · {budget.brandName}</span>
                    </div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left`}></th>
              {comparisonBudgets.map(budget => (
                <React.Fragment key={`sub-${budget.id}`}>
                  <th className={`${headerCellClass} ${headerDarkCell}`}>%Buy</th>
                  <th className={`${headerCellClass} ${headerDarkCell}`}>%Sales</th>
                  <th className={`${headerCellClass} ${headerDarkCell}`}>%ST</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Render hierarchy: Gender > Category > SubCategory */}
            {categoryStructure.map(genderGroup => (
              <React.Fragment key={`cmp-g-${genderGroup.gender.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-3 font-bold font-brand text-[#8A6340]" colSpan={1 + comparisonBudgets.length * 3}>
                    {genderGroup.gender.name}
                  </td>
                </tr>
                {genderGroup.categories.map(cat => (
                  <React.Fragment key={`cmp-c-${cat.id}`}>
                    <tr className="bg-[rgba(160,120,75,0.06)]">
                      <td className="px-4 py-2 pl-8 font-semibold font-brand text-[#6B5D4F]">{cat.name}</td>
                      {comparisonBudgets.map(budget => {
                        // Aggregate subcategory data for this budget
                        let totalBuy = 0, totalSales = 0;
                        cat.subCategories.forEach(subCat => {
                          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
                          const data = localData[key] || {};
                          totalBuy += data.buyPct || 0;
                          totalSales += data.salesPct || 0;
                        });
                        return (
                          <React.Fragment key={`cmp-cd-${budget.id}-${cat.id}`}>
                            <td className="px-3 py-2 text-center font-data text-[#8C8178]">{totalBuy.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-center font-data text-[#8C8178]">{totalSales.toFixed(0)}%</td>
                            <td className="px-3 py-2 text-center font-data text-[#8C8178]">-</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                    {cat.subCategories.map(subCat => (
                      <tr key={`cmp-s-${subCat.id}`} className="border-b border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.08)]">
                        <td className="px-4 py-2 pl-12">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C4B5A5]"></div>
                            <span className="text-[#8C8178]">{subCat.name}</span>
                          </div>
                        </td>
                        {comparisonBudgets.map(budget => {
                          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
                          const data = localData[key] || {};
                          return (
                            <React.Fragment key={`cmp-sd-${budget.id}-${subCat.id}`}>
                              <td className="px-3 py-2 text-center font-data text-[#8C8178]">{(data.buyPct || 0).toFixed(1)}%</td>
                              <td className="px-3 py-2 text-center font-data text-[#8C8178]">{(data.salesPct || 0).toFixed(0)}%</td>
                              <td className="px-3 py-2 text-center font-data text-[#8C8178]">{(data.stPct || 0).toFixed(0)}%</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            {/* Grand Total */}
            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-bold font-brand">{t('otbAnalysis.total')}</td>
              {comparisonBudgets.map(budget => (
                <React.Fragment key={`cmp-tot-${budget.id}`}>
                  <td className="px-3 py-4 text-center font-data font-bold">100%</td>
                  <td className="px-3 py-4 text-center font-data font-bold">100%</td>
                  <td className="px-3 py-4 text-center font-data font-bold">-</td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-0">
      {/* Unified Header: Filters + Budget Context + Tabs */}
      <div className="relative z-[100] bg-white rounded-xl border border-border-muted overflow-hidden">
        {/* Row 1: Filters + Budget Summary */}
        <div className="px-3 py-1.5 relative z-[100] border-b border-[#E8E2DB]/60">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Filter Controls */}
            <div className={`flex flex-wrap items-center gap-1.5 min-w-0 ${isMobile ? 'hidden' : ''}`}>
              {/* OA-1: Fiscal Year Dropdown */}
              <div className="relative" ref={setDropdownRef('year')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'year' ? null : 'year'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    selectedYear !== new Date().getFullYear()
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <Calendar size={12} className={selectedYear !== new Date().getFullYear() ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span>FY {selectedYear}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'year' && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                    {yearOptions.map((year) => (
                      <div
                        key={year}
                        onClick={() => { setSelectedYear(year); setOpenDropdown(null); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          selectedYear === year
                            ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                            : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                        }`}
                      >
                        <span className="font-medium">FY {year}</span>
                        {selectedYear === year && <Check size={14} className="text-[#C4975A]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-4 w-px hidden sm:block bg-border-muted"></div>

              {/* Budget Name Dropdown */}
              <div className="relative" ref={setDropdownRef('budget')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'budget' ? null : 'budget'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    selectedBudget
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <FileText size={12} className={selectedBudget ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span className="truncate max-w-[160px]">{selectedBudget?.budgetName || t('otbAnalysis.selectBudget')}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'budget' && (
                  <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                    <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB]">
                      <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#6B5D4F]">{t('budget.title')}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {loadingBudgets && (
                        <div className="px-4 py-6 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-[#C4975A]/30 border-t-[#C4975A] rounded-full animate-spin" />
                          <span className="ml-2 text-sm text-[#8C8178]">{t('common.loading')}...</span>
                        </div>
                      )}
                      {!loadingBudgets && filteredBudgetsForDropdown.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-[#8C8178]">
                          {t('budget.noMatchingBudgets')}
                        </div>
                      )}
                      {!loadingBudgets && filteredBudgetsForDropdown.length > 0 && (
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
                      {!loadingBudgets && filteredBudgetsForDropdown.map((budget) => (
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
                                <span className="text-xs font-medium text-[#C4975A] font-data">{formatCurrency(budget.totalBudget)}</span>
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

              <div className="h-4 w-px hidden sm:block bg-border-muted"></div>

              {/* Season Group Filter */}
              <div className="relative" ref={setDropdownRef('seasonGroup')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    selectedSeasonGroup !== 'all'
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <Calendar size={12} className={selectedSeasonGroup !== 'all' ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span>{SEASON_GROUPS.find(s => s.id === selectedSeasonGroup)?.label || t('otbAnalysis.seasonGroup')}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''}`} />
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
              <div className="relative" ref={setDropdownRef('season')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'season' ? null : 'season'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    selectedSeason !== 'all'
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <Clock size={12} className={selectedSeason !== 'all' ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span>{SEASONS.find(s => s.id === selectedSeason)?.label || t('otbAnalysis.season')}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
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

              {/* OA-2: Comparison Type Dropdown */}
              <div className="relative" ref={setDropdownRef('comparison')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'comparison' ? null : 'comparison'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    comparisonType !== 'same'
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <BarChart3 size={12} className={comparisonType !== 'same' ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span>{comparisonType === 'same' ? 'Same Season' : 'Different Season'}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'comparison' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'comparison' && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB] min-w-[160px]">
                    {[
                      { id: 'same', label: 'Same Season' },
                      { id: 'different', label: 'Different Season' },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => { setComparisonType(opt.id); setOpenDropdown(null); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          comparisonType === opt.id
                            ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                            : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                        }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                        {comparisonType === opt.id && <Check size={14} className="text-[#C4975A]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OA-3: Season Count / Periods Dropdown */}
              <div className="relative" ref={setDropdownRef('seasonCount')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'seasonCount' ? null : 'seasonCount'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    seasonCount !== 1
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <SlidersHorizontal size={12} className={seasonCount !== 1 ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span>{seasonCount} Period{seasonCount > 1 ? 's' : ''}</span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'seasonCount' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'seasonCount' && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                    {[1, 2, 3].map((count) => (
                      <div
                        key={count}
                        onClick={() => { setSeasonCount(count); setOpenDropdown(null); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          seasonCount === count
                            ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                            : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                        }`}
                      >
                        <span className="font-medium">{count} Period{count > 1 ? 's' : ''}</span>
                        {seasonCount === count && <Check size={14} className="text-[#C4975A]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OA-4: Brand Multi-Select Dropdown */}
              <div className="relative" ref={setDropdownRef('brand')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'brand' ? null : 'brand'));
                    setOpenCategoryDropdown(null);
                  }}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    selectedBrandIds.length > 0
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  <Tag size={12} className={selectedBrandIds.length > 0 ? 'text-dafc-gold' : 'text-content-muted'} />
                  <span className="truncate max-w-[120px]">
                    {selectedBrandIds.length === 0
                      ? 'Brand'
                      : selectedBrandIds.length === 1
                        ? (availableBrands.find(b => b.id === selectedBrandIds[0])?.name || 'Brand')
                        : `${selectedBrandIds.length} Brands`}
                  </span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'brand' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'brand' && (
                  <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[220px] bg-white border-[#E8E2DB]">
                    <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB] flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#6B5D4F]">Brand</span>
                      {selectedBrandIds.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBrandIds([]); }}
                          className="text-[10px] text-[#8C8178] hover:text-[#2C2417] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {availableBrands.length === 0 && (
                        <div className="px-4 py-4 text-center text-sm text-[#8C8178]">No brands available</div>
                      )}
                      {availableBrands.map((brand) => {
                        const isSelected = selectedBrandIds.includes(brand.id);
                        return (
                          <div
                            key={brand.id}
                            onClick={() => {
                              setSelectedBrandIds(prev =>
                                isSelected
                                  ? prev.filter(id => id !== brand.id)
                                  : [...prev, brand.id]
                              );
                            }}
                            className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer text-sm transition-colors ${
                              isSelected
                                ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                                : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#C4975A] border-[#C4975A]'
                                : 'border-[#C4B5A5] bg-white'
                            }`}>
                              {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="font-medium">{brand.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* OA-6: Compare Budgets Toggle */}
              <div className="h-4 w-px hidden sm:block bg-border-muted"></div>
              <button
                type="button"
                onClick={() => {
                  setCompareModeActive(prev => {
                    if (prev) {
                      setComparisonBudgetIds([]);
                    }
                    return !prev;
                  });
                }}
                className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                  compareModeActive
                    ? 'bg-[rgba(196,151,90,0.2)] border-[#C4975A] text-[#8A6340]'
                    : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                }`}
              >
                <GitCompare size={12} className={compareModeActive ? 'text-[#C4975A]' : 'text-content-muted'} />
                <span>Compare Budgets</span>
                {comparisonBudgetIds.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#C4975A] text-white rounded-full leading-none">{comparisonBudgetIds.length}</span>
                )}
              </button>

              {/* OA-6: Budget comparison multi-select dropdown */}
              {compareModeActive && (
                <div className="relative" ref={setDropdownRef('compareBudgets')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'compareBudgets' ? null : 'compareBudgets'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                      comparisonBudgetIds.length >= 2
                        ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                        : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                    }`}
                  >
                    <span>Select Budgets ({comparisonBudgetIds.length}/3)</span>
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'compareBudgets' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'compareBudgets' && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                      <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#6B5D4F]">Select 2-3 Budgets</span>
                        {comparisonBudgetIds.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setComparisonBudgetIds([]); }}
                            className="text-[10px] text-[#8C8178] hover:text-[#2C2417] font-medium"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {filteredBudgetsForDropdown.map((budget) => {
                          const isSelected = comparisonBudgetIds.includes(budget.id);
                          const isDisabled = !isSelected && comparisonBudgetIds.length >= 3;
                          return (
                            <div
                              key={`cmp-sel-${budget.id}`}
                              onClick={() => !isDisabled && toggleComparisonBudget(budget.id)}
                              className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer text-sm transition-colors ${
                                isDisabled ? 'opacity-40 cursor-not-allowed' :
                                isSelected
                                  ? 'bg-[rgba(160,120,75,0.18)] text-[#8A6340]'
                                  : 'hover:bg-[#FBF9F7] text-[#2C2417]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[#C4975A] border-[#C4975A]'
                                  : 'border-[#C4B5A5] bg-white'
                              }`}>
                                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm">{budget.budgetName}</div>
                                <div className="text-xs text-[#6B5D4F]">FY{budget.fiscalYear} · {budget.brandName} · {formatCurrency(budget.totalBudget)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Version Filter */}
              {selectedBudgetId && selectedBudgetId !== 'all' && (
              <>
              <div className="h-4 w-px hidden sm:block bg-border-muted"></div>
              <div className="relative" ref={setDropdownRef('version')}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown((prev) => (prev === 'version' ? null : 'version'));
                    setOpenCategoryDropdown(null);
                  }}
                  disabled={versions.length === 0 && !loadingVersions}
                  className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                    versions.length === 0 && !loadingVersions
                      ? 'bg-surface-secondary border-border-muted text-content-muted cursor-not-allowed opacity-50'
                      : selectedVersion
                        ? selectedVersion.isFinal
                          ? 'bg-dafc-gold/15 border-dafc-gold text-[#8A6340]'
                          : 'bg-dafc-gold/10 border-dafc-gold/40 text-[#8A6340]'
                        : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                  }`}
                >
                  {selectedVersion?.isFinal ? (
                    <Star size={12} className="text-dafc-gold fill-dafc-gold" />
                  ) : (
                    <Sparkles size={12} className={selectedVersion ? 'text-dafc-gold' : 'text-content-muted'} />
                  )}
                  <span className="truncate max-w-[140px]">
                    {loadingVersions ? `${t('common.loading')}...` : selectedVersion ? selectedVersion.name : t('common.version')}
                  </span>
                  {selectedVersion?.isFinal && (
                    <span className="px-1 py-px text-[8px] font-bold bg-dafc-gold text-white rounded leading-none">FINAL</span>
                  )}
                  <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'version' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'version' && (
                  <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                    <div className="p-2 border-b bg-[#FBF9F7] border-[#E8E2DB]">
                      <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#6B5D4F]">Planning Versions</span>
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
                              <span className={`font-semibold text-sm font-brand truncate ${selectedVersionId === version.id ? 'text-[#C4975A]' : 'text-[#2C2417]'}`}>
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
            </div>

            {/* OA-7: Mobile Filter Trigger Button */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="px-2.5 py-1 border rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-all bg-white border-border-muted text-content hover:bg-surface-secondary"
              >
                <SlidersHorizontal size={12} className="text-content-muted" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4975A]" />
                )}
              </button>
            )}

            {/* Right: Budget Summary (inline) */}
            {((selectedBudget && selectedSeasonGroup && selectedSeason) || budgetContext) && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E8E2DB]/60 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[11px] font-semibold font-brand text-[#8A6340] truncate max-w-[120px]">
                    {selectedBudget?.budgetName || budgetContext?.budgetName || 'Budget'}
                  </div>
                  <div className="text-[10px] text-[#8A6340]/60">
                    FY {selectedBudget?.fiscalYear || budgetContext?.fiscalYear} · {selectedBudget?.brandName || budgetContext?.brandName || 'Brand'}
                  </div>
                </div>
                <span className="text-sm font-bold font-data text-[#8A6340]">
                  {formatCurrency(
                    budgetContext?.rex || budgetContext?.ttp
                      ? (budgetContext.rex || 0) + (budgetContext.ttp || 0)
                      : selectedBudget?.totalBudget || 0
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* OA-7: Mobile Filter Sheet */}
        {isMobile && (
          <MobileFilterSheet
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            title="OTB Analysis Filters"
            filters={[
              {
                key: 'selectedYear',
                label: 'Fiscal Year',
                type: 'select',
                options: yearOptions.map(y => ({ value: String(y), label: `FY ${y}` })),
                defaultValue: String(new Date().getFullYear()),
              },
              {
                key: 'selectedBudgetId',
                label: 'Budget',
                type: 'select',
                options: filteredBudgetsForDropdown.map(b => ({ value: String(b.id), label: b.budgetName })),
                defaultValue: 'all',
              },
              {
                key: 'selectedSeasonGroup',
                label: 'Season Group',
                type: 'select',
                options: SEASON_GROUPS.map(s => ({ value: s.id, label: s.label })),
                defaultValue: '',
              },
              {
                key: 'selectedSeason',
                label: 'Season',
                type: 'select',
                options: SEASONS.map(s => ({ value: s.id, label: s.label })),
                defaultValue: '',
              },
              {
                key: 'comparisonType',
                label: 'Comparison',
                type: 'select',
                options: [
                  { value: 'same', label: 'Same Season' },
                  { value: 'different', label: 'Different Season' },
                ],
                defaultValue: 'same',
              },
              {
                key: 'seasonCount',
                label: 'Periods',
                type: 'select',
                options: [
                  { value: '1', label: '1 Period' },
                  { value: '2', label: '2 Periods' },
                  { value: '3', label: '3 Periods' },
                ],
                defaultValue: '1',
              },
              {
                key: 'brand',
                label: 'Brand',
                type: 'select',
                options: availableBrands.map(b => ({ value: String(b.id), label: b.name })),
                defaultValue: '',
              },
            ]}
            values={{
              selectedYear: String(selectedYear),
              selectedBudgetId: String(selectedBudgetId),
              selectedSeasonGroup,
              selectedSeason,
              comparisonType,
              seasonCount: String(seasonCount),
              brand: selectedBrandIds.length === 1 ? String(selectedBrandIds[0]) : '',
            }}
            onApply={(v) => {
              if (v.selectedYear) setSelectedYear(Number(v.selectedYear));
              if (v.selectedBudgetId) setSelectedBudgetId(v.selectedBudgetId);
              if (v.selectedSeasonGroup != null) setSelectedSeasonGroup(v.selectedSeasonGroup);
              if (v.selectedSeason != null) setSelectedSeason(v.selectedSeason);
              if (v.comparisonType) setComparisonType(v.comparisonType);
              if (v.seasonCount) setSeasonCount(Number(v.seasonCount));
              if (v.brand) {
                setSelectedBrandIds([v.brand]);
              } else {
                setSelectedBrandIds([]);
              }
            }}
            onReset={() => {
              clearFilters();
            }}
          />
        )}

        {/* Row 2: Tabs + Category Filters (inline) + Edit Hint */}
        {selectedBudget && selectedSeason && selectedSeasonGroup && (
          <div className="flex items-center px-3 border-b border-[#E8E2DB]/60 bg-[#FBF9F7]/50">
            <div className={`flex gap-0.5 shrink-0 ${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-[11px] font-medium font-brand flex items-center gap-1.5 border-b-2 transition-all duration-200 ${
                      isActive
                        ? 'border-dafc-gold text-[#8A6340] bg-white -mb-px rounded-t-md'
                        : 'border-transparent text-content-muted hover:text-content hover:bg-white/50 rounded-t-md'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Inline Category Filters — visible only when Category tab active */}
            {activeTab === 'category' && (
              <>
                <div className="w-px h-5 bg-[#E8E2DB] mx-2 shrink-0" />
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0">
                  {[
                    { key: 'genderFilter', value: genderFilter, options: filterOptions.genders, onChange: handleGenderFilterChange },
                    { key: 'categoryFilter', value: categoryFilter, options: filteredCategoryOptions, onChange: handleCategoryFilterChange },
                    { key: 'subCategoryFilter', value: subCategoryFilter, options: filteredSubCategoryOptions, onChange: handleSubCategoryFilterChange },
                  ].map((filter, idx) => {
                    const nonAllOptions = filter.options.filter(o => o.id !== 'all');
                    if (nonAllOptions.length === 0) return null;
                    return (
                      <React.Fragment key={filter.key}>
                        {idx > 0 && <span className="text-[#D4CCC3] mx-0.5 shrink-0">/</span>}
                        {nonAllOptions.map(option => (
                          <button
                            key={option.id}
                            onClick={() => filter.onChange(filter.value === option.id ? 'all' : option.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${
                              filter.value === option.id
                                ? 'bg-[#8A6340] text-white shadow-sm'
                                : 'text-[#8C8178] hover:text-[#6B5D4F] hover:bg-[#EDE5DC]'
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {(genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
                    <button
                      onClick={() => { setGenderFilter('all'); setCategoryFilter('all'); setSubCategoryFilter('all'); }}
                      className="p-0.5 rounded transition-colors text-[#8C8178] hover:text-[#2C2417] hover:bg-[#F5F0EB] shrink-0 ml-0.5"
                      title={t('common.clearAll')}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="ml-auto hidden md:flex items-center gap-1.5 text-[10px] text-[#8A6340]/60 shrink-0 pl-2">
              <Pencil size={9} />
              <span>Click gold cells to edit</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {selectedBudget && selectedSeason && selectedSeasonGroup && (
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
            {/* OA-6: Show comparison view when 2+ budgets selected */}
            {compareModeActive && comparisonBudgetIds.length >= 2 ? (
              renderBudgetComparison()
            ) : (
              <>
                {activeTab === 'collection' && renderCollectionTab()}
                {activeTab === 'gender' && renderGenderTab()}
                {activeTab === 'category' && renderCategoryTab()}
              </>
            )}
          </div>
        )}

        {/* OA-5: Historical data loading indicator */}
        {loadingHistorical && (
          <div className="px-4 py-2 border-t border-[#E8E2DB] bg-[rgba(215,183,151,0.08)] flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#C4975A]/30 border-t-[#C4975A] rounded-full animate-spin" />
            <span className="text-xs text-[#8C8178]">Loading historical data...</span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {selectedBudget && selectedSeason && selectedSeasonGroup && (
        <div className="sticky bottom-0 z-50 mt-3">
          <div className="bg-white/95 backdrop-blur-sm border border-border-muted rounded-xl px-4 py-2.5 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-brand rounded-lg transition-colors text-[#6B5D4F] hover:bg-[#F5F0EB] border border-[#E8E2DB]"
            >
              <ArrowLeft size={13} />
              {t('nav.budgetAllocation')}
            </button>

            <div className="flex items-center gap-2">
              {selectedVersion && (
                <span className="text-[10px] font-data text-[#8C8178] hidden sm:inline">
                  {selectedVersion.name}{selectedVersion.isFinal ? ' (Final)' : ''}
                </span>
              )}
              <button
                onClick={() => {
                  if (onOpenSkuProposal) {
                    onOpenSkuProposal({
                      budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
                      budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
                      fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
                      brandName: selectedBudget?.brandName || budgetContext?.brandName,
                      seasonGroup: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : budgetContext?.seasonGroup,
                      season: selectedSeason !== 'all' ? selectedSeason : budgetContext?.season,
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold font-brand rounded-lg transition-all bg-gradient-to-r from-[#C4975A] to-[#B8894E] hover:from-[#B8894E] hover:to-[#A07B4B] text-white shadow-sm hover:shadow-md"
              >
                <Package size={13} />
                {t('nav.skuProposal')}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTBAnalysisScreen;
