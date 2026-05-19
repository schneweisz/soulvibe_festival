import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

const BAR_H = 13;

// Each bar animates between its own hi/lo values at its own speed,
// creating an organic-looking audio visualiser effect.
const CONFIGS = [
  { hi: 0.9,  lo: 0.15, dur: 220 },
  { hi: 0.95, lo: 0.25, dur: 155 },
  { hi: 0.75, lo: 0.10, dur: 290 },
  { hi: 0.85, lo: 0.20, dur: 185 },
];

export function AudioBars({ color }: { color: string }) {
  const b0 = useRef(new Animated.Value(0.40)).current;
  const b1 = useRef(new Animated.Value(0.70)).current;
  const b2 = useRef(new Animated.Value(0.30)).current;
  const b3 = useRef(new Animated.Value(0.55)).current;
  const bars = [b0, b1, b2, b3];

  useEffect(() => {
    bars.forEach((bar, i) => {
      const { hi, lo, dur } = CONFIGS[i];
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: hi, duration: dur,                    useNativeDriver: true }),
          Animated.timing(bar, { toValue: lo, duration: Math.round(dur * 0.68), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_H }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: BAR_H,
            borderRadius: 2,
            backgroundColor: color,
            transform: [
              { scaleY: bar },
              // Shift to bottom-anchor: as scaleY shrinks, translateY moves bar down
              { translateY: bar.interpolate({ inputRange: [0, 1], outputRange: [BAR_H / 2, 0] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
