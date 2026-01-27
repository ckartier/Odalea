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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Send, RefreshCw, AlertTriangle, Stethoscope, Crown, ChevronRight, ChevronDown, Check, Calendar } from 'lucide-react-native';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/theme/tokens';
import { useActivePetWithData } from '@/hooks/active-pet-store';
import { useVetAssistant, analyzeRiskLevel, VetMessage } from '@/hooks/vet-assistant-store';
import { usePremium } from '@/hooks/premium-store';
import { useAuth } from '@/hooks/user-store';
import { logAIInteraction } from '@/services/ai-logging';
import { Pet } from '@/types';

const DISCLAIMER_TEXT = "Ces conseils sont fournis à titre informatif uniquement.\nIls ne remplacent pas l'avis d'un vétérinaire professionnel.";

const EMERGENCY_ALERT = "Cela peut être sérieux.\nNous te recommandons de consulter un vétérinaire rapidement.";

const MEDICAL_ADVICE_BLOCKED = "Je ne peux pas fournir de diagnostic, prescription ou dosage de médicaments.\n\nPour toute question médicale, consulte un vétérinaire professionnel.";



function formatPetContext(pet: Pet): string {
  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'âge inconnu';
  const gender = pet.gender === 'male' ? 'mâle' : 'femelle';
  const species = pet.type || 'animal';
  const breed = pet.breed || '';
  const color = pet.color || '';
  
  let context = `${pet.name}, ${species}`;
  if (breed) context += ` (${breed})`;
  context += `, ${gender}, ${age}`;
  if (color) context += `, ${color}`;
  
  return context;
}

