import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Send, RefreshCw, AlertTriangle, Stethoscope } from 'lucide-react-native';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/theme/tokens';
import { useActivePetWithData } from '@/hooks/active-pet-store';
import { useVetAssistant, analyzeRiskLevel, VetMessage } from '@/hooks/vet-assistant-store';
import { Pet } from '@/types';

const DISCLAIMER_TEXT = "Cet assistant fournit des conseils généraux. Il ne remplace pas un vétérinaire.";

const EMERGENCY_ALERT = "⚠️ Cela peut être sérieux.\n\nConsulte un vétérinaire en urgence.\n\nEn attendant, garde ton animal au calme et surveille-le attentivement.";

const MEDICAL_ADVICE_BLOCKED = "Je ne peux pas fournir de diagnostic, prescription ou dosage de médicaments.\n\nPour toute question médicale, consulte un vétérinaire professionnel.";

function formatPetContext(pet: Pet): string {
  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'âge inconnu';
  const gender = pet.gender === 'male' ? 'mâle' : 'femelle';
  
  return `Animal: ${pet.name}, ${pet.type} ${pet.breed ? `(${pet.breed})` : ''}, ${gender}, ${age}`;
}

function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  
  if (years > 0) {
    return years === 1 ? '1 an' : `${years} ans`;
  }
  if (months > 0) {
    return months === 1 ? '1 mois' : `${months} mois`;
  }
  return 'moins d\'un mois';
}

function buildSystemPrompt(pet: Pet): string {
  const petContext = formatPetContext(pet);
  
  return `Tu es un assistant vétérinaire bienveillant pour l'application Odalea. Tu fournis UNIQUEMENT des conseils généraux sur le bien-être animal.

CONTEXTE ANIMAL ACTUEL:
${petContext}

=== RÈGLES NON NÉGOCIABLES ===
Tu ne dois JAMAIS:
- Faire de diagnostic médical
- Prescrire de médicaments
- Donner de dosage ou posologie
- Interpréter des analyses, radios ou examens
- Gérer des urgences médicales
- Recommander des traitements médicaux spécifiques

Si on te demande un diagnostic, médicament, dosage ou interprétation d'analyse:
Réponds: "Je ne peux pas fournir ce type de conseil médical. Consulte un vétérinaire professionnel."

=== DOMAINES AUTORISÉS ===
- Alimentation et nutrition générale
- Comportement animal
- Activité physique et exercice
- Hygiène et toilettage
- Prévention santé (rappels vaccins, vermifuges)
- Conseils du quotidien

=== TON ET STYLE ===
- Ton calme, pédagogique et rassurant
- Langage simple et accessible
- Phrases courtes et claires
- TOUJOURS terminer par: "Si les symptômes persistent ou s'aggravent, consulte un vétérinaire."

Réponds en français.`;
}

interface MessageBubbleProps {
  message: VetMessage;
  isEmergency?: boolean;
}

