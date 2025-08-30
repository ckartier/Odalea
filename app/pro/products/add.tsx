import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useUser } from '@/hooks/user-store';
import Button from '@/components/Button';
import Input from '@/components/Input';
import {
  ArrowLeft,
  Package,
  Euro,
  Hash,
  FileText,
  Image as ImageIcon,
  Plus,
} from 'lucide-react-native';

export default function AddProductScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [stock, setStock] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Redirect if not professional
  if (!user?.isProfessional || !user.professionalData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
      </View>
    );
  }
  
  // Type assertion after null check
  const professionalData = user.professionalData;
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nom du produit requis';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description requise';
    }
    
    if (!price.trim()) {
      newErrors.price = 'Prix requis';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Prix invalide';
    }
    
    if (!category.trim()) {
      newErrors.category = 'Catégorie requise';
    }
    
    if (!stock.trim()) {
      newErrors.stock = 'Stock requis';
    } else if (isNaN(Number(stock)) || Number(stock) < 0) {
      newErrors.stock = 'Stock invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddProduct = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const newProduct = {
        id: `product-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500'],
        category: category.trim(),
        subcategory: subcategory.trim() || category.trim(),
        stock: Number(stock),
        isActive: true,
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const updatedProfessionalData = {
        ...professionalData,
        products: [...professionalData.products, newProduct],
      };
      
      const result = await updateUser({
        professionalData: updatedProfessionalData,
      });
      
      if (result.success) {
        Alert.alert(
          'Produit ajouté',
          'Votre produit a été soumis pour validation. Il sera visible une fois approuvé.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'ajouter le produit');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddPhoto = () => {
    // In a real app, this would open image picker
    const samplePhotos = [
      'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=500',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500',
    ];
    
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotos([...photos, randomPhoto]);
  };
  
  const categories = [
    'Alimentation',
    'Jouets',
    'Accessoires',
    'Hygiène',
    'Transport',
    'Litière',
    'Santé',
    'Autre',
  ];
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Ajouter un produit',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Input
            label="Nom du produit"
            placeholder="Entrez le nom du produit"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<Package size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Description"
            placeholder="Décrivez votre produit"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
            leftIcon={<FileText size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Prix (€)"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            error={errors.price}
            leftIcon={<Euro size={20} color={COLORS.darkGray} />}
          />
          
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>
          
          <Input
            label="Sous-catégorie (optionnel)"
            placeholder="Précisez la sous-catégorie"
            value={subcategory}
            onChangeText={setSubcategory}
            leftIcon={<Hash size={20} color={COLORS.darkGray} />}
          />
          
          <Input
            label="Stock"
            placeholder="Quantité disponible"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            error={errors.stock}
            leftIcon={<Hash size={20} color={COLORS.darkGray} />}
          />
          
          <View style={styles.photosContainer}>
            <Text style={styles.photosLabel}>Photos du produit</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <View style={styles.photoPlaceholder}>
                    <ImageIcon size={24} color={COLORS.darkGray} />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
              >
                <Plus size={24} color={COLORS.primary} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.photosHint}>
              Ajoutez jusqu'à 5 photos de votre produit
            </Text>
          </View>
          
          <Button
            title="Ajouter le produit"
            onPress={handleAddProduct}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    ...SHADOWS.small,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  photosContainer: {
    marginBottom: 16,
  },
  photosLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  photosHint: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  submitButton: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});