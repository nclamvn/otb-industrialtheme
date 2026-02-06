'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronRight,
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Demo data matching SQL schema
const DEMO_GROUP_BRANDS = [
  {
    id: '1',
    code: 'BRAND_GROUP_A',
    name: 'Brand Group A',
    isActive: true,
    brandsCount: 3,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    code: 'BRAND_GROUP_B',
    name: 'Brand Group B',
    isActive: true,
    brandsCount: 2,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    code: 'BRAND_GROUP_C',
    name: 'Brand Group C',
    isActive: false,
    brandsCount: 1,
    createdAt: new Date('2024-03-10'),
  },
];

interface GroupBrand {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  brandsCount: number;
  createdAt: Date;
}

export default function GroupBrandsPage() {
  const [groupBrands, setGroupBrands] = useState<GroupBrand[]>(DEMO_GROUP_BRANDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGroupBrand, setEditingGroupBrand] = useState<GroupBrand | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    isActive: true,
  });

  const filteredGroupBrands = groupBrands.filter(
    (gb) =>
      gb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gb.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newGroupBrand: GroupBrand = {
      id: Date.now().toString(),
      code: formData.code.toUpperCase().replace(/\s+/g, '_'),
      name: formData.name,
      isActive: formData.isActive,
      brandsCount: 0,
      createdAt: new Date(),
    };

    setGroupBrands([...groupBrands, newGroupBrand]);
    setFormData({ code: '', name: '', isActive: true });
    setIsAddDialogOpen(false);
    toast.success('Group Brand created successfully');
  };

  const handleEdit = () => {
    if (!editingGroupBrand || !formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGroupBrands(
      groupBrands.map((gb) =>
        gb.id === editingGroupBrand.id
          ? {
              ...gb,
              code: formData.code.toUpperCase().replace(/\s+/g, '_'),
              name: formData.name,
              isActive: formData.isActive,
            }
          : gb
      )
    );
    setEditingGroupBrand(null);
    setFormData({ code: '', name: '', isActive: true });
    toast.success('Group Brand updated successfully');
  };

  const handleDelete = (id: string) => {
    const groupBrand = groupBrands.find((gb) => gb.id === id);
    if (groupBrand && groupBrand.brandsCount > 0) {
      toast.error('Cannot delete group brand with associated brands');
      return;
    }
    setGroupBrands(groupBrands.filter((gb) => gb.id !== id));
    toast.success('Group Brand deleted successfully');
  };

  const openEditDialog = (groupBrand: GroupBrand) => {
    setEditingGroupBrand(groupBrand);
    setFormData({
      code: groupBrand.code,
      name: groupBrand.name,
      isActive: groupBrand.isActive,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="w-6 h-6" style={{ color: '#B8860B' }} />
            Group Brands
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage brand groups for approval workflows and budget allocation
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#127749] hover:bg-[#0d5a36]">
              <Plus className="w-4 h-4 mr-2" />
              Add Group Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Group Brand</DialogTitle>
              <DialogDescription>
                Create a new group brand for organizing brands
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., BRAND_GROUP_A"
                />
                <p className="text-xs text-muted-foreground">
                  Will be auto-formatted to uppercase with underscores
                </p>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Brand Group A"
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search group brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Group Brands</CardTitle>
          <CardDescription>
            {filteredGroupBrands.length} group brand(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brands</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroupBrands.map((groupBrand) => (
                <TableRow key={groupBrand.id}>
                  <TableCell className="font-mono text-sm">
                    {groupBrand.code}
                  </TableCell>
                  <TableCell className="font-medium">{groupBrand.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {groupBrand.brandsCount} brand(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={groupBrand.isActive ? 'default' : 'secondary'}
                      className={
                        groupBrand.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {groupBrand.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {groupBrand.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(groupBrand)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(groupBrand.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGroupBrands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No group brands found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingGroupBrand}
        onOpenChange={(open) => !open && setEditingGroupBrand(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group Brand</DialogTitle>
            <DialogDescription>
              Update group brand details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., BRAND_GROUP_A"
              />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Brand Group A"
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
            <Button variant="outline" onClick={() => setEditingGroupBrand(null)}>
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
