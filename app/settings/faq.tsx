import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { 
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react-native';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'Compte',
    question: 'Comment créer un compte ?',
    answer: 'Pour créer un compte, téléchargez l\'application et appuyez sur "S\'inscrire". Remplissez vos informations personnelles et suivez les étapes de vérification.',
    tags: ['inscription', 'compte', 'création'],
  },
  {
    id: '2',
    category: 'Animaux',
    question: 'Comment ajouter un animal ?',
    answer: 'Allez dans votre profil et appuyez sur le bouton "+" dans la section "Mes animaux". Remplissez les informations de votre animal et ajoutez des photos.',
    tags: ['animal', 'profil', 'ajouter'],
  },
  {
    id: '3',
    category: 'Gardiens',
    question: 'Comment trouver des gardiens près de chez moi ?',
    answer: 'Utilisez la carte pour voir les gardiens disponibles dans votre région. Vous pouvez filtrer par services, prix et disponibilité.',
    tags: ['gardien', 'carte', 'recherche'],
  },
  {
    id: '4',
    category: 'Messages',
    question: 'Pourquoi je ne peux pas envoyer de messages ?',
    answer: 'Les utilisateurs gratuits sont limités à 3 conversations par mois. Passez à Premium pour des messages illimités.',
    tags: ['messages', 'limite', 'premium'],
  },
  {
    id: '5',
    category: 'Perdus & Trouvés',
    question: 'Comment signaler un animal perdu ?',
    answer: 'Allez dans l\'onglet "Perdus & Trouvés" et appuyez sur "Signaler un animal perdu". Ajoutez une photo, une description et le lieu où l\'animal a été vu pour la dernière fois.',
    tags: ['perdu', 'signaler', 'animal'],
  },
  {
    id: '6',
    category: 'Premium',
    question: 'Quels sont les avantages Premium ?',
    answer: 'Premium inclut : messages illimités, plusieurs animaux, mode incognito, filtres avancés, pas de publicités, badge VIP, galerie illimitée et support prioritaire.',
    tags: ['premium', 'avantages', 'abonnement'],
  },
  {
    id: '7',
    category: 'Sécurité',
    question: 'Comment bloquer un utilisateur ?',
    answer: 'Dans une conversation ou sur un profil, appuyez sur les trois points et sélectionnez "Bloquer". L\'utilisateur ne pourra plus vous contacter.',
    tags: ['bloquer', 'sécurité', 'utilisateur'],
  },
  {
    id: '8',
    category: 'Défis',
    question: 'Comment participer aux défis ?',
    answer: 'Visitez l\'onglet "Défis" et appuyez sur "Participer" sur le défi de votre choix. Suivez les instructions pour soumettre votre participation.',
    tags: ['défis', 'participer', 'concours'],
  },
];

const categories = ['Tous', 'Compte', 'Animaux', 'Gardiens', 'Messages', 'Perdus & Trouvés', 'Premium', 'Sécurité', 'Défis'];

export default function FAQScreen() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.activeCategoryButton,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.activeCategoryButtonText,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.faqItem, SHADOWS.small]}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <View style={styles.faqTitleContainer}>
            <Text style={styles.faqCategory}>{item.category}</Text>
            <Text style={styles.faqQuestion}>{item.question}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={COLORS.primary} />
          ) : (
            <ChevronDown size={20} color={COLORS.darkGray} />
          )}
        </View>
        
        {isExpanded && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Questions fréquentes',
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.black,
        }}
      />
      <StatusBar style="dark" />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans la FAQ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.darkGray}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(renderCategoryButton)}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredFAQ.length > 0 ? (
          <>
            <Text style={styles.resultsText}>
              {filteredFAQ.length} question{filteredFAQ.length > 1 ? 's' : ''} trouvée{filteredFAQ.length > 1 ? 's' : ''}
            </Text>
            {filteredFAQ.map(renderFAQItem)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <HelpCircle size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucune question trouvée</Text>
            <Text style={styles.emptyDescription}>
              Essayez de modifier votre recherche ou sélectionnez une autre catégorie.
            </Text>
          </View>
        )}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Vous ne trouvez pas votre réponse ?</Text>
          <Text style={styles.contactDescription}>
            Contactez notre équipe de support pour obtenir de l'aide personnalisée.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              const subject = 'Support Coppet - Question depuis FAQ';
              const body = `Bonjour,\n\nJ'ai une question qui n'est pas couverte dans la FAQ :\n\n[Décrivez votre question ici]\n\nMerci pour votre aide.`;
              
              const mailtoUrl = `mailto:support@coppet.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              
              Linking.openURL(mailtoUrl).catch(() => {
                Alert.alert(
                  'Erreur',
                  'Impossible d\'ouvrir l\'application mail. Veuillez contacter support@coppet.com directement.'
                );
              });
            }}
          >
            <Text style={styles.contactButtonText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeCategoryButtonText: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  faqCategory: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    lineHeight: 22,
  },
  faqAnswerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
});