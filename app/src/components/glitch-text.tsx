import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface Props {
  children: string;
  style?: any;
}

/**
 * Renders text with a randomised glitch burst animation.
 * Two colour-shifted ghost copies (cyan + magenta) flicker offset from the main text.
 */
export function GlitchText({ children, style }: Props) {
  const tx = useSharedValue(0);
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);

  useEffect(() => {
    let alive = true;

    const burst = () => {
      if (!alive) return;
      tx.value = withSequence(
        withTiming(7,  { duration: 45 }),
        withTiming(-5, { duration: 35 }),
        withTiming(4,  { duration: 30 }),
        withTiming(-2, { duration: 25 }),
        withTiming(0,  { duration: 80 }),
      );
      g1.value = withSequence(
        withTiming(0.55, { duration: 45 }),
        withTiming(0.35, { duration: 35 }),
        withTiming(0.45, { duration: 30 }),
        withTiming(0,    { duration: 95 }),
      );
      g2.value = withSequence(
        withTiming(0.35, { duration: 55 }),
        withTiming(0.2,  { duration: 40 }),
        withTiming(0,    { duration: 80 }),
      );
      setTimeout(schedule, 1800 + Math.random() * 3000);
    };

    const schedule = () => {
      if (alive) setTimeout(burst, 1200 + Math.random() * 2500);
    };

    const t0 = setTimeout(schedule, 800);
    return () => { alive = false; clearTimeout(t0); };
  }, []);

  const mainAnim   = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const ghost1Anim = useAnimatedStyle(() => ({ opacity: g1.value, transform: [{ translateX: tx.value * -2.2 }] }));
  const ghost2Anim = useAnimatedStyle(() => ({ opacity: g2.value, transform: [{ translateX: tx.value * 1.6 + 3 }] }));

  return (
    <View style={style}>
      <Animated.Text style={[style, { position: 'absolute', color: '#00FFFF', textShadowColor: 'rgba(0,255,255,0.5)' }, ghost1Anim]}>
        {children}
      </Animated.Text>
      <Animated.Text style={[style, { position: 'absolute', color: '#FF00CC', textShadowColor: 'rgba(255,0,200,0.45)' }, ghost2Anim]}>
        {children}
      </Animated.Text>
      <Animated.Text style={[style, mainAnim]}>
        {children}
      </Animated.Text>
    </View>
  );
}
