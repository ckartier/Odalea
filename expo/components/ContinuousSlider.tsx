import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState, LayoutChangeEvent, Text } from 'react-native';
import { COLORS } from '@/constants/colors';

interface ContinuousSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  step?: number;
  trackHeight?: number;
  thumbSize?: number;
  testID?: string;
  showValueLabel?: boolean;
  valueSuffix?: string;
}

export default function ContinuousSlider({
  min,
  max,
  value,
  onChange,
  onChangeEnd,
  step = 1,
  trackHeight = 8,
  thumbSize = 24,
  testID,
  showValueLabel = false,
  valueSuffix,
}: ContinuousSliderProps) {
  const trackRef = useRef<View | null>(null);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const quantize = (v: number) => Math.round(v / step) * step;

  const percent = useMemo<number>(() => {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const updateFromX = (x: number, end: boolean) => {
    if (trackWidth <= 0) return;
    const ratio = x / trackWidth;
    const raw = min + ratio * (max - min);
    const next = clamp(quantize(raw));
    onChange(next);
    if (end) onChangeEnd?.(next);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const x = evt.nativeEvent.locationX;
          updateFromX(x, false);
        },
        onPanResponderMove: (evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const localX = evt.nativeEvent.pageX - evt.nativeEvent.locationX;
          const x = Math.max(0, Math.min(trackWidth, gesture.moveX - localX));
          updateFromX(x, false);
        },
        onPanResponderRelease: (evt: GestureResponderEvent) => {
          const x = evt.nativeEvent.locationX;
          updateFromX(x, true);
        },
      }),
    [trackWidth]
  );

  const fillWidth = useMemo(() => (trackWidth > 0 ? (percent / 100) * trackWidth : 0), [percent, trackWidth]);
  const thumbLeftPx = useMemo(() => {
    const x = fillWidth - thumbSize / 2;
    return Math.max(-thumbSize / 2, Math.min((trackWidth ?? 0) - thumbSize / 2, x));
  }, [fillWidth, thumbSize, trackWidth]);

  return (
    <View style={styles.container} testID={testID}>
      <View
        ref={(r) => {
          trackRef.current = r;
        }}
        style={[styles.track, { height: trackHeight }]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: fillWidth, height: trackHeight }]} />
        <View style={[styles.thumb, { width: thumbSize, height: thumbSize, left: thumbLeftPx }]} />
      </View>
      {showValueLabel && (
        <Text style={styles.valueLabel}>{`${value}${valueSuffix ?? ''}`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 8,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 3,
  },
  valueLabel: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'right',
  },
});