import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VET_CHAT_HISTORY_KEY = 'vet_chat_history';

export interface VetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEmergencyAlert?: boolean;
}

export interface PetChatHistory {
  petId: string;
  messages: VetMessage[];
  lastUpdated: number;
}

const EMERGENCY_KEYWORDS = [
  'urgence', 'urgent', 'emergency',
  'saignement', 'saigne', 'bleeding', 'blood', 'sang',
  'convulsion', 'convulsions', 'seizure', 'seizures',
  'vomissement', 'vomissements', 'vomit', 'vomiting',
  'diarrhée', 'diarrhea',
  'ne respire pas', 'respire mal', 'difficultés respiratoires', 'breathing', 'suffoque',
  'inconscient', 'unconscious', 'évanouie', 'évanouissement',
  'empoisonnement', 'poison', 'toxique', 'intoxication',
  'accident', 'voiture', 'chute grave',
  'ne bouge plus', 'paralysé', 'paralysie',
  'douleur intense', 'très mal', 'souffre beaucoup', 'hurle de douleur',
  'gonflé', 'gonflement', 'enflure',
  'ne mange plus', 'ne boit plus',
  'fièvre', 'température élevée',
];

export function detectEmergency(text: string): boolean {
  const lowerText = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export const [VetAssistantContext, useVetAssistant] = createContextHook(() => {
  const [chatHistories, setChatHistories] = useState<Record<string, PetChatHistory>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(VET_CHAT_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[VetAssistant] Loaded chat histories');
          setChatHistories(parsed);
        }
      } catch (err) {
        console.error('[VetAssistant] Error loading history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const saveHistories = useCallback(async (histories: Record<string, PetChatHistory>) => {
    try {
      await AsyncStorage.setItem(VET_CHAT_HISTORY_KEY, JSON.stringify(histories));
    } catch (err) {
      console.error('[VetAssistant] Error saving history:', err);
    }
  }, []);

  const getMessagesForPet = useCallback((petId: string): VetMessage[] => {
    return chatHistories[petId]?.messages || [];
  }, [chatHistories]);

  const addMessage = useCallback((petId: string, message: Omit<VetMessage, 'id' | 'timestamp'>) => {
    const newMessage: VetMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setChatHistories(prev => {
      const updated = {
        ...prev,
        [petId]: {
          petId,
          messages: [...(prev[petId]?.messages || []), newMessage],
          lastUpdated: Date.now(),
        },
      };
      saveHistories(updated);
      return updated;
    });

    return newMessage;
  }, [saveHistories]);

  const clearHistoryForPet = useCallback((petId: string) => {
    setChatHistories(prev => {
      const updated = { ...prev };
      delete updated[petId];
      saveHistories(updated);
      return updated;
    });
  }, [saveHistories]);

  const startNewConversation = useCallback((petId: string) => {
    setChatHistories(prev => {
      const updated = {
        ...prev,
        [petId]: {
          petId,
          messages: [],
          lastUpdated: Date.now(),
        },
      };
      saveHistories(updated);
      return updated;
    });
  }, [saveHistories]);

  return {
    chatHistories,
    isLoading,
    getMessagesForPet,
    addMessage,
    clearHistoryForPet,
    startNewConversation,
  };
});
