'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  Package,
  FileText,
  Clock,
  CheckCheck,
  User,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isOwn: boolean;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: { name: string; url: string; type: string }[];
}

interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  avatar?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalValue: number;
  currency: string;
  itemCount: number;
  expectedDate: string;
  createdAt: string;
}

interface SupplierCommunicationHubProps {
  suppliers: Supplier[];
  currentUserId: string;
  currentUserName: string;
  onSendMessage?: (supplierId: string, message: string, attachments?: File[]) => Promise<void>;
  onLoadMessages?: (supplierId: string) => Promise<Message[]>;
  onLoadPOs?: (supplierId: string) => Promise<PurchaseOrder[]>;
  className?: string;
}

// ════════════════════════════════════════
// Status Config
// ════════════════════════════════════════

const PO_STATUS = {
  DRAFT: { label: 'Nháp', color: 'bg-gray-500' },
  SENT: { label: 'Đã gửi', color: 'bg-blue-500' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-[#127749]' },
  SHIPPED: { label: 'Đang vận chuyển', color: 'bg-purple-500' },
  DELIVERED: { label: 'Đã nhận', color: 'bg-[#127749]' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-500' },
} as const;

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function SupplierCommunicationHub({
  suppliers,
  currentUserId,
  currentUserName,
  onSendMessage,
  onLoadMessages,
  onLoadPOs,
  className,
}: SupplierCommunicationHubProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load messages when supplier changes
  useEffect(() => {
    if (selectedSupplier && onLoadMessages) {
      onLoadMessages(selectedSupplier.id).then(setMessages);
    }
    if (selectedSupplier && onLoadPOs) {
      onLoadPOs(selectedSupplier.id).then(setPurchaseOrders);
    }
  }, [selectedSupplier, onLoadMessages, onLoadPOs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedSupplier) return;

    setIsSending(true);
    try {
      await onSendMessage?.(selectedSupplier.id, newMessage);

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: newMessage,
          senderId: currentUserId,
          senderName: currentUserName,
          isOwn: true,
          timestamp: new Date().toISOString(),
          status: 'sent',
        },
      ]);
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={cn('flex h-[600px] bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* ── Supplier List ── */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4" style={{ color: '#B8860B' }} />
            Nhà cung cấp
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhà cung cấp..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSuppliers.map((supplier) => (
            <button
              key={supplier.id}
              onClick={() => setSelectedSupplier(supplier)}
              className={cn(
                'w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
                selectedSupplier?.id === supplier.id && 'bg-muted'
              )}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={supplier.avatar} />
                <AvatarFallback className="bg-[#B8860B]/10 text-[#B8860B]">
                  {supplier.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{supplier.name}</span>
                  {supplier.unreadCount > 0 && (
                    <Badge className="bg-[#B8860B] text-white text-[10px] h-5 min-w-[20px]">
                      {supplier.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{supplier.code}</p>
                {supplier.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {supplier.lastMessage}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col">
        {selectedSupplier ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedSupplier.avatar} />
                  <AvatarFallback className="bg-[#B8860B]/10 text-[#B8860B]">
                    {selectedSupplier.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedSupplier.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedSupplier.contactPerson}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 w-fit">
                <TabsTrigger value="chat" className="gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-1.5">
                  <Package className="w-4 h-4" />
                  Đơn hàng
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-1.5">
                  <FileText className="w-4 h-4" />
                  Thông tin
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          msg.isOwn
                            ? 'bg-[#B8860B] text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        {!msg.isOwn && (
                          <p className="text-[10px] font-medium mb-1 opacity-70">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {msg.isOwn && msg.status === 'read' && (
                            <CheckCheck className="w-3 h-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="min-h-[40px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || isSending}
                      className="flex-shrink-0 bg-[#B8860B] hover:bg-[#9a7209]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="flex-1 overflow-y-auto m-0 p-4">
                <div className="space-y-3">
                  {purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      className="p-4 rounded-lg border border-border hover:border-[#B8860B]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-semibold">{po.poNumber}</span>
                        <Badge className={cn('text-white', PO_STATUS[po.status].color)}>
                          {PO_STATUS[po.status].label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Giá trị:</span>{' '}
                          <span className="font-mono">
                            {po.totalValue.toLocaleString('vi-VN')} {po.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Số mặt hàng:</span>{' '}
                          <span>{po.itemCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dự kiến:</span>{' '}
                          <span>
                            {new Date(po.expectedDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>Chưa có đơn hàng nào</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="flex-1 overflow-y-auto m-0 p-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: '#B8860B' }} />
                      Thông tin liên hệ
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSupplier.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedSupplier.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Chọn nhà cung cấp để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierCommunicationHub;
