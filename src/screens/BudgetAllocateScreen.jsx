'use client';

import { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import {
  DollarSign, Sparkles, Clock, ChevronDown, Check, ChevronRight,
  TrendingUp, Sun, Snowflake,
  Star, Layers, Tag, FileText, X, Edit, Download, Undo2, Redo2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils';
import { SEASON_GROUPS, STORES, SEASON_CONFIG } from '../utils/constants';
import { budgetService, masterDataService, planningService } from '../services';
import { invalidateCache } from '../services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAllocationState } from '@/hooks/useAllocationState';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import AllocationProgressBar from '@/components/Common/AllocationProgressBar';
import UnsavedChangesBanner from '@/components/Common/UnsavedChangesBanner';
import { exportAllocationToExcel } from '@/utils/exportExcel';

// Constants - same as BudgetManagementScreen
const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i);

const GROUP_BRAND_COLORS = [
  'from-[#C4975A] to-[#8A6340]',
  'from-[#1B6B45] to-[#0d5a37]',
  'from-[#1B6B45] to-[#1B6B45]',
  'from-[#6366f1] to-[#4338ca]',
];


const BudgetAllocateScreen = ({
  budgets,
  plannings,
  getPlanningStatus,
  handleOpenPlanningDetail,
  onOpenOtbAnalysis,
  allocationData,
  onAllocationDataUsed,
  availableBudgets: propAvailableBudgets,
  darkMode = false
}) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  // API state for fetching budgets and brands
  const [apiBudgets, setApiBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [brandList, setBrandList] = useState([]);
  const [groupBrandList, setGroupBrandList] = useState([]);


  // Fetch brands (group brands) from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brands = await masterDataService.getBrands();
        const list = Array.isArray(brands) ? brands : (brands?.data || []);

        // Group brands are the top-level items; individual brands may be nested
        // The API returns group_brands (Ferragamo, Burberry, etc.)
        const groups = [];
        const allBrands = [];

        list.forEach((b, idx) => {
          const id = b.id || b.brandId;
          const name = b.name || b.brandName || b.code || 'Unknown';
          const groupId = b.groupBrandId || b.groupId || id;

          // Add to group list (dedupe)
          if (!groups.find(g => g.id === groupId)) {
            groups.push({
              id: groupId,
              name: b.groupBrand?.name || b.groupName || name,
              color: GROUP_BRAND_COLORS[idx % GROUP_BRAND_COLORS.length]
            });
          }

          allBrands.push({
            id,
            groupBrandId: groupId,
            name
          });
        });

        setGroupBrandList(groups);
        setBrandList(allBrands);
      } catch (err) {
        console.error('Failed to fetch brands:', err);
        setBrandList([]);
        setGroupBrandList([]);
      }
    };
    fetchBrands();
  }, []);

  // Fetch budgets on mount (with Strict Mode ignore pattern)
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoadingBudgets(true);
      try {
        const response = await budgetService.getAll({ status: 'APPROVED' });
        if (ignore) return;
        const budgetList = (response.data || response || []).map(budget => ({
          id: budget.id,
          fiscalYear: budget.fiscalYear,
          groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
          brandId: budget.brandId,
          brandName: budget.Brand?.name || budget.groupBrand?.name || budget.brandName || 'Unknown',
          totalBudget: budget.totalAmount || budget.totalBudget || 0,
          budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
          status: (budget.status || 'DRAFT').toLowerCase()
        }));
        setApiBudgets(budgetList);
      } catch (err) {
        if (!ignore) {
          console.error('Failed to fetch budgets:', err);
        }
      } finally {
        if (!ignore) setLoadingBudgets(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  // Available budgets for dropdown selection - prefer API data
  const availableBudgets = apiBudgets.length > 0 ? apiBudgets : (propAvailableBudgets || []);
  // Filter states - all single choice
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedGroupBrand, setSelectedGroupBrand] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState(null); // null means "All Seasons"
  // Budget info from allocation
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);

  // Budget name dropdown state
  const [isBudgetNameDropdownOpen, setIsBudgetNameDropdownOpen] = useState(false);

  // Store allocation data locally to survive the race condition with API fetch
  const [pendingAllocation, setPendingAllocation] = useState(null);
  const [fallbackBudgetName, setFallbackBudgetName] = useState(null);

  // Collapse states for table sections
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedBrands, setCollapsedBrands] = useState({});

  // Allocation state with undo/redo, dirty tracking, autosave, validation
  const allocation = useAllocationState(t);
  const {
    allocationValues, setAllocationValues,
    seasonTotalValues, setSeasonTotalValues,
    brandTotalValues, setBrandTotalValues,
    isDirty, discardChanges, saving, saveDraft, submitForApproval,
    canUndo, canRedo, undo, redo, setVersionId,
    autoSaving, lastSavedAt, validate, pushUndo,
  } = allocation;

  // Session recovery for draft persistence
  const sessionRecovery = useSessionRecovery(selectedBudgetId);

  // Clipboard paste for Excel copy support
  const handlePasteValues = useCallback((startIndex, values) => {
    const cells = Array.from(document.querySelectorAll('[data-alloc-cell]'));
    values.forEach((val, i) => {
      const cell = cells[startIndex + i];
      if (cell) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(cell, String(val));
          cell.dispatchEvent(new Event('input', { bubbles: true }));
          cell.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }, []);
  useClipboardPaste(handlePasteValues);

  // Track which cell is currently being edited (for showing raw value)
  const [editingCell, setEditingCell] = useState(null);

  // Dropdown states
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isGroupBrandDropdownOpen, setIsGroupBrandDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Sync versionId to allocation hook
  useEffect(() => {
    setVersionId(selectedVersionId);
  }, [selectedVersionId, setVersionId]);

  // Save draft to localStorage when dirty
  useEffect(() => {
    if (selectedBudgetId && isDirty) {
      sessionRecovery.saveDraft(allocationValues, seasonTotalValues, brandTotalValues);
    }
  }, [allocationValues, seasonTotalValues, brandTotalValues, selectedBudgetId, isDirty]);
  // Refs
  const budgetNameDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const groupBrandDropdownRef = useRef(null);
  const brandDropdownRef = useRef(null);
  const seasonDropdownRef = useRef(null);
  const versionDropdownRef = useRef(null);
  // Get brands filtered by selected group brand
  const filteredBrands = useMemo(() => {
    if (!selectedGroupBrand) return brandList;
    return brandList.filter(b => b.groupBrandId === selectedGroupBrand);
  }, [selectedGroupBrand, brandList]);

  // Track if we just applied allocation data to prevent reset (using ref for synchronous access)
  const appliedAllocationRef = useRef(false);

  // Reset brand selection when group brand changes (only if not from allocation)
  useEffect(() => {
    if (!appliedAllocationRef.current) {
      setSelectedBrand(null);
    } else {
      // Reset the flag after the brand has been set
      appliedAllocationRef.current = false;
    }
  }, [selectedGroupBrand]);

  // Handle allocation data from Budget Management page
  useEffect(() => {
    if (allocationData) {
      // Store locally so it survives clearing
      setPendingAllocation(allocationData);
      setFallbackBudgetName(allocationData.budgetName);

      // Mark that we're applying allocation data (synchronously)
      appliedAllocationRef.current = true;

      // Set filters from allocation data
      if (allocationData.year) setSelectedYear(allocationData.year);
      if (allocationData.groupBrand) setSelectedGroupBrand(allocationData.groupBrand);
      if (allocationData.totalBudget) setTotalBudget(allocationData.totalBudget);

      // Set budget ID directly if available
      if (allocationData.id) {
        setSelectedBudgetId(allocationData.id);
      }

      // Find and set brand
      if (allocationData.brandName && allocationData.groupBrand) {
        const matchingBrand = brandList.find(
          b => b.groupBrandId === allocationData.groupBrand && b.name === allocationData.brandName
        );
        if (matchingBrand) setSelectedBrand(matchingBrand.id);
      }

      // Clear allocation data from context
      if (onAllocationDataUsed) onAllocationDataUsed();
    }
  }, [allocationData, onAllocationDataUsed]);

  // When availableBudgets load and we have pending allocation, try to match
  useEffect(() => {
    if (pendingAllocation && availableBudgets.length > 0) {
      // Match by ID first, then by name
      const match = pendingAllocation.id
        ? availableBudgets.find(b => b.id === pendingAllocation.id)
        : availableBudgets.find(
            b => b.budgetName === pendingAllocation.budgetName &&
              b.fiscalYear === pendingAllocation.year &&
              b.groupBrand === pendingAllocation.groupBrand
          );

      if (match) {
        setSelectedBudgetId(match.id);
        setTotalBudget(match.totalBudget || pendingAllocation.totalBudget);
        // Keep fallbackBudgetName as a reliable backup - don't clear it
      }
      setPendingAllocation(null);
    }
  }, [pendingAllocation, availableBudgets]);

  // Get selected budget object
  const selectedBudget = availableBudgets.find(b => b.id === selectedBudgetId);

  // Fetch planning versions when budget is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedBudgetId) {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (budgetNameDropdownRef.current && !budgetNameDropdownRef.current.contains(event.target)) {
        setIsBudgetNameDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
      if (groupBrandDropdownRef.current && !groupBrandDropdownRef.current.contains(event.target)) {
        setIsGroupBrandDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false);
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target)) {
        setIsSeasonDropdownOpen(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setIsVersionDropdownOpen(false);
      }
};
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate store percentages from budgets
  const storePercentages = useMemo(() => {
    const totalByStore = {};
    let grandTotal = 0;

    STORES.forEach(store => {
      totalByStore[store.id] = 0;
    });

    budgets.forEach(budget => {
      if (budget.fiscalYear === selectedYear) {
        budget.details?.forEach(detail => {
          if (totalByStore[detail.storeId] !== undefined) {
            totalByStore[detail.storeId] += detail.budgetAmount;
            grandTotal += detail.budgetAmount;
          }
        });
      }
    });

    const percentages = {};
    STORES.forEach(store => {
      percentages[store.id] = grandTotal > 0 ? Math.round((totalByStore[store.id] / grandTotal) * 100) : 50;
    });

    return percentages;
  }, [budgets, selectedYear]);

  // Get allocation key for state
  const getAllocationKey = (brandId, seasonGroup, subSeason) => {
    return `${brandId}-${seasonGroup}-${subSeason}`;
  };

  // Delegate to hook handlers (same signature as before)
  const handleAllocationChange = allocation.handleAllocationChange;
  const handleSeasonTotalChange = allocation.handleSeasonTotalChange;
  const handleBrandTotalChange = allocation.handleBrandTotalChange;

  // Compute total allocated for progress bar
  const totalAllocated = useMemo(() => {
    let sum = 0;
    Object.values(allocationValues).forEach((storeValues) => {
      if (storeValues && typeof storeValues === 'object') {
        Object.values(storeValues).forEach((val) => {
          if (typeof val === 'number') sum += val;
        });
      }
    });
    return sum;
  }, [allocationValues]);

  // Save draft handler
  const handleSaveDraft = useCallback(() => {
    if (selectedVersionId) {
      saveDraft(selectedVersionId);
      sessionRecovery.clearDraft();
    }
  }, [selectedVersionId, saveDraft, sessionRecovery]);

  // Export to Excel handler (displayBrands defined later in component)
  const displayBrandsRef = useRef([]);
  const handleExportExcel = useCallback(async () => {
    if (!selectedBudgetId) return;
    try {
      await exportAllocationToExcel({
        budgetName: selectedBudget?.budgetName || fallbackBudgetName || 'Allocation',
        fiscalYear: selectedBudget?.fiscalYear || selectedYear,
        stores: STORES,
        seasonGroups: selectedSeasonGroup ? [selectedSeasonGroup] : SEASON_GROUPS,
        seasonConfig: SEASON_CONFIG,
        brands: displayBrandsRef.current || [],
        allocationValues,
        totalBudget,
        totalAllocated,
      });
      toast.success(t('planning.exportSuccess') || 'Exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(t('planning.saveFailed') || 'Export failed');
    }
  }, [selectedBudgetId, selectedBudget, fallbackBudgetName, selectedYear, selectedSeasonGroup, allocationValues, totalBudget, totalAllocated, t]);

  // Get season total value (from state or calculated)
  const getSeasonTotalValue = (brandId, seasonGroup, field) => {
    const key = `${brandId}-${seasonGroup}`;
    if (seasonTotalValues[key]?.[field] !== undefined) {
      return seasonTotalValues[key][field];
    }
    return getSeasonTotals(brandId, seasonGroup)[field];
  };

  // Get brand total value (from state or calculated)
  const getBrandTotalValue = (brandId, field) => {
    if (brandTotalValues[brandId]?.[field] !== undefined) {
      return brandTotalValues[brandId][field];
    }
    return getBrandTotals(brandId)[field];
  };

  // Get budget data for a specific brand, season group, and sub-season
  const getBudgetData = (brandId, seasonGroupId, subSeason) => {
    const seasonType = subSeason === 'Pre' ? 'pre' : 'main';
    const seasonId = `${seasonGroupId}_${seasonType}_${selectedYear}`;

    const budget = budgets.find(b =>
      b.groupBrandId === brandId &&
      b.seasonId === seasonId &&
      b.fiscalYear === selectedYear
    );

    // Get values from allocation state first, then fall back to budget data
    const key = getAllocationKey(brandId, seasonGroupId, subSeason);
    const allocatedRex = allocationValues[key]?.rex;
    const allocatedTtp = allocationValues[key]?.ttp;

    if (!budget && allocatedRex === undefined && allocatedTtp === undefined) {
      return { rex: 0, ttp: 0, sum: 0, budget: null };
    }

    const rexDetail = budget?.details?.find(d => d.storeId === 'rex');
    const ttpDetail = budget?.details?.find(d => d.storeId === 'ttp');

    const rex = allocatedRex !== undefined ? allocatedRex : (rexDetail?.budgetAmount || 0);
    const ttp = allocatedTtp !== undefined ? allocatedTtp : (ttpDetail?.budgetAmount || 0);

    return {
      rex,
      ttp,
      sum: rex + ttp,
      budget
    };
  };

  // Get season totals for a brand
  const getSeasonTotals = (brandId, seasonGroupId) => {
    let rex = 0, ttp = 0, sum = 0;

    SEASON_CONFIG[seasonGroupId]?.subSeasons.forEach(subSeason => {
      const data = getBudgetData(brandId, seasonGroupId, subSeason);
      rex += data.rex;
      ttp += data.ttp;
      sum += data.sum;
    });

    return { rex, ttp, sum };
  };

  // Get brand totals (handles All Seasons when selectedSeasonGroup is null)
  const getBrandTotals = (brandId) => {
    if (selectedSeasonGroup) {
      return getSeasonTotals(brandId, selectedSeasonGroup);
    }
    // Sum totals from all season groups
    let rex = 0, ttp = 0, sum = 0;
    SEASON_GROUPS.forEach(sg => {
      const totals = getSeasonTotals(brandId, sg);
      rex += totals.rex;
      ttp += totals.ttp;
      sum += totals.sum;
    });
    return { rex, ttp, sum };
  };

  // Calculate mix percentage
  const calculateMix = (value, brandId) => {
    const brandTotals = getBrandTotals(brandId);
    if (brandTotals.sum === 0) return 0;
    return Math.round((value / brandTotals.sum) * 100);
  };

  // Toggle group collapse
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Toggle brand collapse
  const toggleBrandCollapse = (brandId) => {
    setCollapsedBrands(prev => ({
      ...prev,
      [brandId]: !prev[brandId]
    }));
  };

  // Get brands to display based on filters
  const displayBrands = useMemo(() => {
    let brands;
    if (selectedBrand) {
      brands = brandList.filter(b => b.id === selectedBrand);
    } else if (selectedGroupBrand) {
      brands = brandList.filter(b => b.groupBrandId === selectedGroupBrand);
    } else {
      brands = brandList;
    }
    displayBrandsRef.current = brands;
    return brands;
  }, [selectedBrand, selectedGroupBrand, brandList]);

  // Get groups to display based on filters
  const displayGroups = useMemo(() => {
    if (selectedGroupBrand) {
      return groupBrandList.filter(g => g.id === selectedGroupBrand);
    }
    return groupBrandList;
  }, [selectedGroupBrand, groupBrandList]);

  // Handle budget selection from dropdown - auto-populate other filters
  const handleBudgetSelect = (budget) => {
    if (!budget) {
      setSelectedBudgetId(null);
      setTotalBudget(0);
      setFallbackBudgetName(null);
      return;
    }

    appliedAllocationRef.current = true;
    setSelectedBudgetId(budget.id);
    setTotalBudget(budget.totalBudget);
    setFallbackBudgetName(budget.budgetName);

    // Auto-set other filters based on selected budget
    if (budget.fiscalYear) setSelectedYear(budget.fiscalYear);
    if (budget.groupBrand) setSelectedGroupBrand(budget.groupBrand);

    // Find matching brand
    if (budget.brandName && budget.groupBrand) {
      const matchingBrand = brandList.find(
        b => b.groupBrandId === budget.groupBrand && b.name === budget.brandName
      );
      if (matchingBrand) {
        setSelectedBrand(matchingBrand.id);
      }
    }

    setIsBudgetNameDropdownOpen(false);
  };

  // Clear budget selection
  const clearBudgetSelection = () => {
    setSelectedBudgetId(null);
    setTotalBudget(0);
    setSelectedVersionId(null);
    setVersions([]);
    setFallbackBudgetName(null);
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

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // Get selected group brand object
  const selectedGroupBrandObj = groupBrandList.find(b => b.id === selectedGroupBrand);
  const selectedBrandObj = brandList.find(b => b.id === selectedBrand);
  return (
    <>
      {/* Filter Section — flat, no nesting */}
      <div className="mb-3 md:mb-4 relative z-[100]">
          <div className="bg-white rounded-xl border border-border-muted">
            {/* Filter Controls */}
            <div className="px-3 py-1.5 relative z-[100]">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Budget Name Dropdown */}
                <div className="relative" ref={budgetNameDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBudgetNameDropdownOpen(!isBudgetNameDropdownOpen);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${selectedBudget
                      ? 'bg-[rgba(27,107,69,0.08)] border-[#1B6B45]/40 text-[#1B6B45]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                      }`}
                  >
                    <FileText size={12} className={selectedBudget ? 'text-[#1B6B45]' : 'text-content-muted'} />
                    <span className="truncate max-w-[160px]">{selectedBudget?.budgetName || fallbackBudgetName || t('planning.selectBudget')}</span>
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${isBudgetNameDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isBudgetNameDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                      <div className="p-2 border-b border-[#E8E2DB] bg-[rgba(160,120,75,0.08)]">
                        <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#8C8178]">{t('budget.title')}</span>
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
                        {!loadingBudgets && availableBudgets.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-[#8C8178]">
                            {t('budget.noMatchingBudgets')}
                          </div>
                        )}
                        {/* Clear Selection Option */}
                        {!loadingBudgets && availableBudgets.length > 0 && (
                        <div
                          onClick={() => handleBudgetSelect(null)}
                          className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${!selectedBudgetId
                            ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                            : 'hover:bg-[rgba(160,120,75,0.18)] text-[#8C8178]'
                            }`}
                        >
                          <span className="font-medium">{t('planning.selectBudget')}</span>
                          {!selectedBudgetId && <Check size={14} className="text-[#1B6B45]" />}
                        </div>
                        )}
                        {!loadingBudgets && availableBudgets.map((budget) => (
                          <div
                            key={budget.id}
                            onClick={() => handleBudgetSelect(budget)}
                            className={`px-4 py-3 cursor-pointer transition-colors border-t border-[#E8E2DB] ${selectedBudgetId === budget.id
                              ? 'bg-[rgba(27,107,69,0.1)]'
                              : 'hover:bg-[rgba(160,120,75,0.18)]'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className={`font-semibold text-sm font-brand ${selectedBudgetId === budget.id ? 'text-[#1B6B45]' : 'text-[#2C2417]'}`}>
                                  {budget.budgetName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-data text-[#8C8178]">FY{budget.fiscalYear}</span>
                                  <span className="text-[#E8E2DB]">&bull;</span>
                                  <span className="text-xs text-[#8C8178]">{budget.brandName}</span>
                                  <span className="text-[#E8E2DB]">&bull;</span>
                                  <span className="text-xs font-medium font-data text-[#1B6B45]">{formatCurrency(budget.totalBudget)}</span>
                                </div>
                              </div>
                              {selectedBudgetId === budget.id && (
                                <div className="w-5 h-5 rounded-full bg-[#1B6B45] flex items-center justify-center flex-shrink-0 ml-2">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Show message when no budgets available after loading */}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-4 w-px shrink-0 bg-border-muted" />

                {/* Year Filter */}
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearDropdownOpen(!isYearDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className="px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all bg-white border-border-muted text-content hover:bg-surface-secondary"
                  >
                    <Clock size={12} className="text-content-muted" />
                    <span className="font-data">FY {selectedYear}</span>
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isYearDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                      {YEARS.map((year) => (
                        <div
                          key={year}
                          onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedYear === year
                            ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                            : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                            }`}
                        >
                          <span className="font-medium font-data">FY {year}</span>
                          {selectedYear === year && <Check size={14} className="text-[#1B6B45]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Brand Filter */}
                <div className="relative" ref={groupBrandDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGroupBrandDropdownOpen(!isGroupBrandDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${selectedGroupBrand
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#6B4D30]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                      }`}
                  >
                    <Layers size={12} className={selectedGroupBrand ? 'text-[#6B4D30]' : 'text-content-muted'} />
                    <span className="truncate max-w-[120px]">{selectedGroupBrandObj?.name || t('budget.groupBrand')}</span>
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${isGroupBrandDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isGroupBrandDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                      <div
                        onClick={() => { setSelectedGroupBrand(null); setIsGroupBrandDropdownOpen(false); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedGroupBrand === null
                          ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                          : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                          }`}
                      >
                        <span className="font-medium">{t('budget.allGroupBrands')}</span>
                        {selectedGroupBrand === null && <Check size={14} className="text-[#1B6B45]" />}
                      </div>
                      {groupBrandList.map((group) => (
                        <div
                          key={group.id}
                          onClick={() => { setSelectedGroupBrand(group.id); setIsGroupBrandDropdownOpen(false); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedGroupBrand === group.id
                            ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                            : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                            }`}
                        >
                          <span className="font-medium">{group.name}</span>
                          {selectedGroupBrand === group.id && <Check size={14} className="text-[#1B6B45]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Filter */}
                <div className="relative" ref={brandDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBrandDropdownOpen(!isBrandDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${selectedBrand
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#6B4D30]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                      }`}
                  >
                    <Tag size={12} className={selectedBrand ? 'text-[#6B4D30]' : 'text-content-muted'} />
                    <span className="truncate max-w-[120px]">{selectedBrandObj?.name || t('budget.brand')}</span>
                    <ChevronDown size={11} className={`transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isBrandDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden max-h-60 overflow-y-auto bg-white border-[#E8E2DB]">
                      <div
                        onClick={() => { setSelectedBrand(null); setIsBrandDropdownOpen(false); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedBrand === null
                          ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                          : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                          }`}
                      >
                        <span className="font-medium">{t('budget.allBrands')}</span>
                        {selectedBrand === null && <Check size={14} className="text-[#1B6B45]" />}
                      </div>
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand.id}
                          onClick={() => { setSelectedBrand(brand.id); setIsBrandDropdownOpen(false); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedBrand === brand.id
                            ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                            : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                            }`}
                        >
                          <span className="font-medium">{brand.name}</span>
                          {selectedBrand === brand.id && <Check size={14} className="text-[#1B6B45]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Season Group Filter */}
                <div className="relative" ref={seasonDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${selectedSeasonGroup
                      ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#6B4D30]'
                      : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                      }`}
                  >
                    {selectedSeasonGroup === 'SS' ? <Sun size={12} className="text-[#D97706]" /> : selectedSeasonGroup === 'FW' ? <Snowflake size={12} className="text-[#6B4D30]" /> : <Layers size={12} className="text-content-muted" />}
                    <span>{selectedSeasonGroup ? (SEASON_CONFIG[selectedSeasonGroup]?.name || selectedSeasonGroup) : t('planning.seasonGroup')}</span>
                    <ChevronDown size={11} className={`transition-transform duration-200 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSeasonDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden bg-white border-[#E8E2DB]">
                      <div
                        onClick={() => { setSelectedSeasonGroup(null); setIsSeasonDropdownOpen(false); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedSeasonGroup === null
                          ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                          : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-[#8C8178]" />
                          <span className="font-medium">{t('planning.allSeasonGroups')}</span>
                        </div>
                        {selectedSeasonGroup === null && <Check size={14} className="text-[#1B6B45]" />}
                      </div>
                      {SEASON_GROUPS.map((sg) => (
                        <div
                          key={sg}
                          onClick={() => { setSelectedSeasonGroup(sg); setIsSeasonDropdownOpen(false); }}
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedSeasonGroup === sg
                            ? 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]'
                            : 'hover:bg-[rgba(160,120,75,0.18)] text-[#2C2417]'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {sg === 'SS' ? <Sun size={14} className="text-[#D97706]" /> : <Snowflake size={14} className="text-[#6B4D30]" />}
                            <span className="font-medium">{SEASON_CONFIG[sg]?.name || sg}</span>
                          </div>
                          {selectedSeasonGroup === sg && <Check size={14} className="text-[#1B6B45]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Version Filter */}
                {selectedBudgetId && (
                  <div className="h-4 w-px shrink-0 bg-border-muted" />
                )}
                {selectedBudgetId && (
                <div className="relative" ref={versionDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionDropdownOpen(!isVersionDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`px-2.5 py-1 border rounded-md cursor-pointer flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                      versions.length === 0 && !loadingVersions
                        ? 'bg-surface-secondary border-border-muted text-content-muted cursor-not-allowed opacity-50'
                        : selectedVersion
                          ? selectedVersion.isFinal
                            ? 'bg-dafc-gold/10 border-dafc-gold/40 text-[#6B4D30]'
                            : 'bg-[rgba(27,107,69,0.08)] border-[#1B6B45]/40 text-[#1B6B45]'
                          : 'bg-white border-border-muted text-content hover:bg-surface-secondary'
                    }`}
                  >
                    {selectedVersion?.isFinal ? (
                      <Star size={11} className="fill-dafc-gold text-dafc-gold shrink-0" />
                    ) : (
                      <Sparkles size={11} className={selectedVersion ? 'text-[#6B4D30]' : 'text-content-muted'} />
                    )}
                    <span className="truncate max-w-[140px]">
                      {loadingVersions ? 'Loading...' : selectedVersion ? selectedVersion.name : 'Select Version'}
                    </span>
                    {selectedVersion?.isFinal && (
                      <span className="px-1 py-px text-[8px] font-bold bg-dafc-gold text-white rounded shrink-0 leading-none">FINAL</span>
                    )}
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isVersionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] bg-white border-[#E8E2DB]">
                      <div className="p-2 border-b border-[#E8E2DB] bg-[rgba(160,120,75,0.08)]">
                        <span className="text-xs font-semibold uppercase tracking-wide font-brand text-[#8C8178]">{t('skuProposal.planningVersions')}</span>
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
                            onClick={() => { setSelectedVersionId(version.id); setIsVersionDropdownOpen(false); }}
                            className={`px-4 py-3 cursor-pointer transition-colors border-t border-[#E8E2DB] ${
                              selectedVersionId === version.id
                                ? 'bg-[rgba(27,107,69,0.1)]'
                                : 'hover:bg-[rgba(160,120,75,0.18)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {version.isFinal && <Star size={14} className="fill-[#C4975A] flex-shrink-0 text-[#6B4D30]" />}
                                <span className={`font-semibold text-sm font-brand truncate ${selectedVersionId === version.id ? 'text-[#1B6B45]' : 'text-[#2C2417]'}`}>
                                  {version.name}
                                </span>
                                {version.isFinal && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#C4975A] text-[#FFFFFF] rounded flex-shrink-0">FINAL</span>
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
                                    className="px-2 py-1 text-xs font-medium rounded transition-colors bg-[rgba(196,151,90,0.2)] text-[#6B4D30] hover:bg-[rgba(196,151,90,0.35)]"
                                  >
                                    {t('planning.latestVersion')}
                                  </button>
                                )}
                                {selectedVersionId === version.id && <Check size={14} className="text-[#1B6B45]" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}

              </div>
            </div>





          </div>
      </div>
      {/* Budget Table - Collapsible by Group Brand and Brand */}
      {(selectedBudget || selectedBudgetId) && (
        <div className="space-y-2 relative z-[10]">
          {displayGroups.map((group) => {
            const groupBrands = displayBrands.filter(b => b.groupBrandId === group.id);
            const isGroupCollapsed = collapsedGroups[group.id];

            // Calculate group totals
            const groupTotals = groupBrands.reduce((acc, brand) => {
              const brandTotals = getBrandTotals(brand.id);
              return {
                rex: acc.rex + brandTotals.rex,
                ttp: acc.ttp + brandTotals.ttp,
                sum: acc.sum + brandTotals.sum
              };
            }, { rex: 0, ttp: 0, sum: 0 });

            return (
              <div key={group.id} className="rounded-xl shadow-sm border overflow-hidden bg-white border-[#E8E2DB]">
                {/* Group Header - Collapsible with Total Budget */}
                <div
                  onClick={() => !selectedGroupBrand && toggleGroupCollapse(group.id)}
                  className={`px-4 py-2 bg-gradient-to-r ${group.color} border-b border-[#E8E2DB] flex items-center justify-between ${!selectedGroupBrand ? 'cursor-pointer hover:opacity-90' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {!selectedGroupBrand && (
                      <ChevronRight
                        size={20}
                        className={`text-white transition-transform duration-200 ${!isGroupCollapsed ? 'rotate-90' : ''}`}
                      />
                    )}
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm font-bold font-brand shadow-lg">
                      {group.id}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white font-brand">{group.name}</div>
                      <div className="text-xs text-white/80 font-data">
                        {groupBrands.length} brand{groupBrands.length !== 1 ? 's' : ''} • {selectedSeasonGroup ? SEASON_CONFIG[selectedSeasonGroup]?.name : t('planning.allSeasonGroups')} {selectedYear}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Budget Allocated - show when budget is selected */}
                    {totalBudget > 0 && (selectedBudget || selectedBudgetId) && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/15 rounded-lg backdrop-blur-sm">
                        <div className="text-right">
                          <div className="text-[10px] text-white/70 font-medium font-brand">{selectedBudget?.budgetName || fallbackBudgetName}</div>
                          <div className="text-xs font-bold text-white font-data">{t('skuProposal.budget')}: {formatCurrency(totalBudget)}</div>
                        </div>
                      </div>
                    )}
                    {/* Group Total */}
                    <div className="text-right">
                      <div className="text-xs text-white/80 font-brand">{t('skuProposal.totalPlanned')}</div>
                      <div className="font-bold text-sm text-white font-data">
                        {formatCurrency(groupTotals.sum)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content - Collapsible */}
                {!isGroupCollapsed && (
                  <div>
                    {groupBrands.map((brand) => {
                      const isBrandCollapsed = collapsedBrands[brand.id];
                      const brandTotals = getBrandTotals(brand.id);

                      return (
                        <div key={brand.id} className="last:border-b-0 border-b border-[#E8E2DB]">
                          {/* Brand Header - Collapsible when multiple brands */}
                          {(!selectedBrand && groupBrands.length > 1) && (
                            <div
                              onClick={() => toggleBrandCollapse(brand.id)}
                              className="px-4 py-1.5 border-b flex items-center justify-between cursor-pointer transition-colors bg-gradient-to-r from-[rgba(196,151,90,0.05)] to-[rgba(196,151,90,0.1)] border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.18)]"
                            >
                              <div className="flex items-center gap-3">
                                <ChevronRight
                                  size={18}
                                  className={`transition-transform duration-200 text-[#8C8178] ${!isBrandCollapsed ? 'rotate-90' : ''}`}
                                />
                                <Tag size={16} className="text-[#8C8178]" />
                                <span className="font-semibold font-brand text-[#2C2417]">{brand.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-xs text-[#8C8178]">{t('proposal.rex')}: </span>
                                    <span className="text-sm font-medium font-data text-[#6B4D30]">{formatCurrency(brandTotals.rex)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-[#8C8178]">{t('proposal.ttp')}: </span>
                                    <span className="text-sm font-medium font-data text-[#6B4D30]">{formatCurrency(brandTotals.ttp)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-[#8C8178]">{t('skuProposal.total')}: </span>
                                    <span className="font-semibold font-data text-[#1B6B45]">{formatCurrency(brandTotals.sum)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Brand Table Content */}
                          {(!isBrandCollapsed || selectedBrand || groupBrands.length === 1) && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-[rgba(196,151,90,0.2)]">
                                    <th className="px-3 py-2 text-left text-xs font-semibold w-48 font-brand text-[#333333]">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp size={16} />
                                        {selectedBrand || groupBrands.length === 1 ? brand.name : ''} FY {selectedYear}
                                      </div>
                                    </th>
                                    {STORES.map((store) => (
                                      <th key={store.id} className="px-3 py-2 text-center text-xs font-semibold font-brand text-[#333333]">
                                        <div>{store.code}</div>
                                        <div className="text-xs font-normal font-data text-[#8C8178]">({storePercentages[store.id]}%)</div>
                                      </th>
                                    ))}
                                    <th className="px-3 py-2 text-center text-xs font-semibold font-brand text-[#333333]">{t('planning.totalValue')}</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold font-brand text-[#333333]">% MIX</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold w-24 font-brand text-[#333333]">{t('common.actions')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Render seasons based on selection */}
                                  {(selectedSeasonGroup ? [selectedSeasonGroup] : SEASON_GROUPS).map((seasonGroup) => (
                                    <Fragment key={`${brand.id}-${seasonGroup}`}>
                                      {/* Season Group Header */}
                                      <tr className="bg-[rgba(160,120,75,0.12)] border-b border-[#E8E2DB]">
                                        <td className="px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-1 h-4 rounded-full ${seasonGroup === 'SS' ? 'bg-[#D97706]' : 'bg-[#C4975A]'}`}></div>
                                            {seasonGroup === 'SS' ? (
                                              <Sun size={16} className="text-[#D97706]" />
                                            ) : (
                                              <Snowflake size={16} className="text-[#6B4D30]" />
                                            )}
                                            <span className="font-semibold font-brand text-[#2C2417]">{SEASON_CONFIG[seasonGroup]?.name}</span>
                                          </div>
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          <input
                                            type="text"
                                            value={formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'rex') || 0)}
                                            readOnly
                                            tabIndex={-1}
                                            className="w-full px-2 py-1 text-center border rounded-lg text-sm font-semibold font-data cursor-default border-[#E8E2DB] text-[#2C2417] bg-[rgba(160,120,75,0.12)]"
                                          />
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          <input
                                            type="text"
                                            value={formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'ttp') || 0)}
                                            readOnly
                                            tabIndex={-1}
                                            className="w-full px-2 py-1 text-center border rounded-lg text-sm font-semibold font-data cursor-default border-[#E8E2DB] text-[#2C2417] bg-[rgba(160,120,75,0.12)]"
                                          />

                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          <div className="px-2 py-1 border rounded-lg font-bold text-sm font-data bg-[rgba(160,120,75,0.18)] border-[rgba(196,151,90,0.4)] text-[#2C2417]">
                                            {formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'rex') + getSeasonTotalValue(brand.id, seasonGroup, 'ttp'))}
                                          </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-center text-sm font-semibold font-data text-[#8C8178]">
                                          {selectedSeasonGroup ? '100%' : `${calculateMix(getSeasonTotalValue(brand.id, seasonGroup, 'rex') + getSeasonTotalValue(brand.id, seasonGroup, 'ttp'), brand.id)}%`}
                                        </td>
                                        <td className="px-3 py-1.5"></td>
                                      </tr>

                                      {/* Sub-Season Rows */}
                                      {SEASON_CONFIG[seasonGroup]?.subSeasons.map((subSeason) => {
                                        const data = getBudgetData(brand.id, seasonGroup, subSeason);
                                        const mix = calculateMix(data.sum, brand.id);

                                        return (
                                          <tr key={`${brand.id}-${seasonGroup}-${subSeason}`} className="border-b transition-colors border-[#E8E2DB] hover:bg-[rgba(160,120,75,0.12)]">
                                            <td className="px-3 py-1.5 pl-10">
                                              <span className="font-medium text-[#8C8178]">{subSeason}</span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                              <input
                                                type="text"
                                                value={editingCell === `${brand.id}-${seasonGroup}-${subSeason}-rex` ? (data.rex || '') : formatCurrency(data.rex)}
                                                onChange={(e) => handleAllocationChange(brand.id, seasonGroup, subSeason, 'rex', e.target.value)}
                                                onFocus={() => setEditingCell(`${brand.id}-${seasonGroup}-${subSeason}-rex`)}
                                                onBlur={() => setEditingCell(null)}
                                                className="w-full px-2 py-1 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] font-medium font-data transition-colors border-[#E8E2DB] text-[#2C2417] bg-white hover:border-[rgba(196,151,90,0.4)]"
                                                placeholder="0"
                                              />
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                              <input
                                                type="text"
                                                value={editingCell === `${brand.id}-${seasonGroup}-${subSeason}-ttp` ? (data.ttp || '') : formatCurrency(data.ttp)}
                                                onChange={(e) => handleAllocationChange(brand.id, seasonGroup, subSeason, 'ttp', e.target.value)}
                                                onFocus={() => setEditingCell(`${brand.id}-${seasonGroup}-${subSeason}-ttp`)}
                                                onBlur={() => setEditingCell(null)}
                                                className="w-full px-2 py-1 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] font-medium font-data transition-colors border-[#E8E2DB] text-[#2C2417] bg-white hover:border-[rgba(196,151,90,0.4)]"
                                                placeholder="0"
                                              />
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                              <div className="px-2 py-1 border rounded-lg font-semibold text-sm font-data bg-[rgba(27,107,69,0.1)] border-[#1B6B45] text-[#1B6B45]">
                                                {formatCurrency(data.sum)}
                                              </div>
                                            </td>
                                            <td className="px-3 py-1.5 text-center text-sm font-data text-[#8C8178]">
                                              {mix}%
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                              <button
                                                onClick={() => {
                                                  if (onOpenOtbAnalysis) {
                                                    onOpenOtbAnalysis({
                                                      budgetId: selectedBudgetId,
                                                      budgetName: selectedBudget?.budgetName || fallbackBudgetName || null,
                                                      fiscalYear: selectedBudget?.fiscalYear || selectedYear,
                                                      brandName: selectedBudget?.brandName || brand?.name,
                                                      groupBrand: selectedBudget?.groupBrand || brand?.groupBrand,
                                                      totalBudget: selectedBudget?.totalBudget || 0,
                                                      status: selectedBudget?.status,
                                                      seasonGroup,
                                                      season: subSeason,
                                                      rex: data.rex,
                                                      ttp: data.ttp
                                                    });
                                                  }
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1B6B45] hover:bg-[#0d5a37] text-white rounded-md font-medium text-xs font-brand transition-colors"
                                              >
                                                <Edit size={14} />
                                                {t('nav.otbAnalysis') || 'OTB Planning'}
                                              </button>

                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </Fragment>
                                  ))}

                                  {/* Total Row */}
                                  <tr className="border-t-2 bg-[rgba(27,107,69,0.1)] border-[#1B6B45]">
                                    <td className="px-3 py-1.5">
                                      <span className="font-bold text-sm font-brand text-[#2C2417]">TOTAL</span>
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      <input
                                        type="text"
                                        value={formatCurrency(getBrandTotalValue(brand.id, 'rex') || 0)}
                                        readOnly
                                        tabIndex={-1}
                                        className="w-full px-2 py-1 text-center border rounded-lg text-sm font-bold font-data cursor-default border-[#1B6B45] text-[#1B6B45] bg-[rgba(27,107,69,0.15)]"
                                      />
                                    </td>

                                    <td className="px-2 py-1 text-center">
                                      <input
                                        type="text"
                                        value={formatCurrency(getBrandTotalValue(brand.id, 'ttp') || 0)}
                                        readOnly
                                        tabIndex={-1}
                                        className="w-full px-2 py-1 text-center border rounded-lg text-sm font-bold font-data cursor-default border-[#1B6B45] text-[#1B6B45] bg-[rgba(27,107,69,0.15)]"
                                      />
                                    </td>

                                    <td className="px-2 py-1 text-center">
                                      <div className="px-3 py-2 border rounded-lg font-bold text-lg font-data bg-[rgba(27,107,69,0.2)] border-[#1B6B45] text-[#1B6B45]">
                                        {formatCurrency(getBrandTotalValue(brand.id, 'rex') + getBrandTotalValue(brand.id, 'ttp'))}
                                      </div>
                                    </td>
                                    <td className="px-3 py-1.5 text-center text-sm font-bold font-data text-[#2C2417]">100%</td>
                                    <td className="px-3 py-1.5"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Allocation Progress Bar */}
      {selectedBudgetId && totalBudget > 0 && (
        <div className="mt-4 rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
          <AllocationProgressBar
            totalBudget={totalBudget}
            totalAllocated={totalAllocated}
            darkMode={darkMode}
          />
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#E8E2DB]">
            <div className="flex items-center gap-2">
              {autoSaving && <span className="text-xs text-[#8C8178] animate-pulse whitespace-nowrap">{t('planning.autoSaving') || 'Auto-saving…'}</span>}
              {!autoSaving && lastSavedAt && <span className="text-xs text-[#8C8178] whitespace-nowrap">{t('planning.saved') || 'Saved'} {lastSavedAt}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`p-1.5 rounded transition ${canUndo ? 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]' : 'text-[#E8E2DB] cursor-not-allowed'}`}
                title={t('common.undo') || 'Undo (Ctrl+Z)'}
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`p-1.5 rounded transition ${canRedo ? 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]' : 'text-[#E8E2DB] cursor-not-allowed'}`}
                title={t('common.redo') || 'Redo (Ctrl+Shift+Z)'}
              >
                <Redo2 size={14} />
              </button>
              <div className="w-px h-4 bg-[#E8E2DB]" />
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]"
                title={t('planning.exportExcel') || 'Export Excel'}
              >
                <Download size={12} />
                <span className="hidden md:inline">Excel</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={!isDirty || saving}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded transition ${
                  isDirty && !saving
                    ? 'bg-[#1B6B45] text-white hover:bg-[#0d5a37]'
                    : 'bg-[#E8E2DB] text-[#8C8178] cursor-not-allowed'
                }`}
              >
                {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t('planning.saveDraft') || 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      <UnsavedChangesBanner
        isDirty={isDirty}
        onSaveDraft={handleSaveDraft}
        onDiscard={discardChanges}
        saving={saving}
      />
    </>
  );
};

export default BudgetAllocateScreen;
