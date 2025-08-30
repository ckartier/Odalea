import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useMessaging } from '@/hooks/messaging-store';
import { useAuth } from '@/hooks/auth-store';
import { Message } from '@/types';
import { ArrowUp, Info, Paperclip } from 'lucide-react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    conversations,
    getMessages, 
    sendMessage, 
    getConversationUser 
  } = useMessaging();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [quickReplies] = useState<string[]>([
    'Bonjour 👋',
    'Disponible demain ?',
    'Merci !',
    'On se parle plus tard.',
    'Parfait, merci 🙏',
    'Pouvez-vous envoyer des photos ?',
    'Je suis en déplacement, je reviens vers vous.',
    'Adresse exacte ?',
    'Quel est votre tarif ?',
  ]);
  const [attachments, setAttachments] = useState<string[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  
  let otherUser = getConversationUser(id as string);
  if (!otherUser) {
    const conv = conversations.find(c => c.id === id);
    const fallbackUserId = conv?.participants.find(pid => pid !== user?.id);
    if (fallbackUserId) {
      otherUser = { id: fallbackUserId, pseudo: 'user-' + String(fallbackUserId).slice(-4), firstName: '', lastName: '', name: '', email: '', phoneNumber: '', countryCode: '', address: '', zipCode: '', city: '', isCatSitter: false, isPremium: false, createdAt: Date.now(), pets: [] } as any;
    }
  }
  
  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const conversationMessages = await getMessages(id as string);
        setMessages(conversationMessages);
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadMessages();
    }
  }, [id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !user) return;
    try {
      await sendMessage.mutateAsync({
        conversationId: id as string,
        content: newMessage.trim() || '[media] 📎',
      });
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = user && item.senderId === user.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            SHADOWS.small,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };
  
  if (!id) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Conversation not found</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          title: `@${otherUser?.pseudo ?? 'Chat'}`,
          headerRight: () => (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => otherUser && router.push(`/profile/${otherUser.id}`)}
            >
              <Info size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maleAccent} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.header}>
                <Image
                  source={{ uri: (otherUser?.pets?.[0]?.mainPhoto as string | undefined) || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <Text style={styles.headerText}>
                  Début de votre conversation avec @{otherUser?.pseudo ?? 'utilisateur'}
                </Text>
              </View>
            }
          />
          
          <View style={styles.quickRepliesRow}>
            {quickReplies.map((qr, idx) => (
              <TouchableOpacity key={idx} style={styles.quickReplyChip} onPress={() => setNewMessage(prev => (prev ? prev + ' ' : '') + qr)}>
                <Text style={styles.quickReplyText}>{qr}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={async () => {
              try {
                const { launchImageLibraryAsync, MediaTypeOptions } = await import('expo-image-picker');
                const res = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true });
                if (!(res as any).canceled) {
                  const assets = (res as any).assets ?? [];
                  const uris = assets.map((a: any) => a.uri).filter(Boolean);
                  setAttachments(prev => [...prev, ...uris]);
                }
              } catch (e) {
                console.log('Attachment pick failed', e);
              }
            }}>
              <Paperclip size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Tapez un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              placeholderTextColor={COLORS.darkGray}
            />

            {attachments.length > 0 && (
              <View style={styles.attachmentsPreview}>
                {attachments.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.attachmentThumb} contentFit="cover" />
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() ? styles.sendButtonDisabled : null,
              ]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
            >
              <ArrowUp size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  currentUserBubble: {
    backgroundColor: '#E3F2FD',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.darkGray,
    alignSelf: 'flex-end',
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  quickReplyChip: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  quickReplyText: {
    color: COLORS.darkGray,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  attachmentThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.maleAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.darkGray,
  },
});