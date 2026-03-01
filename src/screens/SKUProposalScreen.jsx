'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, ChevronRight, Package, Pencil, X, Plus, Trash2,
  Star, Layers, Check, SlidersHorizontal, BarChart3, Ticket, ArrowLeft, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils';
import { budgetService, masterDataService, proposalService } from '../services';
import SizeCurveAdvisor from '../components/SizeCurveAdvisor';
import SkuRecommenderPanel from '../components/SkuRecommenderPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppContext } from '@/contexts/AppContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { MobileDataCard, MobileFilterSheet, ConfirmDialog, ProductPlaceholder } from '@/components/ui';
import FilterSelect from '@/components/ui/FilterSelect';

const SEASON_GROUPS = [
  { id: 'all', label: 'Season Group' },
  { id: 'SS', label: 'Spring Summer' },
  { id: 'FW', label: 'Fall Winter' }
];

const SEASONS = [
  { id: 'all', label: 'Season' },
  { id: 'Pre', label: 'Pre' },
  { id: 'Main/Show', label: 'Main/Show' }
];

// DAFC Design System card backgrounds - warm gold tints
const CARD_BG_CLASSES = [
  'bg-[rgba(160,120,75,0.12)] border-[rgba(196,151,90,0.3)]',
  'bg-[rgba(160,120,75,0.18)] border-[rgba(196,151,90,0.35)]',
  'bg-[rgba(27,107,69,0.08)] border-[rgba(27,107,69,0.2)]',
  'bg-[rgba(196,151,90,0.12)] border-[rgba(196,151,90,0.32)]',
  'bg-[rgba(27,107,69,0.06)] border-[rgba(27,107,69,0.18)]',
  'bg-[rgba(196,151,90,0.08)] border-[rgba(196,151,90,0.25)]'
];

const SIZING_CHOICES = [
  { id: 'choice-a', name: 'Choice A', isFinal: true },
  { id: 'choice-b', name: 'Choice B', isFinal: false },
  { id: 'choice-c', name: 'Choice C', isFinal: false },
];

const SKUProposalScreen = ({ skuContext, onContextUsed, onNavigateBack, onNavigateNext, darkMode = false }) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { registerSave, unregisterSave } = useAppContext();
  const { dialogProps, confirm } = useConfirmDialog();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingProposalId, setExistingProposalId] = useState(null);
  const [historicalProposal, setHistoricalProposal] = useState(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [showHistoricalBanner, setShowHistoricalBanner] = useState(false);
  // SKU catalog and proposal data from API
  const [skuCatalog, setSkuCatalog] = useState([]);
  const [skuDataLoading, setSkuDataLoading] = useState(true);

  // Master data for filters (genders, categories)
  const [masterGenders, setMasterGenders] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);

  // Fetch master data for filters
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [gendersRes, categoriesRes] = await Promise.all([
          masterDataService.getGenders().catch(() => []),
          masterDataService.getCategories().catch(() => [])
        ]);
        const genders = Array.isArray(gendersRes) ? gendersRes : (gendersRes?.data || []);
        setMasterGenders(genders.map(g => (g.name || g.code || '').toLowerCase()));
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        setMasterCategories(categories);
      } catch (err) {
        console.error('Failed to fetch master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch SKU catalog and proposals from API
  useEffect(() => {
    const fetchSkuData = async () => {
      setSkuDataLoading(true);
      try {
        const [catalogRes, proposalsRes] = await Promise.all([
          masterDataService.getSkuCatalog().catch(() => ({ data: [] })),
          proposalService.getAll().catch(() => ({ data: [] }))
        ]);

        // Transform SKU catalog
        const catalog = Array.isArray(catalogRes) ? catalogRes : (catalogRes?.data || []);
        setSkuCatalog(catalog.map(s => ({
          sku: s.skuCode || s.sku || s.code || s.id,
          name: s.productName || s.name,
          productType: s.productType || s.category || '',
          theme: s.theme || '',
          color: s.color || '',
          composition: s.composition || '',
          srp: Number(s.srp || s.unitCost) || 0,
          imageUrl: s.imageUrl || s.image || s.thumbnailUrl || null
        })));

        // Transform proposals into SKU blocks grouped by gender/category
        const proposals = Array.isArray(proposalsRes) ? proposalsRes : (proposalsRes?.data || []);
        const blocks = [];
        // Track proposal IDs by budgetId for existingProposalId resolution
        const proposalIdsByBudget = {};
        proposals.forEach(p => {
          const proposalBudgetId = p.budgetId || null;
          if (p.id && proposalBudgetId) {
            proposalIdsByBudget[proposalBudgetId] = p.id;
          }
          (p.products || []).forEach(prod => {
            const gender = (prod.gender || '').toLowerCase();
            const category = prod.category || '';
            const subCategory = prod.subCategory || '';
            let block = blocks.find(b => b.gender === gender && b.category === category && b.subCategory === subCategory && b.budgetId === proposalBudgetId);
            if (!block) {
              block = { gender, category, subCategory, budgetId: proposalBudgetId, items: [] };
              blocks.push(block);
            }
            block.items.push({
              sku: prod.skuCode || prod.sku,
              name: prod.productName || prod.name,
              productType: prod.productType || prod.subCategory || '',
              theme: prod.theme || '',
              color: prod.color || '',
              composition: prod.composition || '',
              unitCost: Number(prod.unitCost) || 0,
              srp: Number(prod.srp) || 0,
              order: prod.orderQty || 0,
              rex: prod.rex || 0,
              ttp: prod.ttp || 0,
              ttlValue: Number(prod.totalValue) || 0,
              customerTarget: prod.customerTarget || 'New',
              imageUrl: prod.imageUrl || prod.image || prod.thumbnailUrl || null
            });
          });
        });
        if (blocks.length > 0) {
          setSkuBlocks(blocks);
        }
        // If a budget is selected and a proposal exists for it, set existingProposalId
        if (budgetFilter !== 'all' && proposalIdsByBudget[budgetFilter]) {
          setExistingProposalId(proposalIdsByBudget[budgetFilter]);
        }
        // Also store the mapping for later budget filter changes
        proposalIdsByBudgetRef.current = proposalIdsByBudget;
      } catch (err) {
        console.error('Failed to fetch SKU data:', err);
      } finally {
        setSkuDataLoading(false);
      }
    };
    fetchSkuData();
  }, []);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({ status: 'APPROVED' });
      const budgetList = (response.data || response || []).map(budget => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.brandId,
        brandName: budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: budget.totalAmount || budget.totalBudget || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || `Budget #${budget.id}`,
        status: (budget.status || 'DRAFT').toLowerCase()
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

  const [fyFilter, setFyFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [seasonGroupFilter, setSeasonGroupFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  const [collapsed, setCollapsed] = useState({});
  const [contextBanner, setContextBanner] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [cardDetailsOpen, setCardDetailsOpen] = useState({});
  const [cardStoreOrderOpen, setCardStoreOrderOpen] = useState({});
  const [cardSizingOpen, setCardSizingOpen] = useState({});
  const [skuVersion, setSkuVersion] = useState(null);
  const [skuVersions, setSkuVersions] = useState([]);
  const [isSkuVersionOpen, setIsSkuVersionOpen] = useState(false);
  const [sizingVersion, setSizingVersion] = useState('choice-a');
  const [sizingChoices, setSizingChoices] = useState(SIZING_CHOICES);
  const [isSizingVersionOpen, setIsSizingVersionOpen] = useState(false);
  const skuVersionDropdownRef = useRef(null);
  const sizingVersionDropdownRef = useRef(null);
  const proposalIdsByBudgetRef = useRef({});

  // Close version dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (skuVersionDropdownRef.current && !skuVersionDropdownRef.current.contains(e.target)) {
        setIsSkuVersionOpen(false);
      }
      if (sizingVersionDropdownRef.current && !sizingVersionDropdownRef.current.contains(e.target)) {
        setIsSizingVersionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch SKU versions from API based on selected budget
  useEffect(() => {
    const fetchVersions = async () => {
      const budgetId = budgetFilter !== 'all' ? budgetFilter : null;
      if (!budgetId) {
        setSkuVersions([]);
        setSkuVersion(null);
        return;
      }
      try {
        const response = await proposalService.getAll({ budgetId });
        const list = Array.isArray(response) ? response : (response?.data || []);
        const mapped = list.map(v => ({
          id: v.id,
          name: v.name || v.versionName || `Version ${v.versionNumber || v.id}`,
          createdAt: v.createdAt,
          isFinal: v.isFinal || v.status === 'FINAL' || false,
        }));
        setSkuVersions(mapped);
        // Auto-select final version or first available
        const finalV = mapped.find(v => v.isFinal);
        setSkuVersion(finalV ? finalV.id : (mapped[0]?.id || null));
      } catch (err) {
        console.error('Failed to fetch SKU versions:', err);
      }
    };
    fetchVersions();
  }, [budgetFilter]);

  // Update existingProposalId when budget filter changes
  useEffect(() => {
    if (budgetFilter !== 'all' && proposalIdsByBudgetRef.current[budgetFilter]) {
      setExistingProposalId(proposalIdsByBudgetRef.current[budgetFilter]);
    } else {
      setExistingProposalId(null);
    }
  }, [budgetFilter]);

  // SP-3 + SP-7: Fetch historical/previous year template when budget selected and no existing proposal
  useEffect(() => {
    if (budgetFilter === 'all' || existingProposalId) {
      setShowHistoricalBanner(false);
      setHistoricalProposal(null);
      return;
    }
    const selectedBudget = apiBudgets.find(b => String(b.id) === String(budgetFilter));
    if (!selectedBudget) return;

    const fetchHistorical = async () => {
      setLoadingHistorical(true);
      try {
        const result = await proposalService.getHistorical({
          fiscalYear: selectedBudget.fiscalYear,
          seasonGroupId: seasonGroupFilter !== 'all' ? seasonGroupFilter : undefined,
          seasonType: seasonFilter !== 'all' ? seasonFilter : undefined,
          brandId: selectedBudget.brandId,
        });
        if (result && (result.products?.length > 0 || result.id)) {
          setHistoricalProposal(result);
          setShowHistoricalBanner(true);
        } else {
          setHistoricalProposal(null);
          setShowHistoricalBanner(false);
        }
      } catch (err) {
        console.error('Failed to fetch historical proposal:', err);
        setHistoricalProposal(null);
        setShowHistoricalBanner(false);
      } finally {
        setLoadingHistorical(false);
      }
    };
    fetchHistorical();
  }, [budgetFilter, existingProposalId, apiBudgets, seasonGroupFilter, seasonFilter]);

  // Handle "Use as Template" - copy historical proposal data into current skuBlocks
  const handleUseAsTemplate = useCallback(() => {
    if (!historicalProposal?.products?.length) return;
    const blocks = [];
    historicalProposal.products.forEach(prod => {
      const gender = (prod.gender || '').toLowerCase();
      const category = prod.category || '';
      const subCategory = prod.subCategory || '';
      const blockBudgetId = budgetFilter !== 'all' ? budgetFilter : null;
      let block = blocks.find(b => b.gender === gender && b.category === category && b.subCategory === subCategory);
      if (!block) {
        block = { gender, category, subCategory, budgetId: blockBudgetId, items: [] };
        blocks.push(block);
      }
      block.items.push({
        sku: prod.skuCode || prod.sku || '',
        name: prod.productName || prod.name || '',
        productType: prod.productType || prod.subCategory || '',
        theme: prod.theme || '',
        color: prod.color || '',
        composition: prod.composition || '',
        unitCost: Number(prod.unitCost) || 0,
        srp: Number(prod.srp) || 0,
        order: prod.orderQty || 0,
        rex: prod.rex || 0,
        ttp: prod.ttp || 0,
        ttlValue: Number(prod.totalValue) || 0,
        customerTarget: prod.customerTarget || 'New',
        imageUrl: prod.imageUrl || prod.image || prod.thumbnailUrl || null,
      });
    });
    setSkuBlocks(blocks);
    setShowHistoricalBanner(false);
    toast.success(t('proposal.templateApplied') || 'Previous year template applied');
  }, [historicalProposal, budgetFilter, t]);

  const handleSetFinalVersion = (versionId, e) => {
    e.stopPropagation();
    setSkuVersions(prev => prev.map(v => ({ ...v, isFinal: v.id === versionId })));
  };

  const handleSetFinalSizing = (choiceId, e) => {
    e.stopPropagation();
    setSizingChoices(prev => prev.map(c => ({ ...c, isFinal: c.id === choiceId })));
  };

  const selectedSkuVersion = skuVersions.find(v => v.id === skuVersion) || skuVersions[0];
  const selectedSizingChoice = sizingChoices.find(c => c.id === sizingVersion) || sizingChoices[0];

  // Apply context from OTB Analysis when navigating here
  useEffect(() => {
    if (skuContext) {
      // Set filters based on context
      if (skuContext.budgetId) {
        setBudgetFilter(skuContext.budgetId);
      }
      if (skuContext.seasonGroup) {
        setSeasonGroupFilter(skuContext.seasonGroup);
      }
      if (skuContext.season) {
        setSeasonFilter(skuContext.season);
      }
      // Use lowercase gender id to match SKU data (e.g., 'female', 'male')
      if (skuContext.gender?.id) {
        setGenderFilter(skuContext.gender.id.toLowerCase());
      }
      // Use category name to match SKU data (e.g., 'RTW', 'Accessories')
      if (skuContext.category?.name) {
        setCategoryFilter(skuContext.category.name);
      }
      // Use subCategory name to match SKU data (e.g., 'W Outerwear', 'M Bags')
      if (skuContext.subCategory?.name) {
        setSubCategoryFilter(skuContext.subCategory.name);
      }

      // Set banner info
      setContextBanner({
        budgetName: skuContext.budgetName,
        fiscalYear: skuContext.fiscalYear,
        brandName: skuContext.brandName,
        seasonGroup: skuContext.seasonGroup,
        season: skuContext.season,
        gender: skuContext.gender?.name,
        category: skuContext.category?.name,
        subCategory: skuContext.subCategory?.name,
        otbData: skuContext.otbData
      });

      // Clear context after use
      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [skuContext, onContextUsed]);
  const [skuBlocks, setSkuBlocks] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sizingPopup, setSizingPopup] = useState({ open: false, blockKey: null, itemIdx: null, item: null });
  const [sizingData, setSizingData] = useState({});

  const getDefaultSizing = () => ({
    choiceA: { s0002: 0, s0004: 3, s0006: 3, s0008: 2 },
    choiceB: { s0002: 0, s0004: 2, s0006: 2, s0008: 2 },
    choiceC: { s0002: 0, s0004: 2, s0006: 1, s0008: 1 }
  });

  const getSizingKey = (blockKey, itemIdx) => `${blockKey}_${itemIdx}`;

  const getSizing = (blockKey, itemIdx) => {
    const key = getSizingKey(blockKey, itemIdx);
    return sizingData[key] || getDefaultSizing();
  };

  const updateSizing = (blockKey, itemIdx, choice, size, value) => {
    const key = getSizingKey(blockKey, itemIdx);
    const currentSizing = sizingData[key] || getDefaultSizing();
    setSizingData(prev => ({
      ...prev,
      [key]: {
        ...currentSizing,
        [choice]: {
          ...currentSizing[choice],
          [size]: parseInt(value) || 0
        }
      }
    }));
  };

  const calculateSum = (choiceData) => {
    return Object.values(choiceData).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  };

  const choiceIdToKey = (id) => {
    if (id === 'choice-a') return 'choiceA';
    if (id === 'choice-b') return 'choiceB';
    if (id === 'choice-c') return 'choiceC';
    return 'choiceA';
  };

  // Check if sizing is complete for a given SKU item (any final choice has non-zero quantities)
  const isSizingComplete = (blockKey, itemIdx) => {
    const sizing = getSizing(blockKey, itemIdx);
    const finalChoice = sizingChoices.find(c => c.isFinal);
    if (!finalChoice) return false;
    const choiceKey = choiceIdToKey(finalChoice.id);
    const choiceData = sizing[choiceKey];
    return choiceData && Object.values(choiceData).some(v => parseInt(v) > 0);
  };

  const handleOpenSizing = (blockKey, itemIdx, item) => {
    setSizingPopup({ open: true, blockKey, itemIdx, item });
  };

  const handleCloseSizing = () => {
    setSizingPopup({ open: false, blockKey: null, itemIdx: null, item: null });
  };

  const fyOptions = useMemo(() => {
    const years = [...new Set(apiBudgets.map(b => b.fiscalYear))].sort();
    return [{ id: 'all', label: 'FY' }, ...years.map(y => ({ id: String(y), label: `FY${y}` }))];
  }, [apiBudgets]);

  const brandOptions = useMemo(() => {
    const brands = [];
    const seen = new Set();
    apiBudgets.forEach(b => {
      const key = b.brandId || b.brandName;
      if (key && !seen.has(key)) {
        seen.add(key);
        brands.push({ id: key, label: b.brandName || key });
      }
    });
    return [{ id: 'all', label: 'Brand' }, ...brands];
  }, [apiBudgets]);

  const budgetOptions = useMemo(() => {
    const options = [{ id: 'all', label: 'All Budgets' }];
    apiBudgets
      .filter(b => fyFilter === 'all' || String(b.fiscalYear) === String(fyFilter))
      .filter(b => brandFilter === 'all' || b.brandId === brandFilter || b.brandName === brandFilter)
      .forEach(b => options.push({ id: b.id, label: b.budgetName }));
    return options;
  }, [apiBudgets, fyFilter, brandFilter]);

  const genderOptions = useMemo(() => {
    const fromBlocks = skuBlocks.map(s => s.gender).filter(Boolean);
    const fromMaster = masterGenders.filter(Boolean);
    const genders = new Set([...fromBlocks, ...fromMaster]);
    return ['all', ...Array.from(genders)];
  }, [skuBlocks, masterGenders]);

  const categoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter(s => genderFilter === 'all' || s.gender === genderFilter)
      .map(s => s.category)
      .filter(Boolean);
    const fromMaster = masterCategories.map(c => c.name || c.code || '').filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, skuBlocks, masterCategories]);

  const subCategoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter(s => (genderFilter === 'all' || s.gender === genderFilter)
        && (categoryFilter === 'all' || s.category === categoryFilter))
      .map(s => s.subCategory)
      .filter(Boolean);
    // Also extract sub-categories from master data
    const fromMaster = masterCategories
      .flatMap(c => (c.subCategories || []).map(sc => sc.name || sc.code || ''))
      .filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, categoryFilter, skuBlocks, masterCategories]);

  // Memoized FilterSelect option arrays — avoid creating new arrays every render
  const memoFyOptions = useMemo(() =>
    fyOptions.map(opt => ({ value: String(opt.id), label: opt.label })), [fyOptions]);
  const memoBudgetOptions = useMemo(() =>
    budgetOptions.map(opt => ({ value: String(opt.id), label: opt.label })), [budgetOptions]);
  const memoSeasonGroupOptions = useMemo(() =>
    SEASON_GROUPS.map(opt => ({ value: opt.id, label: opt.label })), []);
  const memoSeasonOptions = useMemo(() =>
    SEASONS.map(opt => ({ value: opt.id, label: opt.label })), []);
  const memoBrandOptions = useMemo(() =>
    brandOptions.map(opt => ({ value: String(opt.id), label: opt.label })), [brandOptions]);
  const memoGenderOptions = useMemo(() =>
    genderOptions.map(g => ({ value: g, label: g === 'all' ? t('skuProposal.gender') : g })), [genderOptions, t]);
  const memoCategoryOptions = useMemo(() =>
    categoryOptions.map(c => ({ value: c, label: c === 'all' ? t('skuProposal.category') : c })), [categoryOptions, t]);
  const memoSubCategoryOptions = useMemo(() =>
    subCategoryOptions.map(s => ({ value: s, label: s === 'all' ? t('skuProposal.subCategory') : s })), [subCategoryOptions, t]);

  const filteredSkuBlocks = useMemo(() => {
    return skuBlocks.filter(block => {
      if (budgetFilter !== 'all' && block.budgetId && block.budgetId !== budgetFilter) return false;
      if (genderFilter !== 'all' && block.gender !== genderFilter) return false;
      if (categoryFilter !== 'all' && block.category !== categoryFilter) return false;
      if (subCategoryFilter !== 'all' && block.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [budgetFilter, genderFilter, categoryFilter, subCategoryFilter, skuBlocks]);

  // Card view available when there's data to show
  const canShowCardView = filteredSkuBlocks.length > 0 && filteredSkuBlocks.some(b => b.items.length > 0);

  const handleStartEdit = (cellKey, currentValue) => {
    setEditingCell(cellKey);
    setEditValue(currentValue?.toString() ?? '');
  };

  const handleSaveEdit = (cellKey) => {
    const value = Number(editValue);
    const nextValue = Number.isFinite(value) ? value : 0;
    const [blockKey, itemIdx, field] = cellKey.split('|');

    setSkuBlocks(prev => prev.map(block => {
      const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item, idx) => {
        if (String(idx) !== itemIdx) return item;
        return { ...item, [field]: nextValue };
      });
      return { ...block, items };
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

  const handleSelectChange = (blockKey, itemIdx, field, value) => {
    setSkuBlocks(prev => prev.map(block => {
      const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item, idx) => {
        if (String(idx) !== String(itemIdx)) return item;
        return { ...item, [field]: value };
      });
      return { ...block, items };
    }));
  };

  const handleNumberChange = (blockKey, itemIdx, field, value) => {
    const nextValue = Number(value);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    setSkuBlocks(prev => prev.map(block => {
      const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item, idx) => {
        if (String(idx) !== String(itemIdx)) return item;
        return { ...item, [field]: safeValue };
      });
      return { ...block, items };
    }));
  };

  const handleToggle = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddSkuRow = (blockKey) => {
    setSkuBlocks(prev => prev.map(block => {
      const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      if (key !== blockKey) return block;
      const newItem = {
        sku: '',
        name: '',
        productType: block.subCategory.toUpperCase(),
        theme: '',
        color: '',
        composition: '',
        unitCost: 0,
        srp: 0,
        order: 0,
        rex: 0,
        ttp: 0,
        ttlValue: 0,
        customerTarget: 'New',
        isNew: true
      };
      return { ...block, items: [...block.items, newItem] };
    }));
  };

  const handleSkuSelect = (blockKey, itemIdx, selectedSku) => {
    const skuData = skuCatalog.find(s => s.sku === selectedSku);
    if (!skuData) return;

    setSkuBlocks(prev => prev.map(block => {
      const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item, idx) => {
        if (idx !== itemIdx) return item;
        return {
          ...item,
          sku: skuData.sku,
          name: skuData.name,
          productType: skuData.productType,
          theme: skuData.theme,
          color: skuData.color,
          composition: skuData.composition,
          srp: skuData.srp,
          isNew: false
        };
      });
      return { ...block, items };
    }));
  };

  const handleDeleteSkuRow = useCallback((blockKey, itemIdx, skuName) => {
    confirm({
      title: t('proposal.removeSku') || 'Remove SKU',
      message: `${t('proposal.removeSkuConfirm') || 'Remove'} ${skuName || `SKU #${itemIdx + 1}`}?`,
      confirmLabel: t('common.delete') || 'Remove',
      variant: 'danger',
      onConfirm: () => {
        setSkuBlocks(prev => prev.map(block => {
          const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
          if (key !== blockKey) return block;
          const items = block.items.filter((_, idx) => idx !== itemIdx);
          return { ...block, items };
        }));
      },
    });
  }, [confirm, t]);

  // Toggle all blocks collapsed/expanded
  const handleToggleAll = useCallback(() => {
    setAllCollapsed(prev => {
      const newState = !prev;
      const keys = {};
      filteredSkuBlocks.forEach(block => {
        const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
        keys[key] = newState;
      });
      setCollapsed(keys);
      return newState;
    });
  }, [filteredSkuBlocks]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const rows = [];
    rows.push(['Gender', 'Category', 'Sub-Category', 'SKU', 'Product Name', 'Color', 'Unit Cost', 'Order', 'REX', 'TTP', 'Total Value', 'Customer Target'].join(','));
    filteredSkuBlocks.forEach(block => {
      block.items.forEach(item => {
        rows.push([
          block.gender, block.category, block.subCategory,
          item.sku, `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.color || '').replace(/"/g, '""')}"`,
          item.unitCost, item.order, item.rex || 0, item.ttp || 0,
          item.ttlValue, item.customerTarget || ''
        ].join(','));
      });
    });
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DAFC_SKU_Proposal_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.exported') || 'Exported successfully');
  }, [filteredSkuBlocks, t]);

  // Save proposal data to backend (SP-1: atomic save via saveFullProposal for existing proposals)
  const handleSaveProposal = useCallback(async () => {
    if (skuBlocks.length === 0) return;
    setSaving(true);
    try {
      // Build products from all blocks
      const products = skuBlocks.flatMap(block =>
        block.items.filter(item => item.sku).map(item => ({
          skuCode: item.sku,
          productName: item.name,
          gender: block.gender,
          category: block.category,
          subCategory: block.subCategory,
          productType: item.productType,
          color: item.color,
          composition: item.composition,
          unitCost: item.unitCost,
          orderQty: item.order || 0,
          rex: item.rex || 0,
          ttp: item.ttp || 0,
          totalValue: item.ttlValue || 0,
          customerTarget: item.customerTarget || 'New',
        }))
      );

      if (existingProposalId) {
        // Atomic save: replace all products in existing proposal
        await proposalService.saveFullProposal(existingProposalId, { products });
      } else {
        // Create new proposal
        const proposalData = {
          budgetId: budgetFilter !== 'all' ? budgetFilter : undefined,
          products,
        };
        const created = await proposalService.create(proposalData);
        // Track the newly created proposal ID for subsequent saves
        if (created?.id) {
          setExistingProposalId(created.id);
          if (budgetFilter !== 'all') {
            proposalIdsByBudgetRef.current[budgetFilter] = created.id;
          }
        }
      }
      toast.success(t('proposal.savedSuccessfully') || 'Proposal saved');
    } catch (err) {
      console.error('Failed to save proposal:', err);
      toast.error(t('approval.failedToSave') || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [skuBlocks, budgetFilter, existingProposalId, t]);

  // Register save handler with AppContext
  useEffect(() => {
    if (registerSave) {
      registerSave(handleSaveProposal);
      return () => unregisterSave?.();
    }
  }, [handleSaveProposal, registerSave, unregisterSave]);

  const filteredSkuItems = useMemo(() => {
    return filteredSkuBlocks.flatMap(block => {
      const blockKey = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
      return block.items.map((item, idx) => ({
        block,
        blockKey,
        item,
        idx,
        key: `${blockKey}_${item.sku || 'new'}_${idx}`
      }));
    });
  }, [filteredSkuBlocks]);

  const getCardBgClass = (index) => {
    return CARD_BG_CLASSES[index % CARD_BG_CLASSES.length];
  };

  return (
    <div className="space-y-5 pb-14">
      {/* Unified Toolbar: Filters + Version + View Toggle */}
      <div className="rounded-xl border border-border-muted bg-white">
        {/* Row 1: Filters */}
        {isMobile ? (
          <div className="px-3 py-2 space-y-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-border-muted text-xs font-medium font-brand transition-colors text-[#7D5A28] active:bg-surface-secondary"
            >
              <SlidersHorizontal size={14} />
              <span>{t('skuProposal.filters')}</span>
              {(fyFilter !== 'all' || budgetFilter !== 'all' || seasonGroupFilter !== 'all' || seasonFilter !== 'all' || brandFilter !== 'all' || genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
                <span className="ml-1 w-4 h-4 rounded-full bg-dafc-gold text-white text-[9px] font-bold flex items-center justify-center">
                  {[fyFilter, budgetFilter, seasonGroupFilter, seasonFilter, brandFilter, genderFilter, categoryFilter, subCategoryFilter].filter(f => f !== 'all').length}
                </span>
              )}
            </button>
            {(fyFilter !== 'all' || budgetFilter !== 'all' || brandFilter !== 'all' || genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
              <div className="flex flex-wrap gap-1.5">
                {fyFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {fyOptions.find(o => String(o.id) === String(fyFilter))?.label || fyFilter}
                    <button onClick={() => setFyFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {budgetFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {budgetOptions.find(b => String(b.id) === String(budgetFilter))?.label || budgetFilter}
                    <button onClick={() => setBudgetFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {brandFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {brandOptions.find(o => String(o.id) === String(brandFilter))?.label || brandFilter}
                    <button onClick={() => setBrandFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {genderFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {genderFilter}
                    <button onClick={() => setGenderFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {categoryFilter}
                    <button onClick={() => setCategoryFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {subCategoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(160,120,75,0.1)] text-[#7D5A28]">
                    {subCategoryFilter}
                    <button onClick={() => setSubCategoryFilter('all')} className="ml-0.5"><X size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5">
          <div className="shrink-0">
            <FilterSelect
              options={memoFyOptions}
              value={String(fyFilter)}
              onChange={(v) => setFyFilter(v)}
              placeholder="FY"
              searchable={false}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoBudgetOptions}
              value={String(budgetFilter)}
              onChange={(v) => setBudgetFilter(v)}
              placeholder={t('skuProposal.allBudgets')}
              searchable={budgetOptions.length > 6}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoSeasonGroupOptions}
              value={seasonGroupFilter}
              onChange={(v) => setSeasonGroupFilter(v)}
              placeholder={t('skuProposal.seasonGroup')}
              searchable={false}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoSeasonOptions}
              value={seasonFilter}
              onChange={(v) => setSeasonFilter(v)}
              placeholder={t('skuProposal.season')}
              searchable={false}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoBrandOptions}
              value={String(brandFilter)}
              onChange={(v) => setBrandFilter(v)}
              placeholder="Brand"
              searchable={brandOptions.length > 6}
              compact
            />
          </div>
          <div className="h-4 w-px shrink-0 bg-border-muted" />
          <div className="shrink-0">
            <FilterSelect
              options={memoGenderOptions}
              value={genderFilter}
              onChange={(v) => setGenderFilter(v)}
              placeholder={t('skuProposal.gender')}
              searchable={false}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoCategoryOptions}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              placeholder={t('skuProposal.category')}
              searchable={false}
              compact
            />
          </div>
          <div className="shrink-0">
            <FilterSelect
              options={memoSubCategoryOptions}
              value={subCategoryFilter}
              onChange={(v) => setSubCategoryFilter(v)}
              placeholder={t('skuProposal.subCategory')}
              searchable={false}
              compact
            />
          </div>
        </div>
        )}

        {/* Mobile Filter Sheet */}
        {isMobile && (
          <MobileFilterSheet
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            darkMode={darkMode}
            title={t('skuProposal.filters')}
            filters={[
              { key: 'fy', label: 'Fiscal Year', type: 'select', options: fyOptions.map(o => ({ value: String(o.id), label: o.label })), defaultValue: 'all' },
              { key: 'budget', label: t('skuProposal.budget'), type: 'select', options: budgetOptions.map(b => ({ value: String(b.id), label: b.label })), defaultValue: 'all' },
              { key: 'seasonGroup', label: t('skuProposal.seasonGroup'), type: 'select', options: SEASON_GROUPS.map(s => ({ value: s.id, label: s.label })), defaultValue: 'all' },
              { key: 'season', label: t('skuProposal.season'), type: 'select', options: SEASONS.map(s => ({ value: s.id, label: s.label })), defaultValue: 'all' },
              { key: 'brand', label: 'Brand', type: 'select', options: brandOptions.map(o => ({ value: String(o.id), label: o.label })), defaultValue: 'all' },
              { key: 'gender', label: t('skuProposal.gender'), type: 'select', options: genderOptions.map(g => ({ value: g, label: g === 'all' ? t('skuProposal.gender') : g })), defaultValue: 'all' },
              { key: 'category', label: t('skuProposal.category'), type: 'select', options: categoryOptions.map(c => ({ value: c, label: c === 'all' ? t('skuProposal.category') : c })), defaultValue: 'all' },
              { key: 'subCategory', label: t('skuProposal.subCategory'), type: 'select', options: subCategoryOptions.map(s => ({ value: s, label: s === 'all' ? t('skuProposal.subCategory') : s })), defaultValue: 'all' },
            ]}
            values={{
              fy: String(fyFilter),
              budget: String(budgetFilter),
              seasonGroup: seasonGroupFilter,
              season: seasonFilter,
              brand: String(brandFilter),
              gender: genderFilter,
              category: categoryFilter,
              subCategory: subCategoryFilter,
            }}
            onApply={(v) => {
              setFyFilter(v.fy || 'all');
              setBudgetFilter(v.budget || 'all');
              setSeasonGroupFilter(v.seasonGroup || 'all');
              setSeasonFilter(v.season || 'all');
              setBrandFilter(v.brand || 'all');
              setGenderFilter(v.gender || 'all');
              setCategoryFilter(v.category || 'all');
              setSubCategoryFilter(v.subCategory || 'all');
            }}
            onReset={() => {
              setFyFilter('all');
              setBudgetFilter('all');
              setSeasonGroupFilter('all');
              setSeasonFilter('all');
              setBrandFilter('all');
              setGenderFilter('all');
              setCategoryFilter('all');
              setSubCategoryFilter('all');
            }}
          />
        )}

        {/* Row 2: Version + Sizing + View Toggle — single compact row */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-t border-border-muted">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted shrink-0">{t('skuProposal.version')}</span>
          <div className="relative" ref={skuVersionDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSkuVersionOpen(!isSkuVersionOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border border-border-muted text-content hover:bg-surface-secondary"
            >
              {selectedSkuVersion?.isFinal && <Star size={11} className="text-dafc-gold fill-dafc-gold" />}
              <span>{selectedSkuVersion?.name || t('common.version')}</span>
              {selectedSkuVersion?.isFinal && (
                <span className="px-1 py-px text-[8px] font-bold rounded bg-dafc-gold text-white leading-none">FINAL</span>
              )}
              <ChevronDown size={11} className={`transition-transform text-content-muted ${isSkuVersionOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSkuVersionOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-md border z-50 overflow-hidden bg-white border-border-muted">
                <div className="px-3 py-1.5 border-b border-border-muted bg-surface-secondary">
                  <span className="text-[10px] font-semibold uppercase tracking-wider font-brand text-content-muted">{t('common.version')}</span>
                </div>
                {skuVersions.map(version => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => { setSkuVersion(version.id); setIsSkuVersionOpen(false); }}
                    className={`w-full px-3 py-2 flex items-center justify-between transition-colors text-xs ${
                      version.id === skuVersion ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {version.isFinal
                        ? <Star size={12} className="text-dafc-gold fill-dafc-gold" />
                        : <Layers size={12} className="text-content-muted" />
                      }
                      <span className="font-medium text-content">{version.name}</span>
                      {version.isFinal && (
                        <span className="text-[9px] font-bold px-1 py-px rounded bg-[rgba(27,107,69,0.15)] text-[#1B6B45] leading-none">FINAL</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!version.isFinal && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSetFinalVersion(version.id, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalVersion(version.id, e); }}
                          className="text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer text-dafc-gold hover:bg-surface-secondary"
                        >
                          {t('planning.latestVersion')}
                        </span>
                      )}
                      {version.id === skuVersion && <Check size={13} className="text-[#1B6B45]" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px shrink-0 bg-border-muted" />

          <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted shrink-0">{t('skuProposal.sizingChoice')}</span>
          <div className="relative" ref={sizingVersionDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSizingVersionOpen(!isSizingVersionOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border border-border-muted text-content hover:bg-surface-secondary"
            >
              {selectedSizingChoice?.isFinal && <Star size={11} className="text-dafc-gold fill-dafc-gold" />}
              <span>{selectedSizingChoice?.name || t('skuProposal.sizing')}</span>
              {selectedSizingChoice?.isFinal && (
                <span className="px-1 py-px text-[8px] font-bold rounded bg-dafc-gold text-white leading-none">FINAL</span>
              )}
              <ChevronDown size={11} className={`transition-transform text-content-muted ${isSizingVersionOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSizingVersionOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-lg shadow-md border z-50 overflow-hidden bg-white border-border-muted">
                <div className="px-3 py-1.5 border-b border-border-muted bg-surface-secondary">
                  <span className="text-[10px] font-semibold uppercase tracking-wider font-brand text-content-muted">{t('skuProposal.sizing')}</span>
                </div>
                {sizingChoices.map(choice => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => { setSizingVersion(choice.id); setIsSizingVersionOpen(false); }}
                    className={`w-full px-3 py-2 flex items-center justify-between transition-colors text-xs ${
                      choice.id === sizingVersion ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {choice.isFinal
                        ? <Star size={12} className="text-dafc-gold fill-dafc-gold" />
                        : <Layers size={12} className="text-content-muted" />
                      }
                      <span className="font-medium text-content">{choice.name}</span>
                      {choice.isFinal && (
                        <span className="text-[9px] font-bold px-1 py-px rounded bg-[rgba(27,107,69,0.15)] text-[#1B6B45] leading-none">FINAL</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!choice.isFinal && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSetFinalSizing(choice.id, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalSizing(choice.id, e); }}
                          className="text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer text-dafc-gold hover:bg-surface-secondary"
                        >
                          {t('planning.latestVersion')}
                        </span>
                      )}
                      {choice.id === sizingVersion && <Check size={13} className="text-[#1B6B45]" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer + Actions + SKU count + View Toggle */}
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleToggleAll}
            className="px-2 py-1 rounded-md text-[10px] font-medium font-brand transition-colors text-content-muted hover:text-content hover:bg-surface-secondary"
          >
            {allCollapsed ? (t('skuProposal.expandAll') || 'Expand All') : (t('skuProposal.collapseAll') || 'Collapse All')}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2 py-1 rounded-md text-[10px] font-medium font-brand transition-colors text-content-muted hover:text-content hover:bg-surface-secondary"
          >
            {t('common.export') || 'Export CSV'}
          </button>
          <span className="text-[10px] text-content-muted font-data shrink-0">
            {filteredSkuItems.length} SKUs
          </span>
          <div className="hidden md:flex items-center gap-0.5 rounded-md p-0.5 bg-surface-secondary">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-content shadow-sm'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => canShowCardView && setViewMode('card')}
              disabled={!canShowCardView}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-white text-content shadow-sm'
                  : 'text-content-muted hover:text-content'
              } ${!canShowCardView ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Card
            </button>
          </div>
        </div>
      </div>

      {/* AI SKU Recommender Panel */}
      {budgetFilter !== 'all' && categoryFilter !== 'all' && (
        <SkuRecommenderPanel
          budgetDetailId={budgetFilter}
          category={categoryFilter}
          subCategory={subCategoryFilter !== 'all' ? subCategoryFilter : undefined}
          budgetAmount={
            (apiBudgets.find(b => String(b.id) === String(budgetFilter))?.totalBudget) || 0
          }
          seasonGroup={seasonGroupFilter !== 'all' ? seasonGroupFilter : undefined}
          fiscalYear={
            contextBanner?.fiscalYear ||
            (apiBudgets.find(b => String(b.id) === String(budgetFilter))?.fiscalYear) ||
            undefined
          }
          storeId="all"
          proposalId={budgetFilter}
          existingSkuIds={skuBlocks.flatMap(b => b.items.map(i => i.sku)).filter(Boolean)}
          onSkusAdded={(addedSkus) => {
            toast.success(`${addedSkus.length} SKU${addedSkus.length !== 1 ? 's' : ''} added to proposal`);
            // Re-fetch proposal data to reflect added SKUs
            const refetch = async () => {
              try {
                const proposalsRes = await proposalService.getAll();
                const proposals = Array.isArray(proposalsRes) ? proposalsRes : (proposalsRes?.data || []);
                const blocks = [];
                proposals.forEach(p => {
                  (p.products || []).forEach(prod => {
                    const gender = (prod.gender || '').toLowerCase();
                    const cat = prod.category || '';
                    const sub = prod.subCategory || '';
                    let block = blocks.find(bl => bl.gender === gender && bl.category === cat && bl.subCategory === sub);
                    if (!block) {
                      block = { gender, category: cat, subCategory: sub, items: [] };
                      blocks.push(block);
                    }
                    block.items.push({
                      sku: prod.skuCode || prod.sku,
                      name: prod.productName || prod.name,
                      productType: prod.productType || prod.subCategory || '',
                      theme: prod.theme || '',
                      color: prod.color || '',
                      composition: prod.composition || '',
                      unitCost: Number(prod.unitCost) || 0,
                      srp: Number(prod.srp) || 0,
                      order: prod.orderQty || 0,
                      rex: prod.rex || 0,
                      ttp: prod.ttp || 0,
                      ttlValue: Number(prod.totalValue) || 0,
                      customerTarget: prod.customerTarget || 'New'
                    });
                  });
                });
                if (blocks.length > 0) setSkuBlocks(blocks);
              } catch (err) {
                console.error('Failed to refresh proposals:', err);
              }
            };
            refetch();
          }}
          darkMode={darkMode}
        />
      )}

      {/* SP-3 + SP-7: Historical / Previous Year Template Banner */}
      {showHistoricalBanner && historicalProposal && (
        <div className="rounded-xl border overflow-hidden bg-[rgba(217,119,6,0.08)] border-[#D97706]/30">
          {/* Banner Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D97706]/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(217,119,6,0.15)] flex items-center justify-center">
                <Clock size={16} className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold font-brand text-[#92400E]">
                  Previous Year Template {historicalProposal.fiscalYear ? `- FY${historicalProposal.fiscalYear - 1}` : ''}
                </h3>
                <p className="text-[11px] text-[#B45309]">
                  {historicalProposal.products?.length || 0} SKUs from previous season available as a starting point
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseAsTemplate}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold font-brand rounded-lg transition-all bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white shadow-sm hover:shadow-md"
              >
                Use as Template
              </button>
              <button
                type="button"
                onClick={() => setShowHistoricalBanner(false)}
                className="p-1.5 rounded-lg transition-colors text-[#B45309] hover:bg-[rgba(217,119,6,0.15)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Historical Products Preview (read-only) */}
          {historicalProposal.products?.length > 0 && (
            <div className="px-4 py-3 opacity-60 pointer-events-none">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[rgba(217,119,6,0.08)] border-b border-[#D97706]/20">
                      <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#92400E] whitespace-nowrap">SKU</th>
                      <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#92400E]">Name</th>
                      <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#92400E]">Gender</th>
                      <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#92400E]">Category</th>
                      <th className="px-2 py-1.5 text-right font-semibold font-brand text-[#92400E]">SRP</th>
                      <th className="px-2 py-1.5 text-center font-semibold font-brand text-[#92400E]">Qty</th>
                      <th className="px-2 py-1.5 text-right font-semibold font-brand text-[#92400E]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalProposal.products.slice(0, 8).map((prod, pIdx) => (
                      <tr key={`hist-${pIdx}`} className="border-b border-[#D97706]/10">
                        <td className="px-2 py-1.5 font-data text-[#92400E] whitespace-nowrap">{prod.skuCode || prod.sku || '-'}</td>
                        <td className="px-2 py-1.5 text-[#78350F]">{prod.productName || prod.name || '-'}</td>
                        <td className="px-2 py-1.5 text-[#B45309] capitalize">{prod.gender || '-'}</td>
                        <td className="px-2 py-1.5 text-[#B45309]">{prod.subCategory || prod.category || '-'}</td>
                        <td className="px-2 py-1.5 text-right font-data text-[#92400E]">{formatCurrency(Number(prod.srp) || 0)}</td>
                        <td className="px-2 py-1.5 text-center font-data text-[#92400E]">{prod.orderQty || 0}</td>
                        <td className="px-2 py-1.5 text-right font-data text-[#92400E]">{formatCurrency(Number(prod.totalValue) || 0)}</td>
                      </tr>
                    ))}
                    {historicalProposal.products.length > 8 && (
                      <tr>
                        <td colSpan={7} className="px-2 py-1.5 text-center text-[11px] text-[#B45309] italic">
                          ...and {historicalProposal.products.length - 8} more SKUs
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredSkuBlocks.length === 0 ? (
        <div className="rounded-xl border p-10 text-center bg-white border-[rgba(196,151,90,0.2)]">
          <Package size={36} className="mx-auto mb-3 text-[rgba(196,151,90,0.5)]" />
          <p className="font-medium font-brand text-[#2C2417]">{t('skuProposal.noSkuData')}</p>
          <p className="text-sm mt-1 text-[#8C8178]">Try adjusting the filters above</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkuItems.map(({ block, blockKey, item, idx, key }, cardIdx) => {
            const detailsOpen = !!cardDetailsOpen[key];
            const sizingOpen = !!cardSizingOpen[key];
            return (
              <div key={key} className={`rounded-2xl border p-4 ${getCardBgClass(cardIdx)}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name || item.sku}
                        className="w-14 h-14 rounded-xl object-cover bg-[#FBF9F7] border border-[rgba(196,151,90,0.2)]"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-14 h-14 rounded-xl bg-[#FBF9F7] border border-[rgba(196,151,90,0.2)] flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}>
                      <ProductPlaceholder size={36} category={block.category} subCategory={block.subCategory} productType={item.productType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#2C2417]">
                        <span className="font-data">{item.sku || 'New SKU'}</span>
                        <span className="text-[#8C8178]">&bull;</span>
                        <span className="truncate">{item.name || 'Select SKU'}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenSizing(key, idx, item)}
                          className="p-1 rounded transition-colors relative text-[#8C8178] hover:text-[#7D5A28] hover:bg-[rgba(160,120,75,0.18)] shrink-0"
                          title={t('skuProposal.sizing')}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkuRow(blockKey, idx, item.name || item.sku)}
                          className="p-1 rounded transition-colors text-[#8C8178] hover:text-[#DC3545] hover:bg-[rgba(220,53,69,0.1)] shrink-0"
                          title={t('proposal.deleteSku')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="text-xs text-[#8C8178]">
                        {block.gender} &bull; {block.category} &bull; {block.subCategory}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <button
                      type="button"
                      onClick={() => setCardDetailsOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold rounded-full border transition-colors border-[rgba(196,151,90,0.4)] text-[#7D5A28] hover:bg-[rgba(160,120,75,0.18)]"
                    >
                      {detailsOpen ? t('skuProposal.hideDetails') : t('skuProposal.showDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardStoreOrderOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold rounded-full border transition-colors border-[rgba(196,151,90,0.4)] text-[#7D5A28] hover:bg-[rgba(160,120,75,0.18)]"
                    >
                      {cardStoreOrderOpen[key] ? t('skuProposal.hideStores') : t('skuProposal.storeOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSizingOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold rounded-full border transition-colors border-[rgba(196,151,90,0.4)] text-[#7D5A28] hover:bg-[rgba(160,120,75,0.18)]"
                    >
                      {sizingOpen ? t('skuProposal.hideSizing') : t('skuProposal.sizing')}
                    </button>
                  </div>
                </div>

                {item.isNew && (
                  <div className="mt-3">
                    <FilterSelect
                      options={skuCatalog.map(sku => ({ value: sku.sku, label: `${sku.sku} - ${sku.name}` }))}
                      value={item.sku}
                      onChange={(v) => handleSkuSelect(blockKey, idx, v)}
                      placeholder={t('proposal.selectSku')}
                      searchable={true}
                    />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border p-3 bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                    <p className="text-xs text-[#8C8178]">{t('skuProposal.rex')}</p>
                    <input
                      type="number"
                      value={item.rex}
                      onChange={(e) => handleNumberChange(blockKey, idx, 'rex', e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border text-sm font-data focus:outline-none bg-white border-[rgba(196,151,90,0.4)] text-[#2C2417] focus:ring-2 focus:ring-[rgba(196,151,90,0.3)] focus:border-[#C4975A]"
                    />
                  </div>
                  <div className="rounded-xl border p-3 bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                    <p className="text-xs text-[#8C8178]">{t('skuProposal.ttp')}</p>
                    <input
                      type="number"
                      value={item.ttp}
                      onChange={(e) => handleNumberChange(blockKey, idx, 'ttp', e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border text-sm font-data focus:outline-none bg-white border-[rgba(196,151,90,0.4)] text-[#2C2417] focus:ring-2 focus:ring-[rgba(196,151,90,0.3)] focus:border-[#C4975A]"
                    />
                  </div>
                  <div className="rounded-xl border p-3 bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                    <p className="text-xs text-[#8C8178]">{t('skuProposal.order')}</p>
                    <div className="mt-1 text-sm font-semibold font-data text-[#2C2417]">{item.order}</div>
                  </div>
                  <div className="rounded-xl border p-3 bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                    <p className="text-xs text-[#8C8178]">{t('skuProposal.totalValue')}</p>
                    <div className="mt-1 text-sm font-semibold font-data text-[#1B6B45]">{formatCurrency(item.ttlValue)}</div>
                  </div>
                </div>

                {detailsOpen && (
                  <div className="mt-4 rounded-xl border p-4 bg-[rgba(160,120,75,0.08)] border-[rgba(196,151,90,0.2)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-[#8C8178]">Product type</span>
                        <div className="font-medium text-[#2C2417]">{item.productType}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">Theme</span>
                        <div className="font-medium text-[#2C2417]">{item.theme}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">Color</span>
                        <div className="font-medium text-[#2C2417]">{item.color}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">Composition</span>
                        <div className="font-medium text-[#2C2417]">{item.composition}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">Unit cost</span>
                        <div className="font-medium font-data text-[#2C2417]">{formatCurrency(item.unitCost)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">SRP</span>
                        <div className="font-medium font-data text-[#1B6B45]">{formatCurrency(item.srp)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8C8178]">Customer target</span>
                        <div className="mt-1">
                          <FilterSelect
                            options={[{ value: 'New', label: 'New' }, { value: 'Existing', label: 'Existing' }]}
                            value={item.customerTarget}
                            onChange={(v) => handleSelectChange(blockKey, idx, 'customerTarget', v)}
                            searchable={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cardStoreOrderOpen[key] && (
                  <div className="mt-4 rounded-xl border overflow-hidden bg-white border-[rgba(196,151,90,0.2)]">
                    <div className="px-4 py-2 text-xs font-semibold font-brand text-[#7D5A28] bg-[rgba(160,120,75,0.12)]">
                      Store Order
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[rgba(160,120,75,0.12)] text-[#8C8178]">
                            <th className="px-3 py-2 text-left">Store</th>
                            <th className="px-3 py-2 text-center font-data">ORDER</th>
                            <th className="px-3 py-2 text-right font-data">TTL VALUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-[#E8E2DB]">
                            <td className="px-3 py-2 text-[#6B5D4F]">
                              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C4975A]" />REX</span>
                            </td>
                            <td className="px-3 py-2 text-center font-data text-[#2C2417]">{item.rex || Math.floor((item.order || 0) / 2)}</td>
                            <td className="px-3 py-2 text-right font-data text-[#2C2417]">{formatCurrency((item.rex || Math.floor((item.order || 0) / 2)) * (item.srp || 0))}</td>
                          </tr>
                          <tr className="border-t border-[#E8E2DB]">
                            <td className="px-3 py-2 text-[#6B5D4F]">
                              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1B6B45]" />TTP</span>
                            </td>
                            <td className="px-3 py-2 text-center font-data text-[#2C2417]">{item.ttp || Math.ceil((item.order || 0) / 2)}</td>
                            <td className="px-3 py-2 text-right font-data text-[#2C2417]">{formatCurrency((item.ttp || Math.ceil((item.order || 0) / 2)) * (item.srp || 0))}</td>
                          </tr>
                          <tr className="border-t-2 border-[#C4975A]/40 bg-[rgba(160,120,75,0.12)]">
                            <td className="px-3 py-2 font-semibold text-[#7D5A28]">{t('skuProposal.total')}</td>
                            <td className="px-3 py-2 text-center font-bold font-data text-[#2C2417]">{item.order || 0}</td>
                            <td className="px-3 py-2 text-right font-bold font-data text-[#2C2417]">{formatCurrency(item.ttlValue || (item.order || 0) * (item.srp || 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {sizingOpen && (
                  <div className="mt-4 rounded-xl border overflow-hidden bg-white border-[rgba(196,151,90,0.2)]">
                    <div className="px-4 py-2 text-xs font-semibold font-brand text-[#7D5A28] bg-[rgba(160,120,75,0.12)]">
                      Sizing
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[rgba(160,120,75,0.12)] text-[#7D5A28]">
                            <th className="px-3 py-2 text-left font-brand">{item.productType}</th>
                            <th className="px-3 py-2 text-center font-data">0002</th>
                            <th className="px-3 py-2 text-center font-data">0004</th>
                            <th className="px-3 py-2 text-center font-data">0006</th>
                            <th className="px-3 py-2 text-center font-data">0008</th>
                            <th className="px-3 py-2 text-center font-brand">Sum</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#2C2417]">
                          <tr className="border-t border-[rgba(196,151,90,0.2)]">
                            <td className="px-3 py-2">% Sales mix</td>
                            <td className="px-3 py-2 text-center font-data">6%</td>
                            <td className="px-3 py-2 text-center font-data">33%</td>
                            <td className="px-3 py-2 text-center font-data">33%</td>
                            <td className="px-3 py-2 text-center font-data">28%</td>
                            <td className="px-3 py-2 text-center font-semibold font-data">100%</td>
                          </tr>
                          <tr className="border-t border-[rgba(196,151,90,0.2)]">
                            <td className="px-3 py-2">% ST</td>
                            <td className="px-3 py-2 text-center font-data">50%</td>
                            <td className="px-3 py-2 text-center font-data">43%</td>
                            <td className="px-3 py-2 text-center font-data">30%</td>
                            <td className="px-3 py-2 text-center font-data">63%</td>
                            <td className="px-3 py-2 text-center font-data">-</td>
                          </tr>
                          <tr className="border-t border-[rgba(196,151,90,0.2)] bg-[rgba(160,120,75,0.08)]">
                            <td className="px-3 py-2 font-semibold text-[#7D5A28]">Choice A</td>
                            {['s0002', 's0004', 's0006', 's0008'].map(size => (
                              <td key={size} className="px-1 py-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceA[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceA', size, e.target.value)}
                                  className="w-10 text-center font-data text-xs rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#7D5A28]"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold font-data text-[#7D5A28]">{calculateSum(getSizing(blockKey, idx).choiceA)}</td>
                          </tr>
                          <tr className="border-t border-[rgba(196,151,90,0.2)] bg-[rgba(27,107,69,0.03)]">
                            <td className="px-3 py-2 font-semibold text-[#1B6B45]">Choice B</td>
                            {['s0002', 's0004', 's0006', 's0008'].map(size => (
                              <td key={size} className="px-1 py-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceB[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceB', size, e.target.value)}
                                  className="w-10 text-center font-data text-xs rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#1B6B45]"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold font-data text-[#1B6B45]">{calculateSum(getSizing(blockKey, idx).choiceB)}</td>
                          </tr>
                          <tr className="border-t border-[rgba(196,151,90,0.2)] bg-[rgba(27,107,69,0.02)]">
                            <td className="px-3 py-2 font-semibold text-[#1B6B45]">Choice C</td>
                            {['s0002', 's0004', 's0006', 's0008'].map(size => (
                              <td key={size} className="px-1 py-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceC[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceC', size, e.target.value)}
                                  className="w-10 text-center font-data text-xs rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#1B6B45]"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold font-data text-[#1B6B45]">{calculateSum(getSizing(blockKey, idx).choiceC)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add SKU Card */}
          {filteredSkuBlocks.length > 0 && (
            <button
              onClick={() => {
                const firstBlock = filteredSkuBlocks[0];
                const blockKey = `${firstBlock.gender}_${firstBlock.category}_${firstBlock.subCategory}_${firstBlock.budgetId || ''}`;
                handleAddSkuRow(blockKey);
              }}
              className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] border-[rgba(196,151,90,0.4)] hover:border-[#7D5A28] hover:bg-[rgba(196,151,90,0.08)]"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(196,151,90,0.2)]">
                <Plus size={24} className="text-[#7D5A28]" />
              </div>
              <span className="text-sm font-semibold font-brand text-[#7D5A28]">
                Add New SKU
              </span>
              <span className="text-xs text-[#8C8178]">
                Click to add a new SKU to {filteredSkuBlocks[0]?.subCategory}
              </span>
            </button>
          )}
        </div>
      ) : isMobile ? (
        /* Mobile Table View: MobileDataCard list */
        <div className="space-y-4">
          {filteredSkuBlocks.map((block) => {
            const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} className="space-y-2">
                {/* Block header */}
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(196,151,90,0.15)] border border-[rgba(196,151,90,0.3)]"
                >
                  <ChevronDown size={14} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''} text-[#7D5A28]`} />
                  <div className="text-left flex-1 min-w-0">
                    <span className="font-semibold text-sm text-[#7D5A28]">{block.subCategory}</span>
                    <span className="text-[11px] text-[#8C8178] ml-1.5">{block.gender} &bull; {block.items.length} SKUs</span>
                  </div>
                  <span className="text-xs font-data flex-shrink-0 text-[#6B5D4F]">
                    {formatCurrency(block.items.reduce((sum, i) => sum + i.srp, 0))}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-2">
                    {block.items.map((item, idx) => (
                      <MobileDataCard
                        key={`${item.sku}_${idx}`}
                        darkMode={darkMode}
                        title={item.sku || 'New SKU'}
                        subtitle={item.name || 'Select SKU'}
                        status={item.customerTarget}
                        statusColor={item.customerTarget === 'New' ? 'info' : 'neutral'}
                        metrics={[
                          { label: 'SRP', value: formatCurrency(item.srp) },
                          { label: 'Order', value: String(item.order) },
                          { label: 'REX', value: String(item.rex) },
                          { label: 'TTP', value: String(item.ttp) },
                          { label: 'TTL Value', value: formatCurrency(item.ttlValue), color: 'text-[#1B6B45]' },
                          { label: 'Unit Cost', value: formatCurrency(item.unitCost) },
                        ]}
                        actions={[
                          { label: 'Sizing', onClick: () => handleOpenSizing(key, idx, item) },
                          { label: 'Delete', onClick: () => handleDeleteSkuRow(key, idx, item.name || item.sku) },
                        ]}
                      />
                    ))}
                    {/* Add new SKU button */}
                    <button
                      type="button"
                      onClick={() => handleAddSkuRow(key)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm rounded-xl transition-colors border border-dashed text-[#8C8178] hover:text-[#7D5A28] hover:bg-[rgba(160,120,75,0.12)] border-[rgba(196,151,90,0.3)] hover:border-[rgba(196,151,90,0.5)]"
                    >
                      <Plus size={16} />
                      <span>Add new SKU</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSkuBlocks.map((block) => {
            const key = `${block.gender}_${block.category}_${block.subCategory}_${block.budgetId || ''}`;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} className="rounded-xl border bg-white border-[rgba(196,151,90,0.2)]">
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 bg-[rgba(196,151,90,0.15)] border-b border-[rgba(196,151,90,0.3)]"
                >
                  <ChevronDown size={14} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''} text-[#7D5A28]`} />
                  <span className="font-semibold text-sm text-[#7D5A28]">{block.subCategory}</span>
                  <span className="text-[11px] text-[#8C8178]">{block.gender} &bull; {block.category} &bull; {block.items.length} SKUs</span>
                  <span className="ml-auto text-xs font-data text-[#6B5D4F]">
                    {formatCurrency(block.items.reduce((sum, i) => sum + i.srp, 0))}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[rgba(160,120,75,0.10)] border-b border-[rgba(196,151,90,0.2)]">
                          <th className="w-9 px-1.5 py-1.5"></th>
                          <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#8C8178] whitespace-nowrap">SKU</th>
                          <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#8C8178]">Name</th>
                          <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#8C8178] whitespace-nowrap">Type</th>
                          <th className="px-2 py-1.5 text-left font-semibold font-brand text-[#8C8178]">Color</th>
                          <th className="px-2 py-1.5 text-right font-semibold font-brand text-[#8C8178] whitespace-nowrap">Cost</th>
                          <th className="px-2 py-1.5 text-right font-semibold font-brand text-[#8C8178]">SRP</th>
                          <th className="px-2 py-1.5 text-center font-semibold font-brand text-[#8C8178]">Qty</th>
                          <th className="px-2 py-1.5 text-center font-semibold font-brand text-[#8C8178]">Rex</th>
                          <th className="px-2 py-1.5 text-center font-semibold font-brand text-[#8C8178]">TTP</th>
                          <th className="px-2 py-1.5 text-right font-semibold font-brand text-[#8C8178] whitespace-nowrap">Value</th>
                          <th className="px-2 py-1.5 text-center font-semibold font-brand text-[#8C8178]">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.items.map((item, idx) => {
                          const rexKey = `${key}|${idx}|rex`;
                          const ttpKey = `${key}|${idx}|ttp`;
                          const isEditingRex = editingCell === rexKey;
                          const isEditingTtp = editingCell === ttpKey;
                          return (
                          <tr key={`${item.sku}_${idx}`} className={`border-b border-[rgba(196,151,90,0.12)] ${item.isNew ? 'bg-[rgba(27,107,69,0.04)]' : ''}`}>
                            <td className="px-1.5 py-1">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name || item.sku}
                                  className="w-8 h-8 rounded object-cover bg-[#FBF9F7] border border-[rgba(196,151,90,0.15)]"
                                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 rounded bg-[#FBF9F7] border border-[rgba(196,151,90,0.15)] flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}>
                                <ProductPlaceholder size={22} category={block.category} subCategory={block.subCategory} productType={item.productType} />
                              </div>
                            </td>
                            {item.isNew ? (
                              <>
                                <td colSpan={2} className="px-2 py-1">
                                  <FilterSelect
                                    options={skuCatalog.map(sku => ({ value: sku.sku, label: `${sku.sku} - ${sku.name}` }))}
                                    value={item.sku}
                                    onChange={(v) => handleSkuSelect(key, idx, v)}
                                    placeholder={t('proposal.selectSku')}
                                    searchable={true}
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-1">
                                  <div className="flex items-center gap-0.5">
                                    <span className="font-semibold font-data text-[#2C2417] whitespace-nowrap">{item.sku}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSizing(key, idx, item)}
                                      className="p-0.5 rounded transition-colors relative text-[#8C8178] hover:text-[#7D5A28] hover:bg-[rgba(160,120,75,0.18)]"
                                      title={t('skuProposal.sizing')}
                                    >
                                      <Pencil size={10} />
                                      {isSizingComplete(key, idx) && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1B6B45] rounded-full flex items-center justify-center">
                                          <Check size={5} className="text-white" />
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSkuRow(key, idx, item.name || item.sku)}
                                      className="p-0.5 rounded transition-colors text-[#8C8178] hover:text-[#DC3545] hover:bg-[rgba(220,53,69,0.1)]"
                                      title={t('proposal.deleteSku')}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-[#2C2417]" title={`${item.theme || ''} · ${item.composition || ''}`}>{item.name}</td>
                              </>
                            )}
                            <td className="px-2 py-1 text-[#8C8178] whitespace-nowrap">{item.productType}</td>
                            <td className="px-2 py-1 text-[#8C8178]">{item.color}</td>
                            <td className="px-2 py-1 text-right font-data text-[#8C8178] whitespace-nowrap">{formatCurrency(item.unitCost)}</td>
                            <td className="px-2 py-1 text-right font-data text-[#1B6B45] whitespace-nowrap">{formatCurrency(item.srp)}</td>
                            <td className="px-2 py-1 text-center">
                              <span className="px-1.5 py-0.5 rounded font-semibold font-data bg-[rgba(160,120,75,0.14)] text-[#7D5A28]">
                                {item.order}
                              </span>
                            </td>
                            <td className="px-2 py-1 text-center">
                              {isEditingRex ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveEdit(rexKey)}
                                  onKeyDown={(e) => handleKeyDown(e, rexKey)}
                                  className="w-14 px-1 py-0.5 text-center border-2 rounded focus:outline-none focus:ring-1 text-xs font-semibold font-data border-[#C4975A] bg-white text-[#2C2417] focus:ring-[rgba(196,151,90,0.3)]"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(rexKey, item.rex)}
                                  className="px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 font-data transition-colors bg-[rgba(160,120,75,0.14)] text-[#7D5A28] hover:bg-[rgba(196,151,90,0.22)]"
                                  title="Edit Rex"
                                >
                                  {item.rex}
                                  <Pencil size={10} className="text-[#7D5A28]" />
                                </button>
                              )}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {isEditingTtp ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveEdit(ttpKey)}
                                  onKeyDown={(e) => handleKeyDown(e, ttpKey)}
                                  className="w-14 px-1 py-0.5 text-center border-2 rounded focus:outline-none focus:ring-1 text-xs font-semibold font-data border-[#C4975A] bg-white text-[#2C2417] focus:ring-[rgba(196,151,90,0.3)]"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(ttpKey, item.ttp)}
                                  className="px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 font-data transition-colors bg-[rgba(160,120,75,0.14)] text-[#7D5A28] hover:bg-[rgba(196,151,90,0.22)]"
                                  title="Edit TTP"
                                >
                                  {item.ttp}
                                  <Pencil size={10} className="text-[#7D5A28]" />
                                </button>
                              )}
                            </td>
                            <td className="px-2 py-1 text-right font-data text-[#1B6B45] whitespace-nowrap">{formatCurrency(item.ttlValue)}</td>
                            <td className="px-2 py-1 text-center">
                              <FilterSelect
                                options={[{ value: 'New', label: 'New' }, { value: 'Existing', label: 'Existing' }]}
                                value={item.customerTarget}
                                onChange={(v) => handleSelectChange(key, idx, 'customerTarget', v)}
                                searchable={false}
                              />
                            </td>
                          </tr>
                        );
                        })}
                        {/* Add new row button */}
                        <tr className="border-t border-dashed border-[rgba(196,151,90,0.3)] bg-[rgba(196,151,90,0.03)]">
                          <td colSpan={12} className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddSkuRow(key)}
                              className="w-full flex items-center justify-center gap-1 py-1 text-xs transition-colors text-[#8C8178] hover:text-[#7D5A28]"
                            >
                              <Plus size={13} />
                              <span>Add SKU</span>
                            </button>
                          </td>
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

      {/* Sizing Popup Modal */}
      {sizingPopup.open && sizingPopup.item && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50">
          <div className="rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl md:mx-4 max-h-[90vh] overflow-y-auto bg-white">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-[rgba(160,120,75,0.18)] border-b border-[rgba(196,151,90,0.3)]">
              <div>
                <h3 className="text-lg font-bold font-brand text-[#7D5A28]">{sizingPopup.item.productType}</h3>
                <p className="text-sm text-[#6B5D4F]">
                  <span className="font-data">{sizingPopup.item.sku}</span> - {sizingPopup.item.name}
                </p>
              </div>
              <button
                onClick={handleCloseSizing}
                className="p-2 rounded-lg transition-colors hover:bg-[rgba(196,151,90,0.2)]"
              >
                <X size={20} className="text-[#7D5A28]" />
              </button>
            </div>

            {/* Sizing Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[rgba(196,151,90,0.2)] text-[#7D5A28]">
                      <th className="px-4 py-3 text-left font-semibold font-brand">{sizingPopup.item.productType}</th>
                      <th className="px-4 py-3 text-center font-semibold font-data">0002</th>
                      <th className="px-4 py-3 text-center font-semibold font-data">0004</th>
                      <th className="px-4 py-3 text-center font-semibold font-data">0006</th>
                      <th className="px-4 py-3 text-center font-semibold font-data">0008</th>
                      <th className="px-4 py-3 text-center font-semibold font-brand bg-[rgba(196,151,90,0.25)]">Sum</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2C2417]">
                    <tr className="border-b border-[rgba(196,151,90,0.2)] bg-[rgba(160,120,75,0.08)]">
                      <td className="px-4 py-2.5 font-medium text-[#2C2417]">% Sales mix</td>
                      <td className="px-4 py-2.5 text-center font-data">6%</td>
                      <td className="px-4 py-2.5 text-center font-data">33%</td>
                      <td className="px-4 py-2.5 text-center font-data">33%</td>
                      <td className="px-4 py-2.5 text-center font-data">28%</td>
                      <td className="px-4 py-2.5 text-center font-semibold font-data bg-[rgba(160,120,75,0.12)]">100%</td>
                    </tr>
                    <tr className="border-b border-[rgba(196,151,90,0.2)]">
                      <td className="px-4 py-2.5 font-medium text-[#2C2417]">% ST</td>
                      <td className="px-4 py-2.5 text-center font-data">50%</td>
                      <td className="px-4 py-2.5 text-center font-data">43%</td>
                      <td className="px-4 py-2.5 text-center font-data">30%</td>
                      <td className="px-4 py-2.5 text-center font-data">63%</td>
                      <td className="px-4 py-2.5 text-center font-data text-[#8C8178] bg-[rgba(160,120,75,0.12)]">-</td>
                    </tr>
                    <tr className="border-b border-[rgba(196,151,90,0.2)] bg-[rgba(160,120,75,0.12)]">
                      <td className="px-4 py-2.5 font-medium text-[#7D5A28]">Choice A:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map(size => (
                        <td key={size} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceA', size, e.target.value)}
                            className="w-14 text-center font-data text-sm rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#7D5A28]"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center font-semibold font-data text-[#7D5A28] bg-[rgba(196,151,90,0.2)]">{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA)}</td>
                    </tr>
                    <tr className="border-b border-[rgba(196,151,90,0.2)] bg-[rgba(27,107,69,0.05)]">
                      <td className="px-4 py-2.5 font-medium text-[#1B6B45]">Choice B:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map(size => (
                        <td key={size} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceB', size, e.target.value)}
                            className="w-14 text-center font-data text-sm rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#1B6B45]"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center font-semibold font-data text-[#1B6B45] bg-[rgba(27,107,69,0.1)]">{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB)}</td>
                    </tr>
                    <tr className="bg-[rgba(27,107,69,0.03)]">
                      <td className="px-4 py-2.5 font-medium text-[#1B6B45]">Choice C:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map(size => (
                        <td key={size} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceC', size, e.target.value)}
                            className="w-14 text-center font-data text-sm rounded border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.4)] bg-emerald-50 border-emerald-200 text-[#1B6B45]"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center font-semibold font-data text-[#1B6B45] bg-[rgba(27,107,69,0.08)]">{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Size Curve Advisor */}
              <SizeCurveAdvisor
                skuId={sizingPopup.item.id}
                category={sizingPopup.item.productType}
                storeId="all"
                userSizing={{
                  '0002': getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA.s0002 || 0,
                  '0004': getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA.s0004 || 0,
                  '0006': getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA.s0006 || 0,
                  '0008': getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA.s0008 || 0,
                }}
                onApplyRecommendation={(newSizing) => {
                  ['s0002', 's0004', 's0006', 's0008'].forEach(size => {
                    const sizeCode = size.replace('s', '');
                    updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceA', size, newSizing[sizeCode] || 0);
                  });
                }}
                darkMode={darkMode}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseSizing}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[#8C8178] hover:bg-[rgba(160,120,75,0.12)] hover:text-[#7D5A28]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSizing}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm bg-[#C4975A] text-white hover:bg-[#D4B082]"
                >
                  Save Sizing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-30 mt-3">
        <div className="bg-white/95 backdrop-blur-sm border border-border-muted rounded-xl px-4 py-2.5 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <button
            onClick={() => onNavigateBack ? onNavigateBack() : window.history.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-brand rounded-lg transition-colors text-[#6B5D4F] hover:bg-[#F5F0EB] border border-[#E8E2DB]"
          >
            <ArrowLeft size={13} />
            {t('nav.otbAnalysis')}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-data text-[#8C8178] hidden sm:inline">
              {filteredSkuBlocks.reduce((sum, b) => sum + b.items.length, 0)} SKUs
            </span>
            <button
              onClick={() => onNavigateNext ? onNavigateNext() : null}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold font-brand rounded-lg transition-all bg-gradient-to-r from-[#C4975A] to-[#B8894E] hover:from-[#B8894E] hover:to-[#A07B4B] text-white shadow-sm hover:shadow-md"
            >
              <Ticket size={13} />
              {t('nav.tickets')}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default SKUProposalScreen;
