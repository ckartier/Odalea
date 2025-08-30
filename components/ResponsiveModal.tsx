import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  ModalProps,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, DIMENSIONS, IS_TABLET, RESPONSIVE_LAYOUT, moderateScale } from '@/constants/colors';
import { X } from 'lucide-react-native';

interface ResponsiveModalProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isVisible,
  onClose,
  title,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  style,
  contentStyle,
  ...modalProps
}) => {
  const insets = useSafeAreaInsets();

  const getModalSize = () => {
    const screenWidth = DIMENSIONS.SCREEN_WIDTH;
    const screenHeight = DIMENSIONS.SCREEN_HEIGHT;

    switch (size) {
      case 'small':
        return {
          width: IS_TABLET ? Math.min(400, screenWidth * 0.5) : screenWidth * 0.85,
          maxHeight: screenHeight * 0.6,
        };
      case 'large':
        return {
          width: IS_TABLET ? Math.min(800, screenWidth * 0.8) : screenWidth * 0.95,
          maxHeight: screenHeight * 0.9,
        };
      case 'fullscreen':
        return {
          width: '100%',
          height: '100%',
          maxHeight: '100%',
        };
      default: // medium
        return {
          width: IS_TABLET ? Math.min(600, screenWidth * 0.7) : screenWidth * 0.9,
          maxHeight: screenHeight * 0.8,
        };
    }
  };

  const modalSize = getModalSize();

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...modalProps}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        
        <View
          style={[
            styles.modalContainer,
            {
              paddingTop: size === 'fullscreen' ? insets.top : 0,
              paddingBottom: size === 'fullscreen' ? insets.bottom : 0,
            },
            style,
          ]}
        >
          <View
            style={[
              styles.modalContent,
              modalSize,
              size === 'fullscreen' && styles.fullscreenContent,
              contentStyle,
            ]}
          >
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={DIMENSIONS.COMPONENT_SIZES.ICON_MEDIUM} color={COLORS.darkGray} />
              </TouchableOpacity>
            )}
            
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_LAYOUT.containerPadding,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: DIMENSIONS.SPACING.lg,
    position: 'relative',
    ...Platform.select({
      ios: SHADOWS.large,
      android: SHADOWS.large,
      web: {
        boxShadow: `0 ${moderateScale(10)}px ${moderateScale(25)}px rgba(0, 0, 0, 0.25)`,
      },
    }),
  },
  fullscreenContent: {
    borderRadius: 0,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: DIMENSIONS.SPACING.md,
    right: DIMENSIONS.SPACING.md,
    zIndex: 1,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResponsiveModal;