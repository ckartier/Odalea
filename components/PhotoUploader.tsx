import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Camera, X, Image as ImageIcon } from 'lucide-react-native';

interface PhotoUploaderProps {
  value?: string;
  onChange?: (uri: string | null) => void;
  onPhotoSelected?: (uri: string) => void;
  currentPhoto?: string;
  placeholder?: string;
  required?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value,
  onChange,
  onPhotoSelected,
  currentPhoto,
  placeholder = 'Upload Photo',
  required = false,
  style,
  children,
  showIcon = false,
  icon,
}) => {
  const [loading, setLoading] = useState(false);
  const [displayPhoto, setDisplayPhoto] = useState<string | undefined>(value || currentPhoto);
  
  useEffect(() => {
    setDisplayPhoto(value || currentPhoto);
  }, [value, currentPhoto]);
  
  const showImagePicker = () => {
    const options = [
      {
        text: 'Annuler',
        style: 'cancel' as const,
      },
      {
        text: 'Choisir dans la galerie',
        onPress: pickFromGallery,
      },
    ];
    
    // Only add camera option on mobile
    if (Platform.OS !== 'web') {
      options.splice(1, 0, {
        text: 'Prendre une photo',
        onPress: takePhoto,
      });
    }
    
    Alert.alert(
      'Sélectionner une photo',
      'Choisissez une option',
      options
    );
  };

  const persistImage = async (uri: string): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        return uri;
      }
      const dir = FileSystem.documentDirectory + 'images/';
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `photo_${Date.now()}.${ext}`;
      const dest = dir + fileName;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    } catch (e) {
      console.log('persistImage error', e);
      return uri;
    }
  };

  const takePhoto = async () => {
    try {
      setLoading(true);
      
      // Check if camera is available on web
      if (Platform.OS === 'web') {
        Alert.alert(
          'Caméra non disponible',
          'La caméra n\'est pas disponible sur le web. Veuillez utiliser "Choisir dans la galerie".'
        );
        return;
      }
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à la caméra.'
        );
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Photo taken:', uri);
        const persisted = await persistImage(uri);
        setDisplayPhoto(persisted);
        if (onChange) {
          onChange(persisted);
        }
        if (onPhotoSelected) {
          onPhotoSelected(persisted);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setLoading(true);
      
      // Request media library permissions (not needed on web)
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission requise',
            'Nous avons besoin de votre permission pour accéder à vos photos.'
          );
          return;
        }
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });
      
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Photo selected from gallery:', uri);
        const persisted = await persistImage(uri);
        setDisplayPhoto(persisted);
        if (onChange) {
          onChange(persisted);
        }
        if (onPhotoSelected) {
          onPhotoSelected(persisted);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemove = () => {
    setDisplayPhoto(undefined);
    if (onChange) {
      onChange(null);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {displayPhoto ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayPhoto }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
          >
            <X size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            SHADOWS.small,
          ]}
          onPress={showImagePicker}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.maleAccent} />
          ) : children ? (
            children
          ) : showIcon && icon ? (
            icon
          ) : (
            <>
              <Camera size={24} color={COLORS.maleAccent} />
              <Text style={styles.uploadText}>{placeholder}</Text>
              {required && <Text style={styles.requiredText}>*</Text>}
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.maleAccent,
    marginTop: 8,
    textAlign: 'center',
  },
  requiredText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 2,
  },
});

export default PhotoUploader;