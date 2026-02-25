'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, TrendingUp, Layers, Users, Tag, Info, Pencil, Filter, ChevronDown, Check, CheckCircle2, History, Clock, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { GENDERS, STORES } from '../../utils/constants';
import { useLanguage } from '@/contexts/LanguageContext';

// Category data structure for the Category tab
const CATEGORY_STRUCTURE = [
  {
    gender: { id: 'female', name: 'Female' },
    categories: [
      {
        id: 'women_rtw',
        name: "WOMEN'S RTW",
        subCategories: [
          { id: 'w_outerwear', name: 'W Outerwear' },
          { id: 'w_tailoring', name: 'W Tailoring' },
          { id: 'w_dresses', name: 'W Dresses' },
          { id: 'w_tops', name: 'W Tops' },
          { id: 'w_body', name: 'W Body' },
          { id: 'w_bottoms', name: 'W Bottoms' }
        ]
      },
      {
        id: 'women_hard_acc',
        name: 'WOMEN HARD ACCES...',
        subCategories: [
          { id: 'w_bags', name: 'W Bags' },
          { id: 'w_slg', name: 'W SLG' }
        ]
      },
      {
        id: 'others',
        name: 'OTHERS',
        subCategories: [
          { id: 'women_shoes', name: "Women's Sh..." }
        ]
      }
    ]
  },
  {
    gender: { id: 'male', name: 'Male' },
    categories: [
      {
        id: 'men_rtw',
        name: "MEN'S RTW",
        subCategories: [
          { id: 'm_outerwear', name: 'M Outerwear' },
          { id: 'm_tops', name: 'M Tops' },
          { id: 'm_bottoms', name: 'M Bottoms' }
        ]
      },
      {
        id: 'men_acc',
        name: 'MEN ACCESSORIES',
        subCategories: [
          { id: 'm_bags', name: 'M Bags' },
          { id: 'm_slg', name: 'M SLG' }
        ]
      }
    ]
  }
];

const TABS = [
  { id: 'collection', labelKey: 'planningDetail.collection', icon: Layers },
  { id: 'gender', labelKey: 'planningDetail.gender', icon: Users },
  { id: 'category', labelKey: 'planningDetail.category', icon: Tag }
];

