'use client';

import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Trash2, X } from 'lucide-react';
import { useAIChat } from './useAIChat';
import { AIChatMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';

interface AIChatPanelProps {
  planId?: string;
  onClose?: () => void;
  className?: string;
}

export function AIChatPanel({ planId, onClose, className }: AIChatPanelProps) {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useAIChat({ planId });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI Copilot
        </CardTitle>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[500px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Xin chao! Toi la AI Assistant cho OTB Planning.
              </p>
              <p className="text-xs mt-1">
                Hoi toi ve budget, margin, performance...
              </p>
            </div>
          )}

          {messages.map((message) => (
            <AIChatMessage key={message.id} message={message} />
          ))}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              Error: {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <AIChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </CardContent>
    </Card>
  );
}

export default AIChatPanel;
