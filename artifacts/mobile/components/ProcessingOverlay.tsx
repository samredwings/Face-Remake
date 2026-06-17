import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const SYNC_STEPS = [
  "Detecting face…",
  "Mapping facial structure…",
  "Blending skin tones…",
  "Applying lighting…",
  "Finalizing result…",
];

const ASYNC_STEPS = [
  "Detecting face…",
  "Mapping facial structure…",
  "Running AI model…",
  "Blending & refining…",
  "Downloading result…",
];

interface ProcessingOverlayProps {
  visible: boolean;
  styleName: string;
  onComplete: () => void;
  isAsync?: boolean;
}

export default function ProcessingOverlay({
  visible,
  styleName,
  onComplete,
  isAsync = false,
}: ProcessingOverlayProps) {
  const colors = useColors();
  const STEPS = isAsync ? ASYNC_STEPS : SYNC_STEPS;

  const [stepIndex, setStepIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      setStepIndex(0);
      return;
    }

    progress.setValue(0);
    setStepIndex(0);

    if (isAsync) {
      Animated.timing(progress, {
        toValue: 0.85,
        duration: 8000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();

      let idx = 0;
      const stepInterval = setInterval(() => {
        idx++;
        if (idx < STEPS.length - 1) {
          setStepIndex(idx);
        } else {
          clearInterval(stepInterval);
          setStepIndex(STEPS.length - 1);
        }
      }, 2000);

      return () => clearInterval(stepInterval);
    } else {
      const totalMs = 3000;
      Animated.timing(progress, {
        toValue: 1,
        duration: totalMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      let idx = 0;
      const stepMs = totalMs / STEPS.length;
      const timer = setInterval(() => {
        idx++;
        if (idx < STEPS.length) {
          setStepIndex(idx);
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 200);
        }
      }, stepMs);

      return () => clearInterval(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, [visible]);

  if (!visible) return null;

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const scanTranslateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <View style={styles.faceGrid}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={[styles.gridDot, { opacity: 0.4 + (i % 3) * 0.2 }]} />
              ))}
            </View>
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.styleLabel, { color: colors.foreground }]}>{styleName}</Text>
        <Text style={[styles.step, { color: colors.mutedForeground }]}>{STEPS[stepIndex]}</Text>

        {isAsync && (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            This takes 20–40 seconds
          </Text>
        )}

        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <Animated.View style={{ width: progressWidth }}>
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
        </View>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= stepIndex ? "#7C3AED" : colors.border }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(8,8,15,0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  card: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 20,
  },
  orbGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  faceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 60,
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  gridDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  styleLabel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  step: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    textAlign: "center",
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    textAlign: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
    marginTop: 12,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
