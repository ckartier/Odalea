import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  style?: ViewStyle;
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.alertBackground;
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} color={COLORS.white} />;
      case 'error':
        return <AlertCircle size={24} color={COLORS.white} />;
      case 'warning':
        return <AlertCircle size={24} color={COLORS.white} />;
      default:
        return <Info size={24} color={COLORS.black} />;
    }
  };
  
  const getTextColor = () => {
    return type === 'info' ? COLORS.black : COLORS.white;
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
        SHADOWS.medium,
        style,
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      
      <View style={styles.contentContainer}>
        {title && (
          <Text style={[styles.title, { color: getTextColor() }]}>
            {title}
          </Text>
        )}
        
        <Text style={[styles.message, { color: getTextColor() }]}>
          {message}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <X size={20} color={getTextColor()} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
  closeButton: {
    marginLeft: 12,
  },
});

export default Alert;