import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { COLORS, DIMENSIONS } from '@/constants/colors';

type HeaderSubtitle = React.ReactNode | ((props: { tintColor?: string }) => React.ReactNode);

type ExtendedHeaderProps = NativeStackHeaderProps & {
  options: NativeStackHeaderProps['options'] & {
    headerSubtitle?: HeaderSubtitle;
  };
};

const BACK_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const;

const AdaptiveHeader: React.FC<ExtendedHeaderProps> = ({ navigation, options, back }) => {
  const insets = useSafeAreaInsets();
  const {
    headerTitle,
    title: routeTitle,
    headerSubtitle,
    headerLargeTitle,
    headerRight,
    headerTintColor,
    headerBackVisible,
  } = options;
  const tintColor = headerTintColor ?? COLORS.black;
  const canGoBack = Boolean(back);

  const titleContent = useMemo(() => {
    if (headerTitle) {
      if (typeof headerTitle === 'function') {
        return headerTitle({
          children: routeTitle ?? '',
          tintColor,
        });
      }
      return headerTitle;
    }
    return routeTitle ?? '';
  }, [headerTitle, routeTitle, tintColor]);

  const subtitleContent = useMemo(() => {
    if (headerSubtitle) {
      if (typeof headerSubtitle === 'function') {
        return headerSubtitle({ tintColor });
      }
      return headerSubtitle;
    }
    return headerLargeTitle ?? '';
  }, [headerLargeTitle, headerSubtitle, tintColor]);

  const RightComponent = headerRight?.({ tintColor });

  const handleGoBack = () => {
    if (headerBackVisible === false) {
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top,
          height: insets.top + 72,
        },
      ]}
      testID="adaptive-header"
    >
      <LinearGradient
        colors={['rgba(247,249,252,0.98)', 'rgba(255,255,255,0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={handleGoBack}
            hitSlop={BACK_HIT_SLOP}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            activeOpacity={0.85}
            testID="adaptive-header-back"
          >
            <ArrowLeft size={22} color={tintColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.titleWrap}>
          {typeof titleContent === 'string' ? (
            <Text numberOfLines={1} style={styles.title} testID="adaptive-header-title">
              {titleContent || ' '}
            </Text>
          ) : (
            titleContent
          )}
          {subtitleContent ? (
            typeof subtitleContent === 'string' ? (
              <Text numberOfLines={1} style={styles.subtitle} testID="adaptive-header-subtitle">
                {subtitleContent}
              </Text>
            ) : (
              subtitleContent
            )
          ) : null}
        </View>
        <View style={styles.rightSlot} testID="adaptive-header-right">
          {RightComponent ?? <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
};

export default React.memo(AdaptiveHeader);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,23,42,0.08)',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.md,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  rightSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