// Reusable editable cell component
const EditableCell = React.memo(({ cellKey, value, isEditing, editValue, onStartEdit, onSaveEdit, onChangeValue, onKeyDown, readOnly = false }) => {
  if (isEditing && !readOnly) {
    return (
      <div className="flex items-center justify-center animate-in zoom-in duration-200">
        <input
          type="number"
          value={editValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => onSaveEdit(cellKey)}
          onKeyDown={(e) => onKeyDown(e, cellKey)}
          className="w-20 px-2 py-1.5 text-center border-2 border-[#C4975A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(196,151,90,0.5)] bg-[#FFFFFF] text-[#2C2417] font-['JetBrains_Mono'] transform scale-105 transition-transform"
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FBF9F7] border border-[#E8E2DB] rounded-lg min-w-[70px] justify-center">
          <span className="text-[#6B5D4F] font-['JetBrains_Mono']">{typeof value === 'number' ? value.toFixed(0) : value}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(cellKey, value)}
      className="group flex items-center justify-center gap-1 cursor-pointer"
      title="Click to edit"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(196,151,90,0.08)] border border-[rgba(196,151,90,0.25)] rounded-lg hover:bg-[rgba(196,151,90,0.15)] hover:border-[rgba(196,151,90,0.4)] hover:scale-105 transition-all min-w-[70px] justify-center">
        <span className="text-[#2C2417] font-['JetBrains_Mono']">{typeof value === 'number' ? value.toFixed(0) : value}%</span>
        <Pencil size={12} className="text-[#C4975A] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

const PlanningDetailModal = ({
  selectedBudgetDetail,
  planningDetailData,
  onClose,
  onSave,
  onUpdateDetail
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('collection');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState({});

  // Version management states
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('draft'); // 'draft' or version id
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [approveAnimation, setApproveAnimation] = useState(false);

  // Category tab filters
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);

  const genderDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const subCategoryDropdownRef = useRef(null);
  const versionDropdownRef = useRef(null);

  // Initialize local data for editable cells
  useEffect(() => {
    const initialData = {};
    // Initialize with random data for demo
    CATEGORY_STRUCTURE.forEach(genderGroup => {
      genderGroup.categories.forEach(cat => {
        cat.subCategories.forEach(subCat => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          initialData[key] = {
            buyPct: Math.floor(Math.random() * 15) + 1,
            salesPct: Math.floor(Math.random() * 15) + 1,
            stPct: Math.floor(Math.random() * 50) + 40,
            buyProposed: Math.floor(Math.random() * 15) + 1,
            otbProposed: Math.floor(Math.random() * 100000) + 10000,
            varPct: Math.floor(Math.random() * 10) - 5,
            otbSubmitted: Math.floor(Math.random() * 100000) + 10000,
            buyActual: Math.floor(Math.random() * 15) + 1
          };
        });
      });
    });
    setLocalData(initialData);
  }, []);

  const handleStartEdit = (cellKey, currentValue) => {
    setEditingCell(cellKey);
    setEditValue(typeof currentValue === 'number' ? currentValue.toFixed(0) : currentValue.toString());
  };

  const handleSaveEdit = (cellKey) => {
    const newValue = parseFloat(editValue) || 0;
    setLocalData(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        buyProposed: newValue
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

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target)) {
        setIsGenderDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(event.target)) {
        setIsSubCategoryDropdownOpen(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setIsVersionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle approve - create new version
  const handleApprove = () => {
    const newVersion = {
      id: `v${versions.length + 1}`,
      versionNumber: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      data: JSON.parse(JSON.stringify(localData)), // Deep copy of current data
      status: 'approved'
    };

    setVersions(prev => [...prev, newVersion]);
    setApproveAnimation(true);

    // Reset animation after delay
    setTimeout(() => {
      setApproveAnimation(false);
      setSelectedVersion(newVersion.id);
    }, 1500);
  };

  // Get data for selected version (draft or approved version)
  const getVersionData = () => {
    if (selectedVersion === 'draft') {
      return localData;
    }
    const version = versions.find(v => v.id === selectedVersion);
    return version ? version.data : localData;
  };

  // Check if current view is read-only (viewing an approved version)
  const isReadOnly = selectedVersion !== 'draft';

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate filter options from CATEGORY_STRUCTURE
  const filterOptions = useMemo(() => {
    const genders = [{ id: 'all', name: t('planningDetail.allGenders') }];
    const categories = [{ id: 'all', name: t('planningDetail.allCategories') }];
    const subCategories = [{ id: 'all', name: t('planningDetail.allSubCategories') }];

    CATEGORY_STRUCTURE.forEach(genderGroup => {
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
  }, []);

  // Get filtered categories based on gender selection
  const filteredCategoryOptions = useMemo(() => {
    if (genderFilter === 'all') return filterOptions.categories;
    return [
      { id: 'all', name: t('planningDetail.allCategories') },
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
    return [{ id: 'all', name: t('planningDetail.allSubCategories') }, ...options.filter(o => o.id !== 'all')];
  }, [genderFilter, categoryFilter, filterOptions.subCategories]);

  // Reset dependent filters when parent filter changes
  const handleGenderFilterChange = (value) => {
    setGenderFilter(value);
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setIsGenderDropdownOpen(false);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setSubCategoryFilter('all');
    setIsCategoryDropdownOpen(false);
  };

  const handleSubCategoryFilterChange = (value) => {
    setSubCategoryFilter(value);
    setIsSubCategoryDropdownOpen(false);
  };

  // Calculate totals for entire data
  const grandTotals = useMemo(() => {
    if (!planningDetailData || planningDetailData.length === 0) {
      return { buyPct: 0, salesPct: 0, userBuyPct: 0, otbValue: 0 };
    }

    const buyPct = planningDetailData.reduce((sum, item) => sum + item.systemBuyPct, 0);
    const salesPct = planningDetailData.reduce((sum, item) => sum + item.lastSeasonSalesPct, 0);
    const userBuyPct = planningDetailData.reduce((sum, item) => sum + item.userBuyPct, 0);
    const otbValue = planningDetailData.reduce((sum, item) => sum + item.otbValue, 0);

    return { buyPct, salesPct, userBuyPct, otbValue };
  }, [planningDetailData]);

  // Collection sections: Carry Over/Commercial and Seasonal
  const COLLECTION_SECTIONS = [
    { id: 'carryover', nameKey: 'planningDetail.carryOverCommercial' },
    { id: 'seasonal', nameKey: 'planningDetail.seasonal' }
  ];

  // Common table header style - Light Theme
  const headerClass = "bg-[#FBF9F7] text-[#2C2417]";
  const headerCellClass = "px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide font-['Montserrat']";
  const groupRowClass = "bg-[rgba(196,151,90,0.08)] border-l-4 border-[#C4975A]";
  const subGroupRowClass = "bg-[#FFFFFF] border-l-4 border-[#E8E2DB]";
  const sumRowClass = "bg-[#1B6B45] text-white font-semibold";

  // Render Collection Tab
  const renderCollectionTab = () => {
    const collectionData = COLLECTION_SECTIONS.map((section, sectionIdx) => {
      const items = planningDetailData.filter((_, idx) =>
        sectionIdx === 0 ? idx % 2 === 0 : idx % 2 === 1
      );

      const storeData = STORES.map(store => {
        const storeItems = items.filter((_, idx) =>
          store.id === 'rex' ? idx % 2 === 0 : idx % 2 === 1
        );

        const buyPct = storeItems.reduce((sum, item) => sum + item.systemBuyPct, 0) / (storeItems.length || 1);
        const salesPct = storeItems.reduce((sum, item) => sum + item.lastSeasonSalesPct, 0) / (storeItems.length || 1);
        const stPct = Math.random() * 30 + 40;
        const moc = Math.random() * 5 + 2;
        const userBuyPct = storeItems.reduce((sum, item) => sum + item.userBuyPct, 0) / (storeItems.length || 1);
        const otbValue = storeItems.reduce((sum, item) => sum + item.otbValue, 0);
        const variance = userBuyPct - salesPct;

        return { store, buyPct, salesPct, stPct, moc, userBuyPct, otbValue, variance, items: storeItems };
      });

      return {
        section,
        storeData,
        totals: {
          buyPct: storeData.reduce((sum, s) => sum + s.buyPct, 0),
          salesPct: storeData.reduce((sum, s) => sum + s.salesPct, 0),
          userBuyPct: storeData.reduce((sum, s) => sum + s.userBuyPct, 0),
          otbValue: storeData.reduce((sum, s) => sum + s.otbValue, 0)
        }
      };
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={headerClass}>
              <th className={`${headerCellClass} text-left min-w-[200px]`}>{t('planningDetail.collection')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctBuy')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctSales')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctST')}</th>
              <th className={headerCellClass}>{t('planningDetail.moc')}</th>
              <th className={`${headerCellClass} bg-[rgba(196,151,90,0.15)]`}>{t('planningDetail.pctBuyProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.otbProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctVarVsLastSeason')}</th>
            </tr>
          </thead>
          <tbody>
            {collectionData.map((colData) => (
              <React.Fragment key={`col-${colData.section.id}`}>
                {/* Section Header Row */}
                <tr className={groupRowClass}>
                  <td className="px-4 py-3" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#C4975A] font-['Montserrat']">{t(colData.section.nameKey)}</span>
                      <Info size={14} className="text-[#8C8178]" />
                    </div>
                  </td>
                </tr>

                {/* Store Rows */}
                {colData.storeData.map((storeRow) => {
                  const cellKey = `collection_${colData.section.id}_${storeRow.store.id}`;
                  const isEditing = editingCell === cellKey;

                  return (
                    <tr
                      key={cellKey}
                      className="border-b border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.08)] transition-colors"
                    >
                      <td className="px-4 py-3 pl-8">
                        <span className="text-[#6B5D4F]">{storeRow.store.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.buyPct.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.salesPct.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.stPct.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.moc.toFixed(1)}</td>
                      <td className={`px-4 py-3 ${isReadOnly ? 'bg-[#FBF9F7]' : 'bg-[rgba(196,151,90,0.08)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={storeRow.userBuyPct}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-[#2C2417] font-['JetBrains_Mono']">{formatCurrency(storeRow.otbValue)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
                        storeRow.variance < 0 ? 'text-[#DC3545]' : storeRow.variance > 0 ? 'text-[#1B6B45]' : 'text-[#6B5D4F]'
                      }`}>
                        {storeRow.variance > 0 ? '+' : ''}{storeRow.variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* SUM Row */}
            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-bold font-['Montserrat']">{t('planningDetail.sum')}</td>
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

  // Render Gender Tab (without MOC column)
  const renderGenderTab = () => {
    const genderData = GENDERS.map(gen => {
      const items = planningDetailData.filter(item => item.genderId === gen.id);

      const storeData = STORES.map(store => {
        const storeItems = items.filter((_, idx) =>
          store.id === 'rex' ? idx % 2 === 0 : idx % 2 === 1
        );

        const buyPct = storeItems.reduce((sum, item) => sum + item.systemBuyPct, 0) / (storeItems.length || 1);
        const salesPct = storeItems.reduce((sum, item) => sum + item.lastSeasonSalesPct, 0) / (storeItems.length || 1);
        const stPct = Math.random() * 30 + 40;
        const userBuyPct = storeItems.reduce((sum, item) => sum + item.userBuyPct, 0) / (storeItems.length || 1);
        const otbValue = storeItems.reduce((sum, item) => sum + item.otbValue, 0);
        const variance = userBuyPct - salesPct;

        return { store, buyPct, salesPct, stPct, userBuyPct, otbValue, variance, items: storeItems };
      });

      return { gender: gen, storeData };
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={headerClass}>
              <th className={`${headerCellClass} text-left min-w-[200px]`}>{t('planningDetail.gender')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctBuy')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctSales')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctST')}</th>
              <th className={`${headerCellClass} bg-[rgba(196,151,90,0.15)]`}>{t('planningDetail.pctBuyProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.otbProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctVarVsLastSeason')}</th>
            </tr>
          </thead>
          <tbody>
            {genderData.map((genData) => (
              <React.Fragment key={`gen-${genData.gender.id}`}>
                {/* Gender Header Row */}
                <tr className={groupRowClass}>
                  <td className="px-4 py-3" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#C4975A] font-['Montserrat']">{genData.gender.name}</span>
                      <Info size={14} className="text-[#8C8178]" />
                    </div>
                  </td>
                </tr>

                {/* Store Rows */}
                {genData.storeData.map((storeRow) => {
                  const cellKey = `gender_${genData.gender.id}_${storeRow.store.id}`;
                  const isEditing = editingCell === cellKey;

                  return (
                    <tr
                      key={cellKey}
                      className="border-b border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.08)] transition-colors"
                    >
                      <td className="px-4 py-3 pl-8">
                        <span className="text-[#6B5D4F]">{storeRow.store.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.buyPct.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.salesPct.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{storeRow.stPct.toFixed(0)}%</td>
                      <td className={`px-4 py-3 ${isReadOnly ? 'bg-[#FBF9F7]' : 'bg-[rgba(196,151,90,0.08)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={storeRow.userBuyPct}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-[#2C2417] font-['JetBrains_Mono']">{formatCurrency(storeRow.otbValue)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
                        storeRow.variance < 0 ? 'text-[#DC3545]' : storeRow.variance > 0 ? 'text-[#1B6B45]' : 'text-[#6B5D4F]'
                      }`}>
                        {storeRow.variance > 0 ? '+' : ''}{storeRow.variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* SUM Row */}
            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-bold font-['Montserrat']">{t('planningDetail.sum')}</td>
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

  // Render Category Tab with Gender -> Cat -> Sub_Cat structure
  const renderCategoryTab = () => {
    // Calculate totals for each gender
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

    // Calculate totals for each category
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

    // Filter data based on selected filters
    const filteredData = CATEGORY_STRUCTURE.filter(genderGroup => {
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

    // Color classes for Gender and Category cells - Light Theme
    const genderColors = {
      female: 'bg-[rgba(196,151,90,0.12)] text-[#C4975A]',
      male: 'bg-[rgba(196,151,90,0.08)] text-[#C4975A]'
    };

    const categoryColors = [
      'bg-[#FBF9F7] text-[#C4975A]',
      'bg-[#FFFFFF] text-[#C4975A]',
      'bg-[rgba(196,151,90,0.05)] text-[#C4975A]',
      'bg-[#FBF9F7] text-[#C4975A]',
      'bg-[#FFFFFF] text-[#C4975A]'
    ];

    // Get selected filter labels for display
    const getSelectedLabel = (options, value) => {
      const option = options.find(o => o.id === value);
      return option ? option.name : 'Select...';
    };

    return (
      <div>
        {/* Filter Section */}
        <div className="px-6 py-4 bg-[#FBF9F7] border-b border-[#E8E2DB]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#6B5D4F]">
              <Filter size={16} />
              <span className="font-medium text-sm font-['Montserrat']">{t('planningDetail.filters')}</span>
            </div>

            {/* Gender Filter */}
            <div className="relative" ref={genderDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsGenderDropdownOpen(!isGenderDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                  setIsSubCategoryDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg hover:border-[rgba(196,151,90,0.25)] hover:bg-[rgba(196,151,90,0.08)] transition-all min-w-[150px]"
              >
                <Users size={14} className="text-[#C4975A]" />
                <span className="text-sm font-medium text-[#2C2417] flex-1 text-left truncate">
                  {getSelectedLabel(filterOptions.genders, genderFilter)}
                </span>
                <ChevronDown size={16} className={`text-[#8C8178] transition-transform ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGenderDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg shadow-[0_4px_12px_rgba(44,36,23,0.06)] z-50 overflow-hidden">
                  {filterOptions.genders.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleGenderFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 hover:bg-[rgba(196,151,90,0.08)] cursor-pointer transition-colors"
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
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsGenderDropdownOpen(false);
                  setIsSubCategoryDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg hover:border-[rgba(196,151,90,0.25)] hover:bg-[rgba(196,151,90,0.08)] transition-all min-w-[180px]"
              >
                <Tag size={14} className="text-[#C4975A]" />
                <span className="text-sm font-medium text-[#2C2417] flex-1 text-left truncate">
                  {getSelectedLabel(filterOptions.categories, categoryFilter)}
                </span>
                <ChevronDown size={16} className={`text-[#8C8178] transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg shadow-[0_4px_12px_rgba(44,36,23,0.06)] z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                  {filteredCategoryOptions.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleCategoryFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 hover:bg-[rgba(196,151,90,0.08)] cursor-pointer transition-colors"
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
            <div className="relative" ref={subCategoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen);
                  setIsGenderDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg hover:border-[rgba(196,151,90,0.25)] hover:bg-[rgba(196,151,90,0.08)] transition-all min-w-[180px]"
              >
                <Layers size={14} className="text-[#1B6B45]" />
                <span className="text-sm font-medium text-[#2C2417] flex-1 text-left truncate">
                  {getSelectedLabel(filterOptions.subCategories, subCategoryFilter)}
                </span>
                <ChevronDown size={16} className={`text-[#8C8178] transition-transform ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSubCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-lg shadow-[0_4px_12px_rgba(44,36,23,0.06)] z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                  {filteredSubCategoryOptions.map(option => (
                    <div
                      key={option.id}
                      onClick={() => handleSubCategoryFilterChange(option.id)}
                      className="px-4 py-2.5 flex items-center gap-2 hover:bg-[rgba(196,151,90,0.08)] cursor-pointer transition-colors"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={headerClass}>
                <th className={`${headerCellClass} text-left min-w-[120px]`}>{t('planningDetail.gender')}</th>
                <th className={`${headerCellClass} text-left min-w-[150px]`}>{t('planningDetail.category')}</th>
                <th className={`${headerCellClass} text-left min-w-[120px]`}>{t('planningDetail.subCategory')}</th>
                <th className={headerCellClass}>{t('planningDetail.pctBuySP25')}</th>
                <th className={headerCellClass}>{t('planningDetail.pctSalesSP25')}</th>
                <th className={headerCellClass}>{t('planningDetail.pctSTSP25')}</th>
                <th className={`${headerCellClass} bg-[rgba(196,151,90,0.15)]`}>{t('planningDetail.pctBuyProposed')}</th>
                <th className={headerCellClass}>{t('planningDetail.dollarOtbProposed')}</th>
                <th className={headerCellClass}>{t('planningDetail.pctVar2025_2026')}</th>
                <th className={headerCellClass}>{t('planningDetail.otbSubmitted')}</th>
                <th className={headerCellClass}>{t('planningDetail.pctBuyActual')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((genderGroup) => {
                const genderTotals = calculateGenderTotals(genderGroup);
                const genderColorClass = genderColors[genderGroup.gender.id] || 'bg-[#FBF9F7] text-[#2C2417]';

                return (
                  <>
                    {/* Gender Total Row */}
                    <tr key={`total-${genderGroup.gender.id}`} className={`${sumRowClass}`}>
                      <td className="px-4 py-3 uppercase font-bold font-['Montserrat']" colSpan={3}>
                        {t('planningDetail.total')} {genderGroup.gender.name.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.buyPct}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.salesPct}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.stPct}%</td>
                      <td className="px-4 py-3 text-center bg-[rgba(27,107,69,0.3)] font-['JetBrains_Mono']">{genderTotals.buyProposed}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.otbProposed.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-center font-['JetBrains_Mono'] ${genderTotals.varPct < 0 ? 'text-[#DC3545]' : ''}`}>{genderTotals.varPct}%</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.otbSubmitted.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-['JetBrains_Mono']">{genderTotals.buyActual}%</td>
                    </tr>

                    {/* Categories and SubCategories */}
                    {genderGroup.categories.map((cat, catIdx) => {
                      const catTotals = calculateCategoryTotals(genderGroup.gender.id, cat);
                      const categoryColorClass = categoryColors[catIdx % categoryColors.length];

                      return (
                        <>
                          {/* Sub Category Rows */}
                          {cat.subCategories.map((subCat, subIdx) => {
                            const cellKey = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
                            const rowData = localData[cellKey] || {};
                            const isEditing = editingCell === cellKey;

                            return (
                              <tr key={cellKey} className="border-b border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.05)] transition-colors">
                                {/* Gender column - only show on first row of first category */}
                                {catIdx === 0 && subIdx === 0 ? (
                                  <td
                                    className={`px-4 py-2.5 font-semibold border-r border-[#E8E2DB] ${genderColorClass}`}
                                    rowSpan={genderGroup.categories.reduce((sum, c) => sum + c.subCategories.length + 1, 0)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users size={14} />
                                      {genderGroup.gender.name}
                                    </div>
                                  </td>
                                ) : null}

                                {/* Category column - only show on first subcat row */}
                                {subIdx === 0 ? (
                                  <td
                                    className={`px-4 py-2.5 font-medium border-r border-[#E8E2DB] ${categoryColorClass}`}
                                    rowSpan={cat.subCategories.length + 1}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Tag size={12} />
                                      {cat.name}
                                    </div>
                                  </td>
                                ) : null}

                                <td className="px-4 py-2.5 text-[#6B5D4F]">{subCat.name}</td>
                                <td className="px-4 py-2.5 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{rowData.buyPct || 0}%</td>
                                <td className="px-4 py-2.5 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{rowData.salesPct || 0}%</td>
                                <td className="px-4 py-2.5 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{rowData.stPct || 0}%</td>
                                <td className={`px-4 py-2.5 ${isReadOnly ? 'bg-[#FBF9F7]' : 'bg-[rgba(196,151,90,0.08)]'}`}>
                                  <EditableCell
                                    cellKey={cellKey}
                                    value={rowData.buyProposed || 0}
                                    isEditing={isEditing}
                                    editValue={editValue}
                                    onStartEdit={handleStartEdit}
                                    onSaveEdit={handleSaveEdit}
                                    onChangeValue={setEditValue}
                                    onKeyDown={handleKeyDown}
                                    readOnly={isReadOnly}
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-center text-[#2C2417] font-['JetBrains_Mono']">{(rowData.otbProposed || 0).toLocaleString()}</td>
                                <td className={`px-4 py-2.5 text-center font-['JetBrains_Mono'] ${(rowData.varPct || 0) < 0 ? 'text-[#DC3545]' : 'text-[#6B5D4F]'}`}>
                                  {rowData.varPct || 0}%
                                </td>
                                <td className="px-4 py-2.5 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{(rowData.otbSubmitted || 0).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-center text-[#6B5D4F] font-['JetBrains_Mono']">{rowData.buyActual || 0}%</td>
                              </tr>
                            );
                          })}

                          {/* Category Subtotal Row */}
                          <tr key={`subtotal-${genderGroup.gender.id}-${cat.id}`} className="bg-[rgba(27,107,69,0.10)] border-l-4 border-[#1B6B45] font-medium">
                            <td className="px-4 py-2.5 text-[#1B6B45] italic text-right pr-6">{t('planningDetail.subtotal')}</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.buyPct}%</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.salesPct}%</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.stPct}%</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] bg-[rgba(27,107,69,0.15)] font-['JetBrains_Mono']">{catTotals.buyProposed}%</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.otbProposed.toLocaleString()}</td>
                            <td className={`px-4 py-2.5 text-center font-['JetBrains_Mono'] ${catTotals.varPct < 0 ? 'text-[#DC3545]' : 'text-[#1B6B45]'}`}>
                              {catTotals.varPct}%
                            </td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.otbSubmitted.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-center text-[#1B6B45] font-['JetBrains_Mono']">{catTotals.buyActual}%</td>
                          </tr>
                        </>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!selectedBudgetDetail) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="bg-[#FAF8F5] rounded-2xl shadow-[0_8px_32px_rgba(44,36,23,0.06)] w-full max-w-7xl max-h-[90vh] flex flex-col transform animate-in zoom-in-95 duration-300 border border-[#E8E2DB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#C4975A] px-8 py-5 flex items-center justify-between relative overflow-hidden rounded-t-2xl">
          <div className="relative z-10 flex items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#FFFFFF] flex items-center gap-3 font-['Montserrat']">
                <TrendingUp size={22} />
                {t('planningDetail.title')}
              </h2>
              <p className="text-[#FFFFFF]/70 text-sm mt-1">
                {selectedBudgetDetail.budget?.groupBrandName} - {selectedBudgetDetail.budget?.seasonGroupId} {selectedBudgetDetail.budget?.seasonName}
              </p>
            </div>

            {/* Version Dropdown */}
            <div className="relative" ref={versionDropdownRef}>
              <button
                type="button"
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedVersion === 'draft'
                    ? 'bg-[#D97706] text-white hover:bg-[#D97706]/90 shadow-lg'
                    : 'bg-[#1B6B45] text-white hover:bg-[#1B6B45]/90 shadow-lg'
                }`}
              >
                {selectedVersion === 'draft' ? (
                  <>
                    <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
                    <span>{t('planningDetail.draftEditing')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Version {versions.find(v => v.id === selectedVersion)?.versionNumber}</span>
                  </>
                )}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVersionDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#FFFFFF] border-2 border-[#E8E2DB] rounded-xl shadow-[0_8px_24px_rgba(44,36,23,0.06)] z-[9999] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Draft Option */}
                  <div
                    onClick={() => {
                      setSelectedVersion('draft');
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:pl-6 ${
                      selectedVersion === 'draft'
                        ? 'bg-[rgba(217,119,6,0.10)] border-l-4 border-[#D97706]'
                        : 'hover:bg-[rgba(196,151,90,0.08)]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedVersion === 'draft' ? 'bg-[rgba(217,119,6,0.15)]' : 'bg-[#FBF9F7]'}`}>
                      <Sparkles size={16} className={selectedVersion === 'draft' ? 'text-[#D97706]' : 'text-[#8C8178]'} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${selectedVersion === 'draft' ? 'text-[#D97706]' : 'text-[#2C2417]'}`}>
                        {t('planningDetail.draftCurrent')}
                      </div>
                      <div className="text-xs text-[#8C8178]">{t('planningDetail.editableVersion')}</div>
                    </div>
                    {selectedVersion === 'draft' && <Check size={18} className="text-[#D97706]" />}
                  </div>

                  {/* Divider */}
                  {versions.length > 0 && (
                    <div className="px-4 py-2 bg-[#FBF9F7] border-y border-[#E8E2DB]">
                      <span className="text-xs font-semibold text-[#8C8178] uppercase tracking-wide flex items-center gap-2">
                        <History size={12} />
                        {t('planningDetail.approvedVersions')} ({versions.length})
                      </span>
                    </div>
                  )}

                  {/* Version List */}
                  <div className="max-h-[200px] overflow-y-auto">
                    {versions.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[#8C8178] text-sm">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        {t('planningDetail.noApprovedVersions')}
                      </div>
                    ) : (
                      versions.slice().reverse().map((version, idx) => (
                        <div
                          key={version.id}
                          onClick={() => {
                            setSelectedVersion(version.id);
                            setIsVersionDropdownOpen(false);
                          }}
                          className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:pl-6 animate-in fade-in slide-in-from-right ${
                            selectedVersion === version.id
                              ? 'bg-[rgba(27,107,69,0.10)] border-l-4 border-[#1B6B45]'
                              : 'hover:bg-[rgba(196,151,90,0.08)]'
                          }`}
                          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                        >
                          <div className={`p-1.5 rounded-lg ${selectedVersion === version.id ? 'bg-[rgba(27,107,69,0.15)]' : 'bg-[#FBF9F7]'}`}>
                            <CheckCircle2 size={16} className={selectedVersion === version.id ? 'text-[#1B6B45]' : 'text-[#8C8178]'} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${selectedVersion === version.id ? 'text-[#1B6B45]' : 'text-[#2C2417]'}`}>
                              Version {version.versionNumber}
                            </div>
                            <div className="text-xs text-[#8C8178] flex items-center gap-1">
                              <Clock size={10} />
                              {formatDate(version.createdAt)}
                            </div>
                          </div>
                          {selectedVersion === version.id && <Check size={18} className="text-[#1B6B45]" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.15)] rounded-xl p-2.5 transition-all duration-300 hover:rotate-90"
          >
            <X size={22} />
          </button>
        </div>

        {/* Read-only indicator when viewing approved version */}
        {isReadOnly && (
          <div className="px-6 py-3 bg-[#1B6B45] text-white flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
            <CheckCircle2 size={16} />
            <span>{t('planningDetail.viewingApprovedVersion', { version: versions.find(v => v.id === selectedVersion)?.versionNumber })}</span>
            <button
              onClick={() => setSelectedVersion('draft')}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
            >
              {t('planningDetail.switchToDraft')}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[#E8E2DB] px-6 bg-[#FBF9F7]">
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all duration-200 font-['Montserrat'] ${
                    isActive
                      ? 'border-[#C4975A] text-[#C4975A] bg-[#FFFFFF] -mb-px rounded-t-lg'
                      : 'border-transparent text-[#8C8178] hover:text-[#C4975A] hover:bg-[rgba(196,151,90,0.08)] rounded-t-lg'
                  }`}
                >
                  <Icon size={16} />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint for editable cells */}
        {!isReadOnly && (
          <div className="px-6 py-2 bg-[rgba(196,151,90,0.08)] border-b border-[#E8E2DB] flex items-center gap-2 text-sm text-[#C4975A] animate-in fade-in slide-in-from-top duration-300">
            <Pencil size={14} className="animate-bounce" style={{ animationDuration: '2s' }} />
            <span>{t('planningDetail.editHint')}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#FFFFFF]">
          {activeTab === 'collection' && renderCollectionTab()}
          {activeTab === 'gender' && renderGenderTab()}
          {activeTab === 'category' && renderCategoryTab()}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E8E2DB] px-6 py-4 flex items-center justify-between bg-[#FBF9F7] rounded-b-2xl">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-[#8C8178]">{t('planningDetail.totalBudget')}</span>
              <span className="ml-2 font-bold text-[#C4975A] font-['JetBrains_Mono']">
                {formatCurrency(selectedBudgetDetail.budget?.totalBudget || 0)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-[#8C8178]">{t('planningDetail.allocated')}</span>
              <span className="ml-2 font-bold text-[#1B6B45] font-['JetBrains_Mono']">
                {formatCurrency(grandTotals.otbValue)}
              </span>
            </div>
            {versions.length > 0 && (
              <div className="text-sm animate-in fade-in slide-in-from-left duration-300">
                <span className="text-[#8C8178]">{t('planningDetail.versions')}</span>
                <span className="ml-2 font-bold text-[#C4975A] font-['JetBrains_Mono']">
                  {versions.length} {t('planningDetail.approved')}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-[#E8E2DB] rounded-lg font-medium text-[#6B5D4F] hover:bg-[rgba(196,151,90,0.08)] hover:border-[rgba(196,151,90,0.25)] hover:text-[#C4975A] transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {t('common.cancel')}
            </button>

            {/* Approve Button - only show when in draft mode */}
            {!isReadOnly && (
              <button
                onClick={handleApprove}
                disabled={approveAnimation}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 relative overflow-hidden ${
                  approveAnimation
                    ? 'bg-[#1B6B45] text-white shadow-lg'
                    : 'bg-[#1B6B45] text-white hover:bg-[#1B6B45]/90 shadow-lg'
                }`}
              >
                {approveAnimation ? (
                  <>
                    <CheckCircle2 size={16} className="animate-bounce" />
                    <span>{t('planningDetail.versionCreated', { version: versions.length })}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{t('planningDetail.approve')}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onSave}
              disabled={isReadOnly}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden ${
                isReadOnly
                  ? 'bg-[#E8E2DB] text-[#8C8178] cursor-not-allowed shadow-none'
                  : 'bg-[#C4975A] text-[#FFFFFF] hover:bg-[#C4975A]/90'
              }`}
            >
              <Save size={16} />
              {t('planningDetail.savePlanning')}
            </button>
          </div>
        </div>

        {/* Approve Success Overlay Animation */}
        {approveAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="animate-in zoom-in duration-300 bg-[#1B6B45] text-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-[#1B6B45]">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <div className="text-xl font-bold font-['Montserrat']">{t('planningDetail.versionApproved', { version: versions.length })}</div>
              <div className="text-white/70 text-sm">{t('planningDetail.planningDataSaved')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningDetailModal;