function formatPetContextDetailed(pet: Pet): string {
  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'âge inconnu';
  const gender = pet.gender === 'male' ? 'mâle' : 'femelle';
  const species = pet.type || 'animal';
  
  const details: string[] = [
    `Nom: ${pet.name}`,
    `Espèce: ${species}`,
    pet.breed ? `Race: ${pet.breed}` : null,
    `Sexe: ${gender}`,
    `Âge: ${age}`,
    pet.color ? `Couleur: ${pet.color}` : null,
    pet.character?.length ? `Caractère: ${pet.character.join(', ')}` : null,
    pet.distinctiveSign ? `Signe distinctif: ${pet.distinctiveSign}` : null,
  ].filter(Boolean) as string[];
  
  return details.join('\n');
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

function buildSystemPrompt(pet: Pet, isPremium: boolean): string {
  const petContext = formatPetContextDetailed(pet);
  
  const basePrompt = `Tu es un conseiller bien-être animal pour l'application Odalea. Tu fournis UNIQUEMENT des conseils généraux et informatifs sur le bien-être animal.

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
- TOUJOURS terminer par: "Si les symptômes persistent ou s'aggravent, consulte un vétérinaire."`;

  if (isPremium) {
    return `${basePrompt}

=== MODE PREMIUM ===
L'utilisateur est membre Premium. Tu peux fournir:
- Des réponses plus détaillées et approfondies
- Des conseils personnalisés selon l'âge, la race et le profil de l'animal
- Des rappels de prévention (vaccins, vermifuges, antiparasitaires)
- Des recommandations nutritionnelles adaptées
- Des conseils comportementaux plus complets

Réponds en français.`;
  }
  
  return `${basePrompt}

=== MODE GRATUIT ===
L'utilisateur est en version gratuite. Fournis des conseils généraux et concis.

Réponds en français.`;
}

interface MessageBubbleProps {
  message: VetMessage;
  isEmergency?: boolean;
  showBookingCTA?: boolean;
  onBookingPress?: () => void;
}

const MessageBubble = React.memo(({ message, isEmergency, showBookingCTA, onBookingPress }: MessageBubbleProps) => {
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
          <Text style={styles.assistantLabel}>Conseils Odalea</Text>
        </View>
      )}
      <Text style={[
        styles.messageText,
        isUser ? styles.userMessageText : styles.assistantMessageText,
      ]}>
        {message.content}
      </Text>
      {showBookingCTA && onBookingPress && (
        <TouchableOpacity
          style={[styles.bookingCTA, isEmergency && styles.bookingCTAEmergency]}
          onPress={onBookingPress}
          activeOpacity={0.8}
        >
          <Calendar size={16} color={isEmergency ? '#FFFFFF' : COLORS.textInverse} />
          <Text style={[styles.bookingCTAText, isEmergency && styles.bookingCTATextEmergency]}>
            Prendre rendez-vous avec un vétérinaire
          </Text>
          <ChevronRight size={16} color={isEmergency ? '#FFFFFF' : COLORS.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default function VetAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { activePet, userPets, setActivePet, isLoading: isPetsLoading } = useActivePetWithData();
  const { getMessagesForPet, addMessage, startNewConversation } = useVetAssistant();
  const { user } = useAuth();
  const { 
    isPremium, 
    checkVetAssistantLimit, 
    incrementVetAssistantCount, 
    getRemainingVetAssistantQuestions,
    VET_ASSISTANT_DAILY_LIMIT,
    isLoadingQuota,
  } = usePremium();
  
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<VetMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [lastMessageShowBooking, setLastMessageShowBooking] = useState(false);
  const [isEmergencyContext, setIsEmergencyContext] = useState(false);
  
  const remainingQuestions = getRemainingVetAssistantQuestions();
  const hasReachedLimit = !isPremium && remainingQuestions === 0;

  const systemPrompt = useMemo(() => {
    if (!activePet) return '';
    return buildSystemPrompt(activePet, isPremium);
  }, [activePet, isPremium]);

  const { messages: agentMessages, sendMessage, setMessages } = useRorkAgent({
    tools: {},
  });
  
  const lastAgentMessageCountRef = useRef(0);

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

  const handleNavigateToPremium = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const handleNavigateToVetBooking = useCallback(() => {
    if (!activePet) return;
    
    router.push({
      pathname: '/vet-booking',
      params: {
        emergency: isEmergencyContext ? 'true' : 'false',
        petId: activePet.id,
        petName: activePet.name,
      },
    });
  }, [router, activePet, isEmergencyContext]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activePet || isLoading || isLoadingQuota) return;
    
    if (!checkVetAssistantLimit()) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    incrementVetAssistantCount();

    const riskAnalysis = analyzeRiskLevel(userMessage);
    const isEmergency = riskAnalysis.isEmergency;
    const requiresMedicalAdvice = riskAnalysis.requiresMedicalAdvice;
    const suggestVetBooking = riskAnalysis.suggestVetBooking;
    
    setIsEmergencyContext(isEmergency);
    setLastMessageShowBooking(suggestVetBooking);

    const logResponseType = isEmergency ? 'emergency' : requiresMedicalAdvice ? 'medical_blocked' : 'normal';
    
    if (user?.id && activePet) {
      logAIInteraction({
        userId: user.id,
        petId: activePet.id,
        species: activePet.type || 'inconnu',
        questionText: userMessage,
        isPremium,
        riskFlag: isEmergency || requiresMedicalAdvice,
        responseType: logResponseType,
        detectedKeywords: riskAnalysis.detectedKeywords,
      }).catch(err => console.error('[VetAssistant] Log error:', err));
    }

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
        
        // Response will be handled by useEffect watching agentMessages
        return;
      }

      if (responseText) {
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
      }

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
      if (riskAnalysis.isEmergency || riskAnalysis.requiresMedicalAdvice) {
        setIsLoading(false);
      }
    }
  }, [input, activePet, isLoading, isLoadingQuota, systemPrompt, sendMessage, addMessage, checkVetAssistantLimit, incrementVetAssistantCount, isPremium, user?.id]);

  // Handle AI response from agentMessages
  useEffect(() => {
    if (!activePet || !isLoading) return;
    
    const assistantMessages = agentMessages.filter(m => m.role === 'assistant');
    const currentCount = assistantMessages.length;
    
    // Only process if we have a new assistant message
    if (currentCount <= lastAgentMessageCountRef.current) return;
    
    const lastResponse = assistantMessages[assistantMessages.length - 1];
    if (!lastResponse) return;
    
    let responseText = '';
    for (const part of lastResponse.parts) {
      if (part.type === 'text') {
        responseText += part.text;
      }
    }
    
    if (responseText) {
      const finalText = responseText;
      
      addMessage(activePet.id, {
        role: 'assistant',
        content: finalText,
      });

      setLocalMessages(prev => {
        // Avoid duplicate responses
        const lastLocal = prev[prev.length - 1];
        if (lastLocal?.role === 'assistant' && lastLocal?.content === finalText) {
          return prev;
        }
        return [...prev, {
          id: `resp_${Date.now()}`,
          role: 'assistant',
          content: finalText,
          timestamp: Date.now(),
        }];
      });
      
      lastAgentMessageCountRef.current = currentCount;
      setIsLoading(false);
    }
  }, [agentMessages, activePet, isLoading, addMessage]);

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

  const handleChangePet = useCallback((petId: string) => {
    console.log('[VetAssistant] Changing active pet to:', petId);
    setActivePet(petId);
    setShowPetSelector(false);
    setLocalMessages([]);
  }, [setActivePet]);

  const togglePetSelector = useCallback(() => {
    setShowPetSelector(prev => !prev);
  }, []);

  if (isPetsLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Conseils vétérinaires' }} />
        <View style={styles.loadingFullContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingFullText}>Chargement de vos animaux...</Text>
        </View>
      </View>
    );
  }

  if (!activePet && userPets.length > 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Conseils vétérinaires' }} />
        <View style={styles.noPetContainer}>
          <View style={styles.noPetIconContainer}>
            <Stethoscope size={48} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.noPetTitle}>Choisis un animal</Text>
          <Text style={styles.noPetSubtitle}>
            Sélectionne un animal pour obtenir des conseils adaptés.
          </Text>
          <View style={styles.petSelectorList}>
            {userPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petSelectorItem}
                onPress={() => handleChangePet(pet.id)}
                activeOpacity={0.7}
              >
                {pet.mainPhoto ? (
                  <Image source={{ uri: pet.mainPhoto }} style={styles.petSelectorPhoto} />
                ) : (
                  <View style={styles.petSelectorPhotoPlaceholder}>
                    <Text style={styles.petSelectorPhotoInitial}>{pet.name[0]}</Text>
                  </View>
                )}
                <View style={styles.petSelectorInfo}>
                  <Text style={styles.petSelectorName}>{pet.name}</Text>
                  <Text style={styles.petSelectorBreed}>
                    {pet.breed || pet.type}
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (!activePet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Conseils vétérinaires' }} />
        <View style={styles.noPetContainer}>
          <View style={styles.noPetIconContainer}>
            <Stethoscope size={48} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.noPetTitle}>Aucun animal</Text>
          <Text style={styles.noPetSubtitle}>
            Ajoute un animal pour obtenir des conseils adaptés.
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

      <View style={styles.headerSubtitleBanner}>
        <Text style={styles.headerSubtitleText}>Conseils et prévention pour ton animal</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.disclaimerBanner}>
          <AlertTriangle size={16} color={COLORS.warning} />
          <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
        </View>

        <TouchableOpacity 
          style={styles.petContextBanner}
          onPress={userPets.length > 1 ? togglePetSelector : undefined}
          activeOpacity={userPets.length > 1 ? 0.7 : 1}
        >
          <View style={styles.petContextRow}>
            {activePet.mainPhoto ? (
              <Image source={{ uri: activePet.mainPhoto }} style={styles.petContextPhoto} />
            ) : (
              <View style={styles.petContextPhotoPlaceholder}>
                <Text style={styles.petContextPhotoInitial}>{activePet.name[0]}</Text>
              </View>
            )}
            <View style={styles.petContextInfo}>
              <Text style={styles.petContextName}>{activePet.name}</Text>
              <Text style={styles.petContextDetails}>
                {formatPetContext(activePet)}
              </Text>
            </View>
            {userPets.length > 1 && (
              <ChevronDown size={18} color={COLORS.textInverse} style={{ opacity: 0.8 }} />
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#F59E0B" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {showPetSelector && userPets.length > 1 && (
          <View style={styles.petSelectorDropdown}>
            {userPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petSelectorDropdownItem,
                  pet.id === activePet.id && styles.petSelectorDropdownItemActive,
                ]}
                onPress={() => handleChangePet(pet.id)}
                activeOpacity={0.7}
              >
                {pet.mainPhoto ? (
                  <Image source={{ uri: pet.mainPhoto }} style={styles.petSelectorDropdownPhoto} />
                ) : (
                  <View style={styles.petSelectorDropdownPhotoPlaceholder}>
                    <Text style={styles.petSelectorDropdownPhotoInitial}>{pet.name[0]}</Text>
                  </View>
                )}
                <Text style={styles.petSelectorDropdownName}>{pet.name}</Text>
                {pet.id === activePet.id && (
                  <Check size={16} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isPremium && (
          <TouchableOpacity 
            style={styles.quotaBanner}
            onPress={handleNavigateToPremium}
            activeOpacity={0.8}
          >
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaText}>
                {remainingQuestions > 0 
                  ? `${remainingQuestions}/${VET_ASSISTANT_DAILY_LIMIT} questions restantes aujourd'hui`
                  : 'Limite journalière atteinte'
                }
              </Text>
              {remainingQuestions <= 2 && remainingQuestions > 0 && (
                <Text style={styles.quotaHint}>Accéder aux conseils avancés</Text>
              )}
            </View>
            <View style={styles.quotaCta}>
              <Crown size={16} color="#F59E0B" />
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {hasReachedLimit && (
            <View style={styles.limitReachedContainer}>
              <View style={styles.limitReachedIconContainer}>
                <Crown size={40} color="#F59E0B" />
              </View>
              <Text style={styles.limitReachedTitle}>Limite journalière atteinte</Text>
              <Text style={styles.limitReachedSubtitle}>
                Tu as utilisé tes {VET_ASSISTANT_DAILY_LIMIT} questions gratuites aujourd&apos;hui. 
                Passe Premium pour des questions illimitées et des conseils plus personnalisés.
              </Text>
              <TouchableOpacity
                style={styles.upgradePremiumButton}
                onPress={handleNavigateToPremium}
                activeOpacity={0.8}
              >
                <Crown size={18} color="#FFFFFF" />
                <Text style={styles.upgradePremiumButtonText}>Passer Premium</Text>
              </TouchableOpacity>
              <Text style={styles.limitResetHint}>
                Tes questions se réinitialisent toutes les 24h.
              </Text>
            </View>
          )}

          {localMessages.length === 0 && !hasReachedLimit && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Stethoscope size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.welcomeSubtitle}>
                Pose une question pour obtenir des conseils adaptés à ton animal.
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
              
              {isPremium && (
                <View style={styles.premiumTips}>
                  <Crown size={14} color="#F59E0B" />
                  <Text style={styles.premiumTipsText}>
                    En tant que membre Premium, vous bénéficiez de conseils plus détaillés et personnalisés.
                  </Text>
                </View>
              )}
            </View>
          )}

          {localMessages.map((message, index) => {
            const isLastAssistantMessage = 
              message.role === 'assistant' && 
              index === localMessages.length - 1;
            const showCTA = isLastAssistantMessage && lastMessageShowBooking;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isEmergency={message.isEmergencyAlert}
                showBookingCTA={showCTA}
                onBookingPress={handleNavigateToVetBooking}
              />
            );
          })}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>L&apos;assistant réfléchit...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.m }]}>
          {hasReachedLimit ? (
            <TouchableOpacity 
              style={styles.limitReachedInputOverlay}
              onPress={handleNavigateToPremium}
              activeOpacity={0.9}
            >
              <Crown size={20} color="#F59E0B" />
              <Text style={styles.limitReachedInputText}>
                Passez Premium pour continuer
              </Text>
              <ChevronRight size={18} color="#F59E0B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Que se passe-t-il avec ton compagnon ?"
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
                disabled={!input.trim() || isLoading || isLoadingQuota}
                activeOpacity={0.8}
              >
                <Send size={20} color={input.trim() && !isLoading ? COLORS.textInverse : COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
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
  petContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  petContextPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  petContextPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petContextPhotoInitial: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: '600' as const,
  },
  petContextInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  petContextName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: '600' as const,
  },
  petContextDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textInverse,
    opacity: 0.8,
  },
  premiumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.s,
  },
  petSelectorDropdown: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  petSelectorDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  petSelectorDropdownItemActive: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  petSelectorDropdownPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  petSelectorDropdownPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petSelectorDropdownPhotoInitial: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  petSelectorDropdownName: {
    flex: 1,
    marginLeft: SPACING.m,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  quotaInfo: {
    flex: 1,
  },
  quotaText: {
    ...TYPOGRAPHY.small,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  quotaHint: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    marginTop: 2,
  },
  quotaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    color: COLORS.textPrimary,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  headerSubtitleBanner: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: SPACING.s,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  headerSubtitleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
  loadingFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.l,
  },
  loadingFullText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  petSelectorList: {
    width: '100%',
    marginTop: SPACING.l,
  },
  petSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  petSelectorPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  petSelectorPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petSelectorPhotoInitial: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textSecondary,
  },
  petSelectorInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  petSelectorName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
  },
  petSelectorBreed: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
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
  premiumTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.small,
    marginTop: SPACING.l,
  },
  premiumTipsText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    flex: 1,
  },
  limitReachedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.l,
  },
  limitReachedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  limitReachedTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
    textAlign: 'center' as const,
  },
  limitReachedSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  upgradePremiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: '#F59E0B',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.button,
    marginBottom: SPACING.l,
  },
  upgradePremiumButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  limitResetHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center' as const,
  },
  limitReachedInputOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: '#FEF3C7',
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  limitReachedInputText: {
    ...TYPOGRAPHY.body,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  bookingCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.button,
    marginTop: SPACING.m,
  },
  bookingCTAEmergency: {
    backgroundColor: COLORS.danger,
  },
  bookingCTAText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textInverse,
    fontWeight: '600' as const,
    flex: 1,
  },
  bookingCTATextEmergency: {
    color: '#FFFFFF',
  },
});
