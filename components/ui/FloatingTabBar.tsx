import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY, COMPONENT_SIZES } from '@/theme/tokens';

interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function FloatingTabBar({
  tabs,
  activeTab,
  onTabPress,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, SPACING.l);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                size={COMPONENT_SIZES.tabBarIconSize}
                color={isActive ? COLORS.primary : COLORS.textTertiary}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text 
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bar: {
    width: '100%',
    maxWidth: 400,
    height: COMPONENT_SIZES.tabBarHeight,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.floatingBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.s,
    ...SHADOWS.floatingBar,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s,
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  labelActive: {
    ...TYPOGRAPHY.captionSemibold,
    color: COLORS.primary,
  },
});
