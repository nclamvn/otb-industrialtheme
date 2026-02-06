'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Mic,
  MicOff,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  StopCircle,
  Database,
  Calculator,
  BarChart2,
  Bell,
  Lightbulb,
  Play,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAIAssistantChat,
  SUGGESTION_CHIPS,
  QUICK_ACTIONS,
} from '@/lib/ai/hooks';
import { useVoiceInput, VOICE_LANGUAGES } from '@/lib/ai/hooks/use-voice-input';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

// Tool icons mapping
const TOOL_ICONS: Record<string, React.ReactNode> = {
  query_data: <Database className="h-3 w-3" />,
  calculate_metrics: <Calculator className="h-3 w-3" />,
  generate_chart: <BarChart2 className="h-3 w-3" />,
  get_alerts: <Bell className="h-3 w-3" />,
  get_suggestions: <Lightbulb className="h-3 w-3" />,
  execute_action: <Play className="h-3 w-3" />,
};

// Helper to extract text content from message (supports both custom and AI SDK formats)
function getMessageContent(message: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  // First check for direct content property (our custom format)
  if (typeof message.content === 'string') {
    return message.content;
  }
  // Fall back to AI SDK v6 parts format
  if (!message.parts) return '';
  return message.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('');
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

export default function AIAssistantPage() {
  const locale = useLocale();
  const t = useTranslations('pages.aiAssistant');
  const language = locale === 'vi' ? 'vi' : 'en';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    isLoading,
    isThinking,
    toolCalls,
    conversationId,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    reload,
    stop,
    clearConversation,
    loadConversation,
  } = useAIAssistantChat({
    language,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    audioLevel,
    error: voiceError
  } = useVoiceInput({
      language: VOICE_LANGUAGES[language],
      onResult: (text) => {
        setInput(text);
      },
      onInterimResult: (text) => {
        // Show interim results in real-time while speaking
        setInput(text);
      },
      autoSubmit: true,
      onAutoSubmit: () => {
        // Submit the form automatically after voice input
        if (formRef.current && input.trim()) {
          formRef.current.requestSubmit();
        }
      },
      onError: (error) => {
        console.error('Voice input error:', error);
      },
    });

  // Update input when voice transcript changes (final result)
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  // Show voice error briefly
  useEffect(() => {
    if (voiceError) {
      // Clear error after 3 seconds
      const timer = setTimeout(() => {
        // Error will clear on next interaction
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voiceError]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations list
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/ai/chat');
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
    loadConversations();
  }, [conversationId]);

  // Handle suggestion chip click
  const handleSuggestionClick = (query: string) => {
    sendMessage(query);
  };

  // Handle conversation delete
  const handleDeleteConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/chat?conversationId=${convId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (convId === conversationId) {
          clearConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Copy message to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = SUGGESTION_CHIPS[language];
  const quickActions = QUICK_ACTIONS[language];

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-7rem)] bg-background rounded-lg overflow-hidden border">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r bg-muted/30 flex flex-col"
            >
              {/* New Chat Button */}
              <div className="p-4 border-b">
                <Button
                  onClick={clearConversation}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  {t('newChat')}
                </Button>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors',
                        conv.id === conversationId && 'bg-muted'
                      )}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{conv.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('noConversations')}
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Sidebar Footer - Language Toggle */}
              <div className="p-3 border-t flex justify-center">
                <LanguageSwitcher />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo-icon.svg"
                  alt="DAFC"
                  width={32}
                  height={32}
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="font-semibold truncate">
                    {t('title')}
                  </h1>
                </div>
              </div>
            </div>

            {/* Quick Actions - hidden on small screens */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto">
              {quickActions.map((action) => (
                <Tooltip key={action.action}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        sendMessage(`${t('showMe')} ${action.label.toLowerCase()}`)
                      }
                    >
                      {action.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                    <Image
                      src="/logo-icon.svg"
                      alt="DAFC"
                      width={40}
                      height={40}
                    />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    {t('welcomeTitle')}
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    {t('welcomeMessage')}
                  </p>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        onClick={() => handleSuggestionClick(suggestion.query)}
                      >
                        {suggestion.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' && 'flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <Card
                        className={cn(
                          'max-w-[80%]',
                          message.role === 'user' && 'bg-primary text-primary-foreground'
                        )}
                      >
                        <CardContent className="p-3">
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {getMessageContent(message)}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">
                              {getMessageContent(message)}
                            </p>
                          )}

                          {/* Message Actions */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(getMessageContent(message), message.id)
                                }
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Tool Calls Indicator */}
                  {toolCalls.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2 items-center justify-center"
                    >
                      {toolCalls.map((tool) => (
                        <Badge
                          key={tool.id}
                          variant="outline"
                          className="gap-1"
                        >
                          {TOOL_ICONS[tool.name] || <Play className="h-3 w-3" />}
                          <span className="text-xs">{tool.name.replace('_', ' ')}</span>
                          {tool.status === 'executing' && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </Badge>
                      ))}
                    </motion.div>
                  )}

                  {/* Thinking Indicator */}
                  {isThinking && !toolCalls.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              {t('thinking')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit}>
                {/* Elegant Composer */}
                <div className="flex items-center gap-1 px-2 rounded-xl border border-border bg-card transition-all">
                  {/* Voice Input Button - Inside */}
                  {isSupported && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={isListening ? stopListening : startListening}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isListening
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          {isListening ? (
                            <MicOff className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isListening ? t('stopRecording') : t('voiceInput')}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Text Input - No border */}
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={t('inputPlaceholder')}
                    disabled={isLoading}
                    className="flex-1 py-3 px-2 bg-transparent text-sm placeholder:text-muted-foreground disabled:opacity-50"
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  />

                  {/* Control Buttons - Inside */}
                  <div className="flex items-center gap-1">
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={stop}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <StopCircle className="h-5 w-5" />
                      </button>
                    ) : (
                      <>
                        {messages.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => reload()}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <RefreshCw className="h-5 w-5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('regenerate')}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <button
                          type="submit"
                          disabled={!input.trim()}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            input.trim()
                              ? 'text-primary hover:bg-primary/10'
                              : 'text-muted-foreground/50 cursor-not-allowed'
                          )}
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </form>

              {/* Voice Recording Indicator with Audio Visualizer */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-3 mt-3 py-2"
                  >
                    {/* Audio Level Visualizer Bars */}
                    <div className="flex items-end gap-[2px] h-5">
                      {[...Array(5)].map((_, i) => {
                        // Create dynamic bar heights based on audio level
                        const baseHeight = 4;
                        const maxHeight = 20;
                        const variance = [0.6, 1, 0.8, 0.9, 0.7][i];
                        const height = baseHeight + (maxHeight - baseHeight) * audioLevel * variance;
                        return (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-500 rounded-full"
                            animate={{ height }}
                            transition={{ duration: 0.1 }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {interimTranscript ? t('listening') : t('recording')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice Error Display */}
              <AnimatePresence>
                {voiceError && !isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 mt-2 text-sm text-red-500"
                  >
                    <MicOff className="h-4 w-4" />
                    {voiceError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
