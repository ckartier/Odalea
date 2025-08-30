import createContextHook from '@nkzw/create-context-hook';
import { useMessaging } from '@/hooks/messaging-store';
import { useCatSitter, CatSitterMessage } from '@/hooks/cat-sitter-store';
import { useAuth } from '@/hooks/user-store';

export interface UnifiedMessage {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: 'regular' | 'cat-sitter';
  bookingId?: string;
}

export interface UnifiedConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  type: 'regular' | 'cat-sitter';
  bookingId?: string;
}

export const [UnifiedMessagingContext, useUnifiedMessaging] = createContextHook(() => {
  const { user } = useAuth();
  const { conversations, getConversationUser } = useMessaging();
  const { messages: catSitterMessages, markMessageAsRead } = useCatSitter();

  const getAllMessages = (): UnifiedMessage[] => {
    const regularMessages: UnifiedMessage[] = [];
    const catSitterUnifiedMessages: UnifiedMessage[] = catSitterMessages.map(msg => ({
      id: msg.id,
      fromId: msg.fromId,
      fromName: msg.fromName,
      fromAvatar: msg.fromAvatar,
      message: msg.message,
      timestamp: msg.timestamp,
      isRead: msg.isRead,
      type: 'cat-sitter' as const,
      bookingId: msg.bookingId,
    }));

    return [...regularMessages, ...catSitterUnifiedMessages].sort((a, b) => b.timestamp - a.timestamp);
  };

  const getAllConversations = (): UnifiedConversation[] => {
    const regularConversations: UnifiedConversation[] = conversations.map(conv => {
      const user = getConversationUser(conv.id);
      return {
        id: conv.id,
        userId: conv.participants.find(p => p !== user?.id) || '',
        userName: user?.name || 'Utilisateur inconnu',
        userAvatar: user?.photo,
        lastMessage: conv.lastMessage?.content || '',
        lastMessageTime: conv.lastMessage?.timestamp || 0,
        unreadCount: conv.unreadCount,
        type: 'regular' as const,
      };
    });

    // Group cat-sitter messages by sender
    const catSitterConversations = new Map<string, UnifiedConversation>();
    
    catSitterMessages.forEach(msg => {
      if (msg.fromId === 'me') return; // Skip own messages
      
      const existingConv = catSitterConversations.get(msg.fromId);
      if (!existingConv || msg.timestamp > existingConv.lastMessageTime) {
        catSitterConversations.set(msg.fromId, {
          id: `cat-sitter-${msg.fromId}`,
          userId: msg.fromId,
          userName: msg.fromName,
          userAvatar: msg.fromAvatar,
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          unreadCount: catSitterMessages.filter(m => m.fromId === msg.fromId && !m.isRead).length,
          type: 'cat-sitter' as const,
          bookingId: msg.bookingId,
        });
      }
    });

    const allConversations = [...regularConversations, ...Array.from(catSitterConversations.values())];
    return allConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  };

  const getUnreadCount = (): number => {
    const regularUnread = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    const catSitterUnread = catSitterMessages.filter(msg => !msg.isRead && msg.fromId !== 'me').length;
    return regularUnread + catSitterUnread;
  };

  const getConversationMessages = (conversationId: string): UnifiedMessage[] => {
    if (conversationId.startsWith('cat-sitter-')) {
      const userId = conversationId.replace('cat-sitter-', '');
      return catSitterMessages
        .filter(msg => msg.fromId === userId || (msg.fromId === 'me' && conversationId.includes(userId)))
        .map(msg => ({
          id: msg.id,
          fromId: msg.fromId,
          fromName: msg.fromName,
          fromAvatar: msg.fromAvatar,
          message: msg.message,
          timestamp: msg.timestamp,
          isRead: msg.isRead,
          type: 'cat-sitter' as const,
          bookingId: msg.bookingId,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Handle regular conversations here if needed
    return [];
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (conversationId.startsWith('cat-sitter-')) {
      const userId = conversationId.replace('cat-sitter-', '');
      const unreadMessages = catSitterMessages.filter(msg => msg.fromId === userId && !msg.isRead);
      
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
    }
    // Handle regular conversations here if needed
  };

  return {
    getAllMessages,
    getAllConversations,
    getUnreadCount,
    getConversationMessages,
    markConversationAsRead,
  };
});