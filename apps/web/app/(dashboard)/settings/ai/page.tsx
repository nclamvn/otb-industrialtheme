'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Bot,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// AI Settings Page — Configure AI Provider API Keys
// DAFC OTB Platform
// ═══════════════════════════════════════════════════════════════════════════════

type AIProvider = 'claude' | 'openai' | 'auto';

interface AISettings {
  defaultProvider: AIProvider;
  claudeApiKey: string;
  claudeModel: string;
  openaiApiKey: string;
  openaiModel: string;
  enableAIFeatures: boolean;
  enableAIImport: boolean;
  enableAIAssistant: boolean;
  enablePredictiveAlerts: boolean;
}

const CLAUDE_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)' },
];

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Economy)' },
];

const DEFAULT_SETTINGS: AISettings = {
  defaultProvider: 'claude',
  claudeApiKey: '',
  claudeModel: 'claude-sonnet-4-20250514',
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
  enableAIFeatures: true,
  enableAIImport: true,
  enableAIAssistant: true,
  enablePredictiveAlerts: true,
};

export default function AISettingsPage() {
  useSession();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [testingClaude, setTestingClaude] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openaiStatus, setOpenaiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      // Load from localStorage for now (in production, use API)
      const saved = localStorage.getItem('ai_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      // Save to localStorage (in production, use API)
      localStorage.setItem('ai_settings', JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setSaving(false);
    }
  }

  async function testClaudeConnection() {
    if (!settings.claudeApiKey) return;
    setTestingClaude(true);
    setClaudeStatus('idle');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.claudeModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        setClaudeStatus('success');
      } else {
        setClaudeStatus('error');
      }
    } catch (error) {
      setClaudeStatus('error');
    } finally {
      setTestingClaude(false);
    }
  }

  async function testOpenAIConnection() {
    if (!settings.openaiApiKey) return;
    setTestingOpenAI(true);
    setOpenaiStatus('idle');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.openaiModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        setOpenaiStatus('success');
      } else {
        setOpenaiStatus('error');
      }
    } catch (error) {
      setOpenaiStatus('error');
    } finally {
      setTestingOpenAI(false);
    }
  }

  function maskApiKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••••••' + key.slice(-4);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt AI"
        description="Cấu hình API keys và tùy chọn AI cho hệ thống"
      />

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D7B797]/10">
              <Sparkles className="h-5 w-5 text-[#D7B797]" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Provider</CardTitle>
              <CardDescription>Chọn nhà cung cấp AI mặc định</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={settings.defaultProvider}
            onValueChange={(value) => setSettings({ ...settings, defaultProvider: value as AIProvider })}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="claude" id="claude" className="peer sr-only" />
              <Label
                htmlFor="claude"
                className={cn(
                  "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  "peer-data-[state=checked]:border-[#D7B797] [&:has([data-state=checked])]:border-[#D7B797]"
                )}
              >
                <Bot className="mb-3 h-6 w-6" />
                <span className="font-semibold">Claude</span>
                <span className="text-xs text-muted-foreground">Anthropic</span>
                <Badge variant="secondary" className="mt-2 text-[10px]">Mặc định</Badge>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="openai" id="openai" className="peer sr-only" />
              <Label
                htmlFor="openai"
                className={cn(
                  "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  "peer-data-[state=checked]:border-[#D7B797] [&:has([data-state=checked])]:border-[#D7B797]"
                )}
              >
                <Sparkles className="mb-3 h-6 w-6" />
                <span className="font-semibold">OpenAI</span>
                <span className="text-xs text-muted-foreground">GPT Models</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="auto" id="auto" className="peer sr-only" />
              <Label
                htmlFor="auto"
                className={cn(
                  "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  "peer-data-[state=checked]:border-[#D7B797] [&:has([data-state=checked])]:border-[#D7B797]"
                )}
              >
                <RefreshCw className="mb-3 h-6 w-6" />
                <span className="font-semibold">Auto</span>
                <span className="text-xs text-muted-foreground">Claude + Fallback</span>
                <Badge variant="outline" className="mt-2 text-[10px]">Smart</Badge>
              </Label>
            </div>
          </RadioGroup>

          {settings.defaultProvider === 'auto' && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p>Chế độ Auto: Hệ thống sẽ sử dụng Claude làm mặc định. Nếu Claude không khả dụng hoặc gặp lỗi, hệ thống sẽ tự động chuyển sang OpenAI.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claude API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Bot className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Claude API (Anthropic)</CardTitle>
                <CardDescription>Cấu hình API key cho Claude</CardDescription>
              </div>
            </div>
            {claudeStatus === 'success' && (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" /> Đã kết nối
              </Badge>
            )}
            {claudeStatus === 'error' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" /> Lỗi kết nối
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claude-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="claude-key"
                  type={showClaudeKey ? 'text' : 'password'}
                  value={settings.claudeApiKey}
                  onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                >
                  {showClaudeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={testClaudeConnection}
                disabled={!settings.claudeApiKey || testingClaude}
              >
                {testingClaude ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lấy API key tại{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[#D7B797] hover:underline">
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="claude-model">Model</Label>
            <Select
              value={settings.claudeModel}
              onValueChange={(value) => setSettings({ ...settings, claudeModel: value })}
            >
              <SelectTrigger id="claude-model">
                <SelectValue placeholder="Chọn model" />
              </SelectTrigger>
              <SelectContent>
                {CLAUDE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">OpenAI API</CardTitle>
                <CardDescription>Cấu hình API key cho OpenAI (Fallback)</CardDescription>
              </div>
            </div>
            {openaiStatus === 'success' && (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" /> Đã kết nối
              </Badge>
            )}
            {openaiStatus === 'error' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" /> Lỗi kết nối
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={testOpenAIConnection}
                disabled={!settings.openaiApiKey || testingOpenAI}
              >
                {testingOpenAI ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lấy API key tại{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#D7B797] hover:underline">
                platform.openai.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-model">Model</Label>
            <Select
              value={settings.openaiModel}
              onValueChange={(value) => setSettings({ ...settings, openaiModel: value })}
            >
              <SelectTrigger id="openai-model">
                <SelectValue placeholder="Chọn model" />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Features Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tính năng AI</CardTitle>
          <CardDescription>Bật/tắt các tính năng AI trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Features</Label>
              <p className="text-sm text-muted-foreground">Bật/tắt tất cả tính năng AI</p>
            </div>
            <Switch
              checked={settings.enableAIFeatures}
              onCheckedChange={(checked) => setSettings({ ...settings, enableAIFeatures: checked })}
            />
          </div>

          {settings.enableAIFeatures && (
            <>
              <div className="flex items-center justify-between pl-4 border-l-2 border-muted">
                <div className="space-y-0.5">
                  <Label>AI Import</Label>
                  <p className="text-sm text-muted-foreground">Tự động mapping cột khi import</p>
                </div>
                <Switch
                  checked={settings.enableAIImport}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAIImport: checked })}
                />
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-muted">
                <div className="space-y-0.5">
                  <Label>AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">Trợ lý AI chat hỗ trợ</p>
                </div>
                <Switch
                  checked={settings.enableAIAssistant}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAIAssistant: checked })}
                />
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-muted">
                <div className="space-y-0.5">
                  <Label>Predictive Alerts</Label>
                  <p className="text-sm text-muted-foreground">Cảnh báo dự đoán AI</p>
                </div>
                <Switch
                  checked={settings.enablePredictiveAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, enablePredictiveAlerts: checked })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {saveSuccess && (
          <Badge className="bg-green-500 self-center">
            <Check className="h-3 w-3 mr-1" /> Đã lưu
          </Badge>
        )}
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu cài đặt'
          )}
        </Button>
      </div>
    </div>
  );
}