const MessageBubble = React.memo(({ message, isEmergency }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.messageBubble,
      isUser ? styles.userBubble : styles.assistantBubble,
      isEmergency && styles.emergencyBubble,
    ]}>
      {!isUser && (
        <View style={styles.assistantHeader}>
          <View style={[styles.assistantIcon, isEmergency && styles.emergencyIcon]}>
            {isEmergency ? (
              <AlertTriangle size={14} color="#FFFFFF" />
            ) : (
              <Stethoscope size={14} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.assistantLabel}>Assistant vétérinaire</Text>
        </View>
      )}
      <Text style={[
        styles.messageText,
        isUser ? styles.userMessageText : styles.assistantMessageText,
      ]}>
        {message.content}
      </Text>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default function VetAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { activePet } = useActivePetWithData();
  const { getMessagesForPet, addMessage, startNewConversation } = useVetAssistant();
  
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<VetMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  const systemPrompt = useMemo(() => {
    if (!activePet) return '';
    return buildSystemPrompt(activePet);
  }, [activePet]);

  const { messages: agentMessages, sendMessage, setMessages } = useRorkAgent({
    tools: {},
  });

  useEffect(() => {
    if (activePet) {
      const history = getMessagesForPet(activePet.id);
      setLocalMessages(history);
    }
  }, [activePet, getMessagesForPet]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [localMessages, agentMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activePet || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const riskAnalysis = analyzeRiskLevel(userMessage);
    const isEmergency = riskAnalysis.isEmergency;
    const requiresMedicalAdvice = riskAnalysis.requiresMedicalAdvice;

    addMessage(activePet.id, {
      role: 'user',
      content: userMessage,
    });

    setLocalMessages(prev => [...prev, {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }]);

    try {
      let responseText = '';
      let shouldBlockAI = false;

      if (isEmergency) {
        responseText = EMERGENCY_ALERT;
        shouldBlockAI = true;
        console.log('[VetAssistant][BLOCKED] Emergency detected - AI response blocked');
      } else if (requiresMedicalAdvice) {
        responseText = MEDICAL_ADVICE_BLOCKED;
        shouldBlockAI = true;
        console.log('[VetAssistant][BLOCKED] Medical advice request - AI response blocked');
      }

      if (!shouldBlockAI) {
        const contextMessage = `${systemPrompt}\n\nQuestion de l'utilisateur: ${userMessage}`;
        
        await sendMessage(contextMessage);

        const lastResponse = agentMessages.filter(m => m.role === 'assistant').pop();
        
        if (lastResponse) {
          for (const part of lastResponse.parts) {
            if (part.type === 'text') {
              responseText += part.text;
            }
          }
        }

        if (!responseText) {
          responseText = "Je suis désolé, je n'ai pas pu traiter votre question. Veuillez réessayer ou consulter un vétérinaire si votre question est urgente.";
        }
      }

      addMessage(activePet.id, {
        role: 'assistant',
        content: responseText,
        isEmergencyAlert: isEmergency || requiresMedicalAdvice,
      });

      setLocalMessages(prev => [...prev, {
        id: `resp_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        isEmergencyAlert: isEmergency || requiresMedicalAdvice,
      }]);

    } catch (error) {
      console.error('[VetAssistant] Error sending message:', error);
      
      const errorResponse = "Une erreur s'est produite. Veuillez réessayer. Si votre question est urgente, contactez directement un vétérinaire.";
      
      addMessage(activePet.id, {
        role: 'assistant',
        content: errorResponse,
      });

      setLocalMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: errorResponse,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, activePet, isLoading, systemPrompt, sendMessage, agentMessages, addMessage]);

  const handleNewConversation = useCallback(() => {
    if (!activePet) return;
    
    Alert.alert(
      'Nouvelle conversation',
      'Voulez-vous effacer l\'historique et commencer une nouvelle conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            startNewConversation(activePet.id);
            setLocalMessages([]);
            setMessages([]);
          },
        },
      ]
    );
  }, [activePet, startNewConversation, setMessages]);

  const handleSelectPet = useCallback(() => {
    router.push('/pet/add');
  }, [router]);

  if (!activePet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Conseils vétérinaires' }} />
        <View style={styles.noPetContainer}>
          <View style={styles.noPetIconContainer}>
            <Stethoscope size={48} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.noPetTitle}>Aucun animal sélectionné</Text>
          <Text style={styles.noPetSubtitle}>
            Pour utiliser l&apos;assistant vétérinaire, vous devez d&apos;abord ajouter un animal à votre profil.
          </Text>
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={handleSelectPet}
            activeOpacity={0.8}
          >
            <Text style={styles.addPetButtonText}>Ajouter un animal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Conseils vétérinaires',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleNewConversation}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <RefreshCw size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }} 
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.disclaimerBanner}>
          <AlertTriangle size={16} color={COLORS.warning} />
          <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
        </View>

        <View style={styles.petContextBanner}>
          <Text style={styles.petContextText}>
            {formatPetContext(activePet)}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {localMessages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Stethoscope size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.welcomeTitle}>Bonjour !</Text>
              <Text style={styles.welcomeSubtitle}>
                Je suis votre assistant vétérinaire. Posez-moi vos questions sur l&apos;alimentation, le comportement, l&apos;hygiène ou la prévention santé de {activePet.name}.
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Exemples de questions :</Text>
                {[
                  `Quelle alimentation pour ${activePet.name} ?`,
                  'Comment entretenir son pelage ?',
                  'À quelle fréquence le vermifuger ?',
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => setInput(suggestion)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {localMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isEmergency={message.isEmergencyAlert}
            />
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>L&apos;assistant réfléchit...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.m }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Posez votre question..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Send size={20} color={input.trim() && !isLoading ? COLORS.textInverse : COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerButton: {
    padding: SPACING.s,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  disclaimerText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  petContextBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  petContextText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textInverse,
    textAlign: 'center' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.l,
    gap: SPACING.m,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  emergencyBubble: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  assistantIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyIcon: {
    backgroundColor: COLORS.danger,
  },
  assistantLabel: {
    ...TYPOGRAPHY.captionSemibold,
    color: COLORS.textSecondary,
  },
  messageText: {
    ...TYPOGRAPHY.body,
  },
  userMessageText: {
    color: COLORS.textInverse,
  },
  assistantMessageText: {
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.card,
  },
  loadingText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.s,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.s,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.divider,
  },
  noPetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['3xl'],
  },
  noPetIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  noPetTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
    textAlign: 'center' as const,
  },
  noPetSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: SPACING.xl,
  },
  addPetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.button,
  },
  addPetButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  welcomeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  welcomeTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.xl,
  },
  suggestionsContainer: {
    width: '100%',
    gap: SPACING.s,
  },
  suggestionsTitle: {
    ...TYPOGRAPHY.captionSemibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  suggestionChip: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  suggestionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
  },
});
