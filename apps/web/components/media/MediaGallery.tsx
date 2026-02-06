'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaCard, MediaItem } from './MediaCard';
import { MediaUploader } from './MediaUploader';
import {
  Grid,
  List,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Download,
  Loader2,
} from 'lucide-react';

interface MediaGalleryProps {
  skuItemId?: string;
  styleCode?: string;
  media?: MediaItem[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onSetPrimary?: (id: string) => Promise<void>;
  onReorder?: (mediaIds: string[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function MediaGallery({
  skuItemId,
  styleCode,
  media: initialMedia = [],
  onUpload,
  onDelete,
  onSetPrimary,
  onReorder,
  isLoading = false,
  className,
}: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);
  const [zoomMedia, setZoomMedia] = useState<MediaItem | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  // Filter media
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.altText?.toLowerCase().includes(query) ||
          item.caption?.toLowerCase().includes(query) ||
          item.skuItem?.skuCode.toLowerCase().includes(query) ||
          item.skuItem?.styleName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [media, searchQuery, typeFilter, statusFilter]);

  // Sort by isPrimary first, then sortOrder
  const sortedMedia = useMemo(() => {
    return [...filteredMedia].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [filteredMedia]);

  const handleUpload = async (files: File[]) => {
    if (onUpload) {
      await onUpload(files);
      setShowUploader(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (onSetPrimary) {
      await onSetPrimary(id);
      setMedia((prev) =>
        prev.map((m) => ({
          ...m,
          isPrimary: m.id === id,
        }))
      );
    }
  };

  const handleZoom = (item: MediaItem) => {
    const index = sortedMedia.findIndex((m) => m.id === item.id);
    setZoomIndex(index);
    setZoomMedia(item);
  };

  const handleZoomNav = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? (zoomIndex - 1 + sortedMedia.length) % sortedMedia.length
        : (zoomIndex + 1) % sortedMedia.length;
    setZoomIndex(newIndex);
    setZoomMedia(sortedMedia[newIndex]);
  };

  const handleDownload = (item: MediaItem) => {
    const url = item.zoomUrl || item.originalUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.skuItem?.skuCode || 'image'}_${item.type}.jpg`;
    link.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="HERO">Hero</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="THUMBNAIL">Thumbnail</SelectItem>
              <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
              <SelectItem value="DETAIL">Detail</SelectItem>
              <SelectItem value="SWATCH">Swatch</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {onUpload && (
            <Button
              onClick={() => setShowUploader(true)}
              className="bg-[#127749] hover:bg-[#127749]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          )}
        </div>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Filter className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No images found</p>
          <p className="text-xs">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload images to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedMedia.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              onZoom={handleZoom}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMedia.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <MediaCard
                media={item}
                size="sm"
                showActions={false}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {item.skuItem?.styleName || 'Untitled'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.skuItem?.skuCode} • {item.type} • {item.status}
                </p>
                {item.altText && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.altText}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleZoom(item)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredMedia.length} of {media.length} images
        </span>
        <span>
          {media.filter((m) => m.status === 'READY').length} ready •{' '}
          {media.filter((m) => m.status === 'PROCESSING').length} processing
        </span>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>
          <MediaUploader
            onUpload={handleUpload}
            skuItemId={skuItemId}
            maxFiles={20}
          />
        </DialogContent>
      </Dialog>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomMedia} onOpenChange={() => setZoomMedia(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          {zoomMedia && (
            <div className="relative">
              {/* Image */}
              <div className="relative aspect-[3/4] max-h-[80vh]">
                <img
                  src={zoomMedia.zoomUrl || zoomMedia.originalUrl}
                  alt={zoomMedia.altText || 'Product image'}
                  className="w-full h-full object-contain bg-black"
                />
              </div>

              {/* Navigation */}
              {sortedMedia.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleZoomNav('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleZoomNav('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setZoomMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {zoomMedia.skuItem?.styleName || 'Untitled'}
                    </p>
                    <p className="text-sm text-white/80">
                      {zoomMedia.skuItem?.skuCode} • {zoomMedia.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {zoomIndex + 1} / {sortedMedia.length}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(zoomMedia)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
