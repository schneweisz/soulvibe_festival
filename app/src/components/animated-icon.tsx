import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');
const INITIAL_SCALE_FACTOR = SH / 90;
const DURATION = 600;

// ─── Boot sequence data ───────────────────────────────────────────────────────

const DIAGNOSTICS = [
  '> INIT SOULVIBE_OS v2.6.0',
  '> LOADING FREQUENCY MATRIX......',
  '> CONNECTING TO THE GRID.......',
  '> SCANNING BIOMETRICS............',
  '> AUTH NODE: ██████ VERIFIED',
  '> PULSE CALIBRATION: OK',
  '> WRISTBAND LINK: ACTIVE',
  '> LAUNCHING INTERFACE........',
];

const randHex = () =>
  [0, 1, 2]
    .map(() => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase())
    .join('  ');

type BootPhase = 'boot' | 'logo';

// ─── Animated splash overlay ──────────────────────────────────────────────────

export function AnimatedSplashOverlay() {
  const [visible, setVisible]     = useState(true);
  const [phase, setPhase]         = useState<BootPhase>('boot');
  const [hexLine, setHexLine]     = useState('');
  const [bootLines, setBootLines] = useState<string[]>([]);

  const overlayOpacity = useSharedValue(1);
  const logoOpacity    = useSharedValue(0);

  const overlayAnim = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoAnim    = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));

  useEffect(() => {
    const hexInterval = setInterval(() => setHexLine(randHex()), 80);

    let idx = 0;
    const lineInterval = setInterval(() => {
      if (idx < DIAGNOSTICS.length) {
        setBootLines(prev => [...prev, DIAGNOSTICS[idx++]]);
      } else {
        clearInterval(lineInterval);
      }
    }, 180);

    const logoTimer = setTimeout(() => {
      clearInterval(hexInterval);
      setPhase('logo');
      logoOpacity.value = withTiming(1, { duration: 400 });
    }, 1700);

    overlayOpacity.value = withDelay(
      2500,
      withTiming(0, { duration: 500 }, (finished) => {
        'worklet';
        if (finished) runOnJS(setVisible)(false);
      }),
    );

    return () => {
      clearInterval(hexInterval);
      clearInterval(lineInterval);
      clearTimeout(logoTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[boot.overlay, overlayAnim]}>
      {phase === 'boot' && (
        <View style={boot.terminalWrap}>
          <Text style={boot.hexBar}>{hexLine}</Text>
          <View style={boot.divider} />
          {bootLines.map((line, i) => (
            <Text key={i} style={[boot.line, i === bootLines.length - 1 && boot.lineActive]}>
              {line}
            </Text>
          ))}
          {bootLines.length > 0 && <Text style={boot.cursor}>█</Text>}
        </View>
      )}

      {phase === 'logo' && (
        <Animated.View style={[boot.logoWrap, logoAnim]}>
          <Image
            source={require('../../assets/images/soulvibe2026.png')}
            style={boot.logo}
            contentFit="contain"
          />
          <Text style={boot.logoSub}>SYSTEM ONLINE</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const boot = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#07070c',
    zIndex: 1000,
  },
  terminalWrap: {
    paddingHorizontal: 28,
    paddingTop: SH * 0.13,
  },
  hexBar: {
    color: 'rgba(57,255,20,0.25)',
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(57,255,20,0.15)',
    marginBottom: 22,
  },
  line: {
    color: 'rgba(57,255,20,0.45)',
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  lineActive: {
    color: '#39ff14',
  },
  cursor: {
    color: '#39ff14',
    fontFamily: 'monospace',
    fontSize: 14,
    marginTop: 4,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: SW * 0.6,
    height: 90,
    marginBottom: 16,
  },
  logoSub: {
    color: 'rgba(57,255,20,0.6)',
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('../../assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('../../assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    backgroundColor: '#0274DF',
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
