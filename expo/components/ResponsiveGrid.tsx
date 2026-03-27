import React from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import { DIMENSIONS, RESPONSIVE_LAYOUT, IS_TABLET, moderateScale } from '@/constants/colors';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number | 'auto';
  spacing?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  itemStyle?: ViewStyle;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 'auto',
  spacing = 'medium',
  style,
  itemStyle,
}) => {
  const getColumns = () => {
    if (typeof columns === 'number') return columns;
    return RESPONSIVE_LAYOUT.gridColumns;
  };

  const getSpacing = () => {
    switch (spacing) {
      case 'small':
        return DIMENSIONS.SPACING.sm;
      case 'large':
        return DIMENSIONS.SPACING.lg;
      default:
        return RESPONSIVE_LAYOUT.cardSpacing;
    }
  };

  const numColumns = getColumns();
  const itemSpacing = getSpacing();
  
  // Convert children to array and chunk them
  const childrenArray = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  
  for (let i = 0; i < childrenArray.length; i += numColumns) {
    rows.push(childrenArray.slice(i, i + numColumns));
  }

  const itemWidth = (IS_TABLET 
    ? `${(100 - (numColumns - 1) * 2) / numColumns}%`
    : `${(100 - (numColumns - 1) * 3) / numColumns}%`) as DimensionValue;

  return (
    <View style={[styles.container, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { marginBottom: itemSpacing }]}>
          {row.map((child, itemIndex) => (
            <View
              key={itemIndex}
              style={[
                styles.item,
                {
                  width: itemWidth,
                  marginRight: itemIndex < row.length - 1 ? itemSpacing : 0,
                },
                itemStyle,
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill empty spaces in the last row */}
          {row.length < numColumns &&
            Array.from({ length: numColumns - row.length }).map((_, emptyIndex) => (
              <View
                key={`empty-${emptyIndex}`}
                style={[
                  styles.item,
                  {
                    width: itemWidth,
                    marginRight: emptyIndex < numColumns - row.length - 1 ? itemSpacing : 0,
                  },
                ]}
              />
            ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  item: {
    flexShrink: 0,
  },
});

export default ResponsiveGrid;