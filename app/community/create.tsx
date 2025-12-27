import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useSocial } from '@/hooks/social-store';
import { usePets } from '@/hooks/pets-store';
import { X, Camera, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function CreatePostScreen() {
  const { t } = useI18n();
  const { createPost, isCreatingPost } = useSocial();
  const { userPets } = usePets();
  const params = useLocalSearchParams();
  
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    console.log('🔍 Create Post - Component mounted');
    
    if (params.prefill === '1') {
      console.log('📝 Prefilling post from map');
      if (params.content && typeof params.content === 'string') {
        setContent(decodeURIComponent(params.content));
      }
      if (params.lat && params.lng) {
        const lat = parseFloat(params.lat as string);
        const lng = parseFloat(params.lng as string);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLocationCoords({ latitude: lat, longitude: lng });
          const locName = params.locName ? decodeURIComponent(params.locName as string) : 'Localisation';
          setLocation(locName);
        }
      }
    } else {
      const primaryPet = userPets.find(pet => pet.isPrimary) || userPets[0];
      if (primaryPet?.mainPhoto) {
        setPhotos([primaryPet.mainPhoto]);
        console.log('🐾 Auto-added pet photo:', primaryPet.name);
      }
    }
  }, [userPets, params]);

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), 'Please write something to share');
      return;
    }
    
    try {
      console.log('📝 Creating post with photos:', photos);
      
      const postData = {
        content: content.trim(),
        images: photos.length > 0 ? photos : undefined,
        type: photos.length > 0 ? 'photo' as const : 'text' as const,
        location: location && locationCoords 
          ? { name: location, latitude: locationCoords.latitude, longitude: locationCoords.longitude }
          : location 
          ? { name: location, latitude: 0, longitude: 0 }
          : undefined,
      };
      
      console.log('📝 Creating post with data:', postData);
      await createPost(postData);
      
      Alert.alert(
        t('common.success'),
        'Your post has been shared with the community!',
        [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(t('common.error'), 'Failed to create post. Please try again.');
    }
  };

  const handleAddLocation = () => {
    Alert.prompt(
      'Add Location',
      'Enter a location name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (text?: string) => {
            if (text && text.trim()) {
              setLocation(text.trim());
            }
          }
        }
      ],
      'plain-text',
      location
    );
  };

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('community.create_post'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handlePost}
              disabled={!content.trim() || isCreatingPost}
              style={[
                styles.headerPostButton, 
                (!content.trim() || isCreatingPost) && styles.headerPostButtonDisabled
              ]}
            >
              <Text style={styles.headerPostButtonText}>
                {isCreatingPost ? '...' : t('common.post') || 'Post'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Input */}
        <View style={styles.section}>
          <TextInput
            style={styles.contentInput}
            placeholder={t('community.whats_happening')}
            placeholderTextColor={COLORS.darkGray}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{content.length}/500</Text>
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                >
                  <X size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Camera size={24} color={COLORS.primary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.locationButton} onPress={handleAddLocation}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {location || 'Add location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Post Preview */}
        {content.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewAvatar} />
                <View>
                  <Text style={styles.previewName}>Your Name</Text>
                  <Text style={styles.previewTime}>Now</Text>
                </View>
              </View>
              <Text style={styles.previewContent}>{content}</Text>
              {photos.length > 0 && (
                <View style={styles.previewPhotos}>
                  {photos.slice(0, 2).map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.previewPhoto} />
                  ))}
                  {photos.length > 2 && (
                    <View style={styles.morePhotos}>
                      <Text style={styles.morePhotosText}>+{photos.length - 2}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  headerButton: {
    padding: 8,
  },
  headerPostButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPostButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  headerPostButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },

  contentInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.black,
    minHeight: 120,
    ...SHADOWS.small,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'right',
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    ...SHADOWS.small,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 12,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  previewTime: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.black,
    marginBottom: 12,
  },
  previewPhotos: {
    flexDirection: 'row',
    marginTop: 8,
  },
  previewPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  morePhotos: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
});