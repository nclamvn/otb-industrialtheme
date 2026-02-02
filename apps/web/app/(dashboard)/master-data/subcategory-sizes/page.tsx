'use client';

import { useState } from 'react';
import {
  Ruler,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Demo categories
const DEMO_CATEGORIES = [
  { id: 'cat-1', name: "Women's RTW", code: 'WOMENS_RTW' },
  { id: 'cat-2', name: "Men's RTW", code: 'MENS_RTW' },
  { id: 'cat-3', name: 'Accessories', code: 'ACCESSORIES' },
  { id: 'cat-4', name: 'Shoes', code: 'SHOES' },
];

// Demo subcategories
const DEMO_SUBCATEGORIES = [
  { id: 'sub-1', name: 'W Outerwear', code: 'W_OUTERWEAR', categoryId: 'cat-1' },
  { id: 'sub-2', name: 'W Tops', code: 'W_TOPS', categoryId: 'cat-1' },
  { id: 'sub-3', name: 'W Bottoms', code: 'W_BOTTOMS', categoryId: 'cat-1' },
  { id: 'sub-4', name: 'M Tops', code: 'M_TOPS', categoryId: 'cat-2' },
  { id: 'sub-5', name: 'M Bottoms', code: 'M_BOTTOMS', categoryId: 'cat-2' },
  { id: 'sub-6', name: 'Bags', code: 'BAGS', categoryId: 'cat-3' },
  { id: 'sub-7', name: 'Women Shoes', code: 'SHOES_W', categoryId: 'cat-4' },
  { id: 'sub-8', name: 'Men Shoes', code: 'SHOES_M', categoryId: 'cat-4' },
];

// Demo subcategory sizes (matching SQL schema)
const DEMO_SUBCATEGORY_SIZES = [
  // Women's RTW - Outerwear sizes
  { id: '1', size: '0044', subcategoryId: 'sub-1', isActive: true, sortOrder: 1 },
  { id: '2', size: '0046', subcategoryId: 'sub-1', isActive: true, sortOrder: 2 },
  { id: '3', size: '0048', subcategoryId: 'sub-1', isActive: true, sortOrder: 3 },
  { id: '4', size: '0050', subcategoryId: 'sub-1', isActive: true, sortOrder: 4 },
  { id: '5', size: '0052', subcategoryId: 'sub-1', isActive: true, sortOrder: 5 },
  // Women's RTW - Tops sizes
  { id: '6', size: 'XS', subcategoryId: 'sub-2', isActive: true, sortOrder: 1 },
  { id: '7', size: 'S', subcategoryId: 'sub-2', isActive: true, sortOrder: 2 },
  { id: '8', size: 'M', subcategoryId: 'sub-2', isActive: true, sortOrder: 3 },
  { id: '9', size: 'L', subcategoryId: 'sub-2', isActive: true, sortOrder: 4 },
  { id: '10', size: 'XL', subcategoryId: 'sub-2', isActive: true, sortOrder: 5 },
  // Men's RTW - Tops sizes
  { id: '11', size: '46', subcategoryId: 'sub-4', isActive: true, sortOrder: 1 },
  { id: '12', size: '48', subcategoryId: 'sub-4', isActive: true, sortOrder: 2 },
  { id: '13', size: '50', subcategoryId: 'sub-4', isActive: true, sortOrder: 3 },
  { id: '14', size: '52', subcategoryId: 'sub-4', isActive: true, sortOrder: 4 },
  { id: '15', size: '54', subcategoryId: 'sub-4', isActive: true, sortOrder: 5 },
  // Shoes - Women sizes
  { id: '16', size: '35', subcategoryId: 'sub-7', isActive: true, sortOrder: 1 },
  { id: '17', size: '36', subcategoryId: 'sub-7', isActive: true, sortOrder: 2 },
  { id: '18', size: '37', subcategoryId: 'sub-7', isActive: true, sortOrder: 3 },
  { id: '19', size: '38', subcategoryId: 'sub-7', isActive: true, sortOrder: 4 },
  { id: '20', size: '39', subcategoryId: 'sub-7', isActive: true, sortOrder: 5 },
  { id: '21', size: '40', subcategoryId: 'sub-7', isActive: true, sortOrder: 6 },
  // Bags - One size
  { id: '22', size: 'ONE SIZE', subcategoryId: 'sub-6', isActive: true, sortOrder: 1 },
];

interface SubcategorySize {
  id: string;
  size: string;
  subcategoryId: string;
  isActive: boolean;
  sortOrder: number;
}

export default function SubcategorySizesPage() {
  const [sizes, setSizes] = useState<SubcategorySize[]>(DEMO_SUBCATEGORY_SIZES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<SubcategorySize | null>(null);
  const [formData, setFormData] = useState({
    size: '',
    subcategoryId: '',
    isActive: true,
    sortOrder: 0,
  });

  // Filter subcategories based on selected category
  const filteredSubcategories =
    selectedCategory === 'all'
      ? DEMO_SUBCATEGORIES
      : DEMO_SUBCATEGORIES.filter((s) => s.categoryId === selectedCategory);

  // Get subcategory info
  const getSubcategory = (id: string) =>
    DEMO_SUBCATEGORIES.find((s) => s.id === id);

  const getCategory = (subcategoryId: string) => {
    const subcategory = getSubcategory(subcategoryId);
    return subcategory
      ? DEMO_CATEGORIES.find((c) => c.id === subcategory.categoryId)
      : null;
  };

  // Filter sizes
  const filteredSizes = sizes.filter((s) => {
    const matchesSearch = s.size.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcategory =
      selectedSubcategory === 'all' || s.subcategoryId === selectedSubcategory;
    const subcategory = getSubcategory(s.subcategoryId);
    const matchesCategory =
      selectedCategory === 'all' ||
      (subcategory && subcategory.categoryId === selectedCategory);

    return matchesSearch && matchesSubcategory && matchesCategory;
  });

  // Group sizes by subcategory for display
  const groupedSizes = filteredSizes.reduce((acc, size) => {
    const subcategory = getSubcategory(size.subcategoryId);
    const key = subcategory?.name || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(size);
    return acc;
  }, {} as Record<string, SubcategorySize[]>);

  const handleAdd = () => {
    if (!formData.size || !formData.subcategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate size in same subcategory
    const exists = sizes.some(
      (s) => s.subcategoryId === formData.subcategoryId && s.size === formData.size
    );
    if (exists) {
      toast.error('This size already exists for this subcategory');
      return;
    }

    const maxSortOrder = Math.max(
      0,
      ...sizes
        .filter((s) => s.subcategoryId === formData.subcategoryId)
        .map((s) => s.sortOrder)
    );

    const newSize: SubcategorySize = {
      id: Date.now().toString(),
      size: formData.size.toUpperCase(),
      subcategoryId: formData.subcategoryId,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder || maxSortOrder + 1,
    };

    setSizes([...sizes, newSize]);
    setFormData({ size: '', subcategoryId: '', isActive: true, sortOrder: 0 });
    setIsAddDialogOpen(false);
    toast.success('Size created successfully');
  };

  const handleEdit = () => {
    if (!editingSize || !formData.size || !formData.subcategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSizes(
      sizes.map((s) =>
        s.id === editingSize.id
          ? {
              ...s,
              size: formData.size.toUpperCase(),
              subcategoryId: formData.subcategoryId,
              isActive: formData.isActive,
              sortOrder: formData.sortOrder,
            }
          : s
      )
    );
    setEditingSize(null);
    setFormData({ size: '', subcategoryId: '', isActive: true, sortOrder: 0 });
    toast.success('Size updated successfully');
  };

  const handleDelete = (id: string) => {
    setSizes(sizes.filter((s) => s.id !== id));
    toast.success('Size deleted successfully');
  };

  const openEditDialog = (size: SubcategorySize) => {
    setEditingSize(size);
    setFormData({
      size: size.size,
      subcategoryId: size.subcategoryId,
      isActive: size.isActive,
      sortOrder: size.sortOrder,
    });
  };

  const handleBulkAdd = () => {
    // Open bulk add dialog
    toast.info('Bulk add feature coming soon');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Ruler className="w-6 h-6" style={{ color: '#B8860B' }} />
            Subcategory Sizes
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage available sizes for each subcategory (e.g., 0044, 0046 for Women's RTW)
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#127749] hover:bg-[#0d5a36]">
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subcategory Size</DialogTitle>
                <DialogDescription>
                  Add a new size option for a subcategory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={
                      DEMO_SUBCATEGORIES.find(
                        (s) => s.id === formData.subcategoryId
                      )?.categoryId || ''
                    }
                    onValueChange={(value) => {
                      // Reset subcategory when category changes
                      setFormData({ ...formData, subcategoryId: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory *</Label>
                  <Select
                    value={formData.subcategoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subcategoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_SUBCATEGORIES.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size *</Label>
                  <Input
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    placeholder="e.g., 0044, XS, 36"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be auto-converted to uppercase
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) })
                    }
                    placeholder="Auto-assigned if empty"
                    min={0}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="bg-[#127749] hover:bg-[#0d5a36]">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DEMO_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSubcategory}
              onValueChange={setSelectedSubcategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {filteredSubcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Size Tables */}
      {Object.entries(groupedSizes).map(([subcategoryName, subcategorySizes]) => {
        const subcategory = DEMO_SUBCATEGORIES.find((s) => s.name === subcategoryName);
        const category = subcategory
          ? DEMO_CATEGORIES.find((c) => c.id === subcategory.categoryId)
          : null;

        return (
          <Card key={subcategoryName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {subcategoryName}
                    <Badge variant="secondary" className="font-normal">
                      {subcategorySizes.length} size(s)
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {category?.name} • {subcategory?.code}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subcategorySizes
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((size) => (
                    <div
                      key={size.id}
                      className={`
                        group relative px-4 py-2 rounded-lg border transition-all
                        ${
                          size.isActive
                            ? 'bg-background hover:border-[#127749] hover:shadow-sm'
                            : 'bg-muted/50 opacity-60'
                        }
                      `}
                    >
                      <span className="font-mono font-medium">{size.size}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm border"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(size)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(size.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {Object.keys(groupedSizes).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No sizes found. Add sizes for subcategories to get started.
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSize}
        onOpenChange={(open) => !open && setEditingSize(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Size</DialogTitle>
            <DialogDescription>
              Update size details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subcategory *</Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subcategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_SUBCATEGORIES.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size *</Label>
              <Input
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
                placeholder="e.g., 0044, XS, 36"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder || ''}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: Number(e.target.value) })
                }
                min={0}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSize(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#127749] hover:bg-[#0d5a36]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
