import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function drift(sv: Animated.SharedValue<number>, a: number, durA: number, b: number, durB: number) {
  sv.value = withRepeat(
    withSequence(
      withTiming(a, { duration: durA, easing: Easing.inOut(Easing.quad) }),
      withTiming(b, { duration: durB, easing: Easing.inOut(Easing.quad) }),
    ),
    -1,
    true,
  );
}

export function NebulaBackground() {
  const b1x = useSharedValue(0);
  const b1y = useSharedValue(0);
  const b2x = useSharedValue(0);
  const b2y = useSharedValue(0);

  useEffect(() => {
    drift(b1x,  8, 16000, -6, 14000);
    drift(b1y, -7, 18000,  5, 15000);
    drift(b2x, -7, 15000,  6, 17000);
    drift(b2y,  6, 17000, -8, 16000);
  }, []);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ translateX: b1x.value }, { translateY: b1y.value }],
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ translateX: b2x.value }, { translateY: b2y.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[nb.blob, nb.green, s1]} />
      <Animated.View style={[nb.blob, nb.purple, s2]} />
    </View>
  );
}

const nb = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  green: {
    width: 340,
    height: 340,
    top: -120,
    right: -120,
    backgroundColor: 'rgba(12, 30, 12, 0.95)',
    shadowColor: '#39ff14',
    shadowOpacity: 0.18,
    shadowRadius: 55,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  purple: {
    width: 320,
    height: 320,
    bottom: 60,
    left: -110,
    backgroundColor: 'rgba(20, 8, 28, 0.95)',
    shadowColor: '#d05bff',
    shadowOpacity: 0.15,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
});
