'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';

interface UseAIChatOptions {
  conversationId?: string;
  language?: 'en' | 'vi';
  onError?: (error: Error) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

interface ChatState {
  isThinking: boolean;
  toolCalls: ToolCallInfo[];
  conversationId: string | null;
}

interface ToolCallInfo {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'error';
  input?: unknown;
  result?: unknown;
}

export function useAIAssistantChat(options: UseAIChatOptions = {}) {
  const { conversationId: initialConversationId, language = 'en', onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use ref for callback to avoid re-creating callbacks
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [chatState, setChatState] = useState<ChatState>({
    isThinking: false,
    toolCalls: [],
    conversationId: initialConversationId || null,
  });

  // Handle input change
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Send message to API and handle streaming response
  const sendToAPI = useCallback(
    async (messagesToSend: Message[]) => {
      setIsLoading(true);
      setError(null);
      setChatState((prev) => ({ ...prev, isThinking: true, toolCalls: [] }));

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messagesToSend.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              locale: language,
            },
            conversationId: chatState.conversationId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get conversation ID from header
        const newConversationId = response.headers.get('X-Conversation-Id');
        if (newConversationId && newConversationId !== chatState.conversationId) {
          setChatState((prev) => ({ ...prev, conversationId: newConversationId }));
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let assistantMessage = '';
        const assistantMessageId = `assistant-${Date.now()}`;

        // Add empty assistant message that we'll update
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: 'assistant', content: '', createdAt: new Date() },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;

          // Update the assistant message with new content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: assistantMessage } : m
            )
          );
        }

        setChatState((prev) => ({
          ...prev,
          isThinking: false,
          toolCalls: [],
        }));
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Request was cancelled
          return;
        }
        const error = err as Error;
        setError(error);
        onErrorRef.current?.(error);
        setChatState((prev) => ({ ...prev, isThinking: false }));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [chatState.conversationId, language]
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input.trim(),
        createdAt: new Date(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');

      await sendToAPI(newMessages);
    },
    [input, isLoading, messages, sendToAPI]
  );

  // Send message programmatically
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: new Date(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      await sendToAPI(newMessages);
    },
    [isLoading, messages, sendToAPI]
  );

  // Append message (for external use)
  const append = useCallback(
    async (message: { role: 'user' | 'assistant'; content: string }) => {
      const newMessage: Message = {
        id: `${message.role}-${Date.now()}`,
        role: message.role,
        content: message.content,
        createdAt: new Date(),
      };

      const newMessages = [...messages, newMessage];
      setMessages(newMessages);

      if (message.role === 'user') {
        await sendToAPI(newMessages);
      }
    },
    [messages, sendToAPI]
  );

  // Stop generation
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setChatState((prev) => ({ ...prev, isThinking: false }));
  }, []);

  // Reload - resend the last user message
  const reload = useCallback(async () => {
    const lastUserMessageIndex = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const messagesToKeep = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesToKeep);

    await sendToAPI(messagesToKeep);
  }, [messages, sendToAPI]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
    setChatState({
      isThinking: false,
      toolCalls: [],
      conversationId: null,
    });
  }, []);

  // Load existing conversation
  const loadConversation = useCallback(
    async (convId: string) => {
      try {
        const response = await fetch(`/api/ai/chat?conversationId=${convId}`);
        if (!response.ok) throw new Error('Failed to load conversation');

        const conversation = await response.json();
        const loadedMessages: Message[] = conversation.messages.map(
          (msg: { id: string; role: string; content: string }) => ({
            id: msg.id,
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
          })
        );

        setMessages(loadedMessages);
        setChatState((prev) => ({ ...prev, conversationId: convId }));
      } catch (err) {
        onError?.(err as Error);
      }
    },
    [onError]
  );

  return {
    // Chat state
    messages,
    input,
    isLoading,
    isThinking: chatState.isThinking,
    error,
    toolCalls: chatState.toolCalls,
    conversationId: chatState.conversationId,

    // Actions
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    append,
    reload,
    stop,
    clearConversation,
    loadConversation,
    setMessages,
  };
}

// Suggestion chips for quick actions
export const SUGGESTION_CHIPS = {
  en: [
    { label: 'Show OTB Status', query: 'Show me the current OTB status for all brands' },
    { label: 'Top Sellers', query: 'What are the top selling products this month?' },
    { label: 'Critical Alerts', query: 'Are there any critical alerts I should know about?' },
    { label: 'Buy Recommendations', query: 'Give me buy recommendations for low stock items' },
    { label: 'Sales Performance', query: 'How is our sales performance compared to plan?' },
    { label: 'Inventory Health', query: 'Show me the inventory health dashboard' },
  ],
  vi: [
    { label: 'Tình trạng OTB', query: 'Cho tôi xem tình trạng OTB hiện tại của tất cả thương hiệu' },
    { label: 'Sản phẩm bán chạy', query: 'Sản phẩm bán chạy nhất tháng này là gì?' },
    { label: 'Cảnh báo quan trọng', query: 'Có cảnh báo quan trọng nào tôi cần biết không?' },
    { label: 'Đề xuất mua hàng', query: 'Cho tôi đề xuất mua hàng cho các sản phẩm sắp hết' },
    { label: 'Hiệu suất bán hàng', query: 'Hiệu suất bán hàng của chúng ta so với kế hoạch như thế nào?' },
    { label: 'Sức khỏe tồn kho', query: 'Cho tôi xem bảng điều khiển sức khỏe tồn kho' },
  ],
};

// Quick action buttons
export const QUICK_ACTIONS = {
  en: [
    { icon: 'TrendingUp', label: 'Sales Trend', action: 'show_sales_trend' },
    { icon: 'Package', label: 'Inventory', action: 'show_inventory' },
    { icon: 'AlertCircle', label: 'Alerts', action: 'show_alerts' },
    { icon: 'Lightbulb', label: 'Suggestions', action: 'show_suggestions' },
  ],
  vi: [
    { icon: 'TrendingUp', label: 'Xu hướng', action: 'show_sales_trend' },
    { icon: 'Package', label: 'Tồn kho', action: 'show_inventory' },
    { icon: 'AlertCircle', label: 'Cảnh báo', action: 'show_alerts' },
    { icon: 'Lightbulb', label: 'Gợi ý', action: 'show_suggestions' },
  ],
};
