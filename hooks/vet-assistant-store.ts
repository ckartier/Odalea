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
  // Urgence générale
  'urgence', 'urgent', 'emergency', 'sos', 'au secours', 'vite',
  
  // Saignement
  'saignement', 'saigne', 'bleeding', 'blood', 'sang', 'hémorragie', 'hémorragique',
  
  // Convulsions
  'convulsion', 'convulsions', 'seizure', 'seizures', 'crise', 'épilepsie', 'tremble violemment',
  
  // Vomissements répétés
  'vomissement', 'vomissements', 'vomit', 'vomiting', 'vomit sans arrêt', 'vomissements répétés',
  'vomit du sang', 'vomissements de sang',
  
  // Détresse respiratoire
  'ne respire pas', 'respire mal', 'difficultés respiratoires', 'breathing', 'suffoque',
  'suffocation', 'étouffe', 'respiration difficile', 'halète', 'dyspnée', 'apnée',
  'ne peut plus respirer', 'respiration sifflante',
  
  // Perte de conscience
  'inconscient', 'unconscious', 'évanouie', 'évanouissement', 'perte de conscience',
  'ne réagit plus', 'inanimé', 'coma', 'syncope',
  
  // Empoisonnement / Intoxication
  'empoisonnement', 'poison', 'toxique', 'intoxication', 'avalé', 'mangé du',
  'chocolat', 'antigel', 'mort aux rats', 'médicament humain', 'produit ménager',
  
  // Traumatisme / Accident
  'accident', 'voiture', 'chute grave', 'écrasé', 'percuté', 'renversé',
  'fracture', 'cassé', 'brisé', 'traumatisme',
  
  // Paralysie / Mobilité
  'ne bouge plus', 'paralysé', 'paralysie', 'ne peut plus marcher', 'pattes arrières',
  'ne se lève plus', 'effondré',
  
  // Douleur intense
  'douleur intense', 'très mal', 'souffre beaucoup', 'hurle de douleur',
  'crie de douleur', 'gémit sans arrêt', 'douleur aiguë', 'agonie',
  
  // Gonflement / Torsion
  'gonflé', 'gonflement', 'enflure', 'ventre gonflé', 'abdomen distendu',
  'torsion estomac', 'dilatation', 'ballonné',
  
  // État général critique
  'ne mange plus', 'ne boit plus', 'déshydraté', 'déshydratation',
  'fièvre', 'température élevée', 'hypothermie', 'froid',
  'faiblesse extrême', 'léthargie', 'ne répond plus',
  
  // Yeux
  'œil sorti', 'œil qui sort', 'proptose', 'globe oculaire',
  
  // Morsure / Piqûre
  'morsure serpent', 'piqûre', 'envenimation', 'réaction allergique grave', 'anaphylaxie',
  
  // Accouchement
  'accouchement difficile', 'dystocie', 'mise bas bloquée',
];

const FORBIDDEN_MEDICAL_TERMS = [
  // Médicaments
  'médicament', 'prescription', 'ordonnance', 'posologie', 'dosage',
  'antibiotique', 'anti-inflammatoire', 'cortisone', 'corticoïde',
  
  // Diagnostic
  'diagnostic', 'diagnostiquer', 'maladie', 'pathologie',
  'analyse', 'radio', 'radiographie', 'échographie', 'scanner', 'irm',
  
  // Traitements médicaux
  'opération', 'chirurgie', 'anesthésie', 'injection', 'perfusion',
];

export interface RiskDetectionResult {
  isEmergency: boolean;
  detectedKeywords: string[];
  requiresMedicalAdvice: boolean;
  suggestVetBooking: boolean;
}

export function detectEmergency(text: string): boolean {
  const result = analyzeRiskLevel(text);
  return result.isEmergency;
}

const VET_BOOKING_TRIGGERS = [
  'voir un vétérinaire',
  'consulter un vétérinaire',
  'rendez-vous vétérinaire',
  'rdv vétérinaire',
  'prendre rendez-vous',
  'besoin d\'un vétérinaire',
  'trouver un vétérinaire',
  'vétérinaire proche',
  'vétérinaire urgence',
  'clinique vétérinaire',
  'aller chez le vétérinaire',
  'emmener chez le vétérinaire',
  'consultation vétérinaire',
  'persiste',
  'ne va pas mieux',
  's\'aggrave',
  'empire',
  'inquiet',
  'inquiète',
  'préoccupé',
];

export function analyzeRiskLevel(text: string): RiskDetectionResult {
  const lowerText = text.toLowerCase();
  const detectedEmergencyKeywords: string[] = [];
  const detectedMedicalKeywords: string[] = [];
  let suggestVetBooking = false;
  
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      detectedEmergencyKeywords.push(keyword);
    }
  }
  
  for (const term of FORBIDDEN_MEDICAL_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      detectedMedicalKeywords.push(term);
    }
  }
  
  for (const trigger of VET_BOOKING_TRIGGERS) {
    if (lowerText.includes(trigger.toLowerCase())) {
      suggestVetBooking = true;
      break;
    }
  }
  
  const isEmergency = detectedEmergencyKeywords.length > 0;
  const requiresMedicalAdvice = detectedMedicalKeywords.length > 0;
  
  if (isEmergency || requiresMedicalAdvice) {
    suggestVetBooking = true;
  }
  
  if (isEmergency || requiresMedicalAdvice || suggestVetBooking) {
    logRiskDetection({
      isEmergency,
      emergencyKeywords: detectedEmergencyKeywords,
      medicalKeywords: detectedMedicalKeywords,
      suggestVetBooking,
      timestamp: Date.now(),
    });
  }
  
  return {
    isEmergency,
    detectedKeywords: [...detectedEmergencyKeywords, ...detectedMedicalKeywords],
    requiresMedicalAdvice,
    suggestVetBooking,
  };
}

function logRiskDetection(data: {
  isEmergency: boolean;
  emergencyKeywords: string[];
  medicalKeywords: string[];
  suggestVetBooking: boolean;
  timestamp: number;
}) {
  console.log('[VetAssistant][RISK] Risk detection triggered:', {
    isEmergency: data.isEmergency,
    emergencyKeywordsCount: data.emergencyKeywords.length,
    medicalKeywordsCount: data.medicalKeywords.length,
    suggestVetBooking: data.suggestVetBooking,
    keywords: [...data.emergencyKeywords, ...data.medicalKeywords],
    timestamp: new Date(data.timestamp).toISOString(),
  });
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
