'use client';

import { useState } from 'react';
import {
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  MapPin,
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
const DEMO_STORES = [
  {
    id: '1',
    code: 'REX',
    name: 'Rex Store',
    isActive: true,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    code: 'TTP',
    name: 'TTP Store',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    code: 'DAFC_HQ',
    name: 'DAFC Headquarters',
    isActive: true,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    code: 'OUTLET_1',
    name: 'Outlet Store 1',
    isActive: false,
    createdAt: new Date('2024-03-20'),
  },
];

interface StoreItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>(DEMO_STORES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    isActive: true,
  });

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newStore: StoreItem = {
      id: Date.now().toString(),
      code: formData.code.toUpperCase().replace(/\s+/g, '_'),
      name: formData.name,
      isActive: formData.isActive,
      createdAt: new Date(),
    };

    setStores([...stores, newStore]);
    setFormData({ code: '', name: '', isActive: true });
    setIsAddDialogOpen(false);
    toast.success('Store created successfully');
  };

  const handleEdit = () => {
    if (!editingStore || !formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStores(
      stores.map((s) =>
        s.id === editingStore.id
          ? {
              ...s,
              code: formData.code.toUpperCase().replace(/\s+/g, '_'),
              name: formData.name,
              isActive: formData.isActive,
            }
          : s
      )
    );
    setEditingStore(null);
    setFormData({ code: '', name: '', isActive: true });
    toast.success('Store updated successfully');
  };

  const handleDelete = (id: string) => {
    setStores(stores.filter((s) => s.id !== id));
    toast.success('Store deleted successfully');
  };

  const openEditDialog = (store: StoreItem) => {
    setEditingStore(store);
    setFormData({
      code: store.code,
      name: store.name,
      isActive: store.isActive,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Store className="w-6 h-6" style={{ color: '#B8860B' }} />
            Stores
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage physical store locations for budget and order allocation
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#127749] hover:bg-[#0d5a36]">
              <Plus className="w-4 h-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Store</DialogTitle>
              <DialogDescription>
                Create a new store location
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
                  placeholder="e.g., REX, TTP"
                />
                <p className="text-xs text-muted-foreground">
                  Short code for the store (auto-uppercase)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Rex Store"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stores</p>
                <p className="text-2xl font-semibold">{stores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Stores</p>
                <p className="text-2xl font-semibold">
                  {stores.filter((s) => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive Stores</p>
                <p className="text-2xl font-semibold">
                  {stores.filter((s) => !s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
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
          <CardTitle>All Stores</CardTitle>
          <CardDescription>
            {filteredStores.length} store(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {store.code}
                  </TableCell>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={store.isActive ? 'default' : 'secondary'}
                      className={
                        store.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {store.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {store.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(store)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(store.id)}
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
              {filteredStores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No stores found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingStore}
        onOpenChange={(open) => !open && setEditingStore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>
              Update store details
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
                placeholder="e.g., REX, TTP"
              />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Rex Store"
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
            <Button variant="outline" onClick={() => setEditingStore(null)}>
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
