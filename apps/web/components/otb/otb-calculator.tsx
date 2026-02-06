'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Package,
  ShoppingCart,
  Percent,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage helper
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

interface OTBInputs {
  plannedSales: number;
  plannedMarkdowns: number;
  plannedEOMInventory: number;
  bomInventory: number;
  onOrder: number;
  // Additional metrics
  plannedReceipts?: number;
  stockToSalesRatio?: number;
  turnoverRate?: number;
}

interface Scenario {
  id: string;
  name: string;
  inputs: OTBInputs;
  isActive: boolean;
}

interface OTBCalculatorProps {
  totalBudget: number;
  initialInputs?: Partial<OTBInputs>;
  onSave?: (inputs: OTBInputs, otbValue: number) => void;
  readOnly?: boolean;
  className?: string;
}

const defaultInputs: OTBInputs = {
  plannedSales: 0,
  plannedMarkdowns: 0,
  plannedEOMInventory: 0,
  bomInventory: 0,
  onOrder: 0,
  plannedReceipts: 0,
  stockToSalesRatio: 2.5,
  turnoverRate: 4,
};

export function OTBCalculator({
  totalBudget,
  initialInputs = {},
  onSave,
  readOnly = false,
  className,
}: OTBCalculatorProps) {
  const [inputs, setInputs] = useState<OTBInputs>({
    ...defaultInputs,
    ...initialInputs,
  });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeTab, setActiveTab] = useState('calculator');

  // Calculate OTB using standard formula
  // OTB = Planned Sales + Planned Markdowns + Planned EOM Inventory - BOM Inventory - On Order
  const otbCalculation = useMemo(() => {
    const otb =
      inputs.plannedSales +
      inputs.plannedMarkdowns +
      inputs.plannedEOMInventory -
      inputs.bomInventory -
      inputs.onOrder;

    const budgetUtilization = totalBudget > 0 ? (otb / totalBudget) * 100 : 0;
    const isOverBudget = otb > totalBudget;
    const variance = totalBudget - otb;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    // Calculate derived metrics
    const gmroi = inputs.plannedSales > 0 && inputs.bomInventory > 0
      ? (inputs.plannedSales - (inputs.plannedSales * 0.4)) / ((inputs.bomInventory + inputs.plannedEOMInventory) / 2)
      : 0;

    const sellThrough = inputs.bomInventory > 0
      ? (inputs.plannedSales / inputs.bomInventory) * 100
      : 0;

    const weeksOfSupply = inputs.plannedSales > 0
      ? (inputs.plannedEOMInventory / (inputs.plannedSales / 4))
      : 0;

    return {
      otb,
      budgetUtilization,
      isOverBudget,
      variance,
      variancePercent,
      gmroi,
      sellThrough,
      weeksOfSupply,
      status: isOverBudget ? 'over' : variancePercent > 20 ? 'under' : 'optimal',
    };
  }, [inputs, totalBudget]);

  // Update input handler
  const handleInputChange = useCallback((field: keyof OTBInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setInputs({ ...defaultInputs, ...initialInputs });
  }, [initialInputs]);

  // Auto-calculate suggested values based on budget
  const handleAutoCalculate = useCallback(() => {
    const suggestedSales = totalBudget * 0.6;
    const suggestedMarkdowns = suggestedSales * 0.15;
    const suggestedEOM = totalBudget * 0.35;
    const suggestedBOM = totalBudget * 0.3;
    const suggestedOnOrder = totalBudget * 0.1;

    setInputs({
      plannedSales: Math.round(suggestedSales),
      plannedMarkdowns: Math.round(suggestedMarkdowns),
      plannedEOMInventory: Math.round(suggestedEOM),
      bomInventory: Math.round(suggestedBOM),
      onOrder: Math.round(suggestedOnOrder),
      stockToSalesRatio: 2.5,
      turnoverRate: 4,
    });
  }, [totalBudget]);

  // Add scenario
  const addScenario = useCallback(() => {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      inputs: { ...inputs },
      isActive: false,
    };
    setScenarios([...scenarios, newScenario]);
  }, [inputs, scenarios]);

  // Remove scenario
  const removeScenario = useCallback((id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  }, [scenarios]);

  // Load scenario
  const loadScenario = useCallback((scenario: Scenario) => {
    setInputs({ ...scenario.inputs });
  }, []);

  // Calculate scenario OTB
  const calculateScenarioOTB = useCallback((scenarioInputs: OTBInputs) => {
    return (
      scenarioInputs.plannedSales +
      scenarioInputs.plannedMarkdowns +
      scenarioInputs.plannedEOMInventory -
      scenarioInputs.bomInventory -
      scenarioInputs.onOrder
    );
  }, []);

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'over':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Over Budget
          </Badge>
        );
      case 'under':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
            <TrendingDown className="h-3 w-3" />
            Under-utilized
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Optimal
          </Badge>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              OTB Calculator
            </CardTitle>
            <CardDescription>
              Open-To-Buy planning and analysis
            </CardDescription>
          </div>
          {getStatusBadge(otbCalculation.status)}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="what-if">What-If Analysis</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Budget</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalBudget)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">OTB Amount</span>
                  </div>
                  <p className={cn(
                    'text-2xl font-bold mt-1',
                    otbCalculation.isOverBudget ? 'text-red-600' : 'text-green-600'
                  )}>
                    {formatCurrency(otbCalculation.otb)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Utilization</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {formatPercent(otbCalculation.budgetUtilization)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {otbCalculation.variance >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-muted-foreground">Variance</span>
                  </div>
                  <p className={cn(
                    'text-2xl font-bold mt-1',
                    otbCalculation.variance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(Math.abs(otbCalculation.variance))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* OTB Formula Visualization */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">OTB Formula</p>
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {formatCurrency(inputs.plannedSales)}
                  </Badge>
                  <span>+</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {formatCurrency(inputs.plannedMarkdowns)}
                  </Badge>
                  <span>+</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {formatCurrency(inputs.plannedEOMInventory)}
                  </Badge>
                  <span>-</span>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {formatCurrency(inputs.bomInventory)}
                  </Badge>
                  <span>-</span>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {formatCurrency(inputs.onOrder)}
                  </Badge>
                  <span>=</span>
                  <Badge className={cn(
                    'text-base px-3 py-1',
                    otbCalculation.isOverBudget ? 'bg-red-600' : 'bg-green-600'
                  )}>
                    {formatCurrency(otbCalculation.otb)}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                  <span>Sales</span>
                  <span>+</span>
                  <span>Markdowns</span>
                  <span>+</span>
                  <span>EOM Inv.</span>
                  <span>-</span>
                  <span>BOM Inv.</span>
                  <span>-</span>
                  <span>On Order</span>
                  <span>=</span>
                  <span className="font-medium">OTB</span>
                </div>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedSales" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Planned Sales
                </Label>
                <CurrencyInput
                  value={inputs.plannedSales}
                  onChange={(val) => handleInputChange('plannedSales', val || 0)}
                  disabled={readOnly}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">Expected sales for the period</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedMarkdowns" className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-yellow-600" />
                  Planned Markdowns
                </Label>
                <CurrencyInput
                  value={inputs.plannedMarkdowns}
                  onChange={(val) => handleInputChange('plannedMarkdowns', val || 0)}
                  disabled={readOnly}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">Expected markdown reductions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEOMInventory" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Planned EOM Inventory
                </Label>
                <CurrencyInput
                  value={inputs.plannedEOMInventory}
                  onChange={(val) => handleInputChange('plannedEOMInventory', val || 0)}
                  disabled={readOnly}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">Target end-of-month inventory</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bomInventory" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  BOM Inventory
                </Label>
                <CurrencyInput
                  value={inputs.bomInventory}
                  onChange={(val) => handleInputChange('bomInventory', val || 0)}
                  disabled={readOnly}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">Beginning-of-month inventory</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onOrder" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                  On Order
                </Label>
                <CurrencyInput
                  value={inputs.onOrder}
                  onChange={(val) => handleInputChange('onOrder', val || 0)}
                  disabled={readOnly}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">Currently on order (not received)</p>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Utilization</span>
                <span className={cn(
                  otbCalculation.budgetUtilization > 100 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatPercent(otbCalculation.budgetUtilization)}
                </span>
              </div>
              <Progress
                value={Math.min(100, otbCalculation.budgetUtilization)}
                className={cn('h-3', otbCalculation.budgetUtilization > 100 && 'bg-red-100')}
              />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">GMROI</p>
                <p className="text-lg font-bold">{otbCalculation.gmroi.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Sell-Through</p>
                <p className="text-lg font-bold">{formatPercent(otbCalculation.sellThrough)}</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Weeks of Supply</p>
                <p className="text-lg font-bold">{otbCalculation.weeksOfSupply.toFixed(1)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {!readOnly && (
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAutoCalculate}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Auto Calculate
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addScenario}>
                    <Copy className="h-4 w-4 mr-2" />
                    Save as Scenario
                  </Button>
                  {onSave && (
                    <Button onClick={() => onSave(inputs, otbCalculation.otb)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save OTB Plan
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* What-If Analysis Tab */}
          <TabsContent value="what-if" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sales Impact Analysis</CardTitle>
                <CardDescription>Adjust sales to see OTB impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sales Adjustment</span>
                    <span>{formatPercent((inputs.plannedSales / (totalBudget * 0.6)) * 100 - 100)}</span>
                  </div>
                  <Slider
                    value={[inputs.plannedSales]}
                    onValueChange={([value]) => handleInputChange('plannedSales', value)}
                    min={0}
                    max={totalBudget}
                    step={1000}
                    disabled={readOnly}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>{formatCurrency(totalBudget)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Current OTB</p>
                    <p className="text-lg font-bold">{formatCurrency(otbCalculation.otb)}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Budget Remaining</p>
                    <p className={cn(
                      'text-lg font-bold',
                      otbCalculation.variance >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(otbCalculation.variance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inventory Level Analysis</CardTitle>
                <CardDescription>Adjust EOM inventory target</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>EOM Inventory</span>
                    <span>{formatCurrency(inputs.plannedEOMInventory)}</span>
                  </div>
                  <Slider
                    value={[inputs.plannedEOMInventory]}
                    onValueChange={([value]) => handleInputChange('plannedEOMInventory', value)}
                    min={0}
                    max={totalBudget * 0.5}
                    step={1000}
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>BOM Inventory</span>
                    <span>{formatCurrency(inputs.bomInventory)}</span>
                  </div>
                  <Slider
                    value={[inputs.bomInventory]}
                    onValueChange={([value]) => handleInputChange('bomInventory', value)}
                    min={0}
                    max={totalBudget * 0.5}
                    step={1000}
                    disabled={readOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Markdown Strategy</CardTitle>
                <CardDescription>Adjust markdown percentage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Markdown Rate</span>
                    <span>
                      {inputs.plannedSales > 0
                        ? formatPercent((inputs.plannedMarkdowns / inputs.plannedSales) * 100)
                        : '0%'}
                    </span>
                  </div>
                  <Slider
                    value={[inputs.plannedMarkdowns]}
                    onValueChange={([value]) => handleInputChange('plannedMarkdowns', value)}
                    min={0}
                    max={inputs.plannedSales * 0.4}
                    step={500}
                    disabled={readOnly}
                  />
                  <p className="text-xs text-muted-foreground">
                    Industry average: 15-25% of sales
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Compare different OTB scenarios
              </p>
              <Button variant="outline" size="sm" onClick={addScenario}>
                <Plus className="h-4 w-4 mr-2" />
                Add Current as Scenario
              </Button>
            </div>

            {scenarios.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No scenarios saved yet.</p>
                  <p className="text-sm">Save your current inputs as a scenario to compare.</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Markdowns</TableHead>
                    <TableHead className="text-right">EOM Inv.</TableHead>
                    <TableHead className="text-right">BOM Inv.</TableHead>
                    <TableHead className="text-right">On Order</TableHead>
                    <TableHead className="text-right">OTB</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario) => {
                    const scenarioOTB = calculateScenarioOTB(scenario.inputs);
                    const isOverBudget = scenarioOTB > totalBudget;
                    return (
                      <TableRow key={scenario.id}>
                        <TableCell className="font-medium">{scenario.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(scenario.inputs.plannedSales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(scenario.inputs.plannedMarkdowns)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(scenario.inputs.plannedEOMInventory)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(scenario.inputs.bomInventory)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(scenario.inputs.onOrder)}
                        </TableCell>
                        <TableCell className={cn(
                          'text-right font-bold',
                          isOverBudget ? 'text-red-600' : 'text-green-600'
                        )}>
                          {formatCurrency(scenarioOTB)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadScenario(scenario)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeScenario(scenario.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
