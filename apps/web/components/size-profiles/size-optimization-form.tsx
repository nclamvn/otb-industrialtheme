'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Info, TrendingUp, History } from 'lucide-react';
import type { SizeProfile, OptimizeSizeProfileParams } from '@/types/size-profile';
import { SizeDistributionChart } from './size-distribution-chart';

interface SizeOptimizationFormProps {
  categories: { id: string; name: string }[];
  seasons?: { id: string; name: string }[];
  locations?: { id: string; name: string }[];
  historicalProfiles: SizeProfile[];
  trendProfiles: SizeProfile[];
  onOptimize: (params: OptimizeSizeProfileParams) => Promise<SizeProfile>;
  isLoading?: boolean;
}

export function SizeOptimizationForm({
  categories,
  seasons = [],
  locations = [],
  historicalProfiles,
  trendProfiles,
  onOptimize,
  isLoading = false,
}: SizeOptimizationFormProps) {
  const [categoryId, setCategoryId] = useState<string>('');
  const [seasonId, setSeasonId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [historicalProfileId, setHistoricalProfileId] = useState<string>('');
  const [trendProfileId, setTrendProfileId] = useState<string>('');
  const [historicalWeight, setHistoricalWeight] = useState(40);
  const [optimizedProfile, setOptimizedProfile] = useState<SizeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trendWeight = 100 - historicalWeight;

  const selectedHistorical = historicalProfiles.find((p) => p.id === historicalProfileId);
  const selectedTrend = trendProfiles.find((p) => p.id === trendProfileId);

  const handleOptimize = async () => {
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setError(null);
    try {
      const result = await onOptimize({
        categoryId,
        seasonId: seasonId || undefined,
        locationId: locationId || undefined,
        historicalProfileId: historicalProfileId || undefined,
        trendProfileId: trendProfileId || undefined,
        historicalWeight: historicalWeight / 100,
        trendWeight: trendWeight / 100,
      });
      setOptimizedProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Size Profile Optimizer
          </CardTitle>
          <CardDescription>
            Generate optimal size distribution based on historical data and current trends.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Context Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {seasons.length > 0 && (
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Select value={seasonId} onValueChange={setSeasonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All seasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All seasons</SelectItem>
                      {seasons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {locations.length > 0 && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All locations</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Profile Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                Historical Profile (Optional)
              </Label>
              <Select value={historicalProfileId} onValueChange={setHistoricalProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect from data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-detect</SelectItem>
                  {historicalProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Trend Profile (Optional)
              </Label>
              <Select value={trendProfileId} onValueChange={setTrendProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect from data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-detect</SelectItem>
                  {trendProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weight Adjustment */}
          <div className="space-y-4">
            <Label>Weight Distribution</Label>
            <div className="px-2">
              <Slider
                value={[historicalWeight]}
                onValueChange={([v]) => setHistoricalWeight(v)}
                max={100}
                step={5}
                className="my-4"
              />
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                <span>Historical: {historicalWeight}%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Trend: {trendWeight}%</span>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Higher historical weight favors past performance. Higher trend weight favors recent
                patterns. Default 40/60 balances stability with responsiveness.
              </AlertDescription>
            </Alert>
          </div>

          <Button onClick={handleOptimize} disabled={isLoading || !categoryId} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Optimal Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <div className="space-y-4">
        {/* Preview selected profiles */}
        <div className="grid gap-4">
          {selectedHistorical && (
            <SizeDistributionChart
              data={selectedHistorical.sizeDistribution}
              title={`Historical: ${selectedHistorical.name}`}
              height={150}
              showValues={false}
              color="#3b82f6"
            />
          )}
          {selectedTrend && (
            <SizeDistributionChart
              data={selectedTrend.sizeDistribution}
              title={`Trend: ${selectedTrend.name}`}
              height={150}
              showValues={false}
              color="#22c55e"
            />
          )}
        </div>

        {/* Optimized Result */}
        {optimizedProfile && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Sparkles className="h-5 w-5" />
                Optimized Profile
              </CardTitle>
              <CardDescription>{optimizedProfile.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <SizeDistributionChart
                data={optimizedProfile.sizeDistribution}
                title="Recommended Distribution"
                height={200}
                color="#a855f7"
              />
            </CardContent>
          </Card>
        )}

        {!optimizedProfile && !selectedHistorical && !selectedTrend && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a category and click optimize to generate a recommended size profile.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
