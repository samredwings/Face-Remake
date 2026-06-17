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

const STEPS = [
  "Detecting face…",
  "Mapping facial features…",
  "Applying AI style…",
  "Refining details…",
  "Finalizing result…",
];

interface ProcessingOverlayProps {
  visible: boolean;
  styleName: string;
  onComplete: () => void;
}

export default function ProcessingOverlay({
  visible,
  styleName,
  onComplete,
}: ProcessingOverlayProps) {
  const colors = useColors();
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

    const totalMs = 3000;
    Animated.timing(progress, {
      toValue: 1,
      duration: totalMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const stepInterval = totalMs / STEPS.length;
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      if (idx < STEPS.length) {
        setStepIndex(idx);
      } else {
        clearInterval(timer);
        setTimeout(onComplete, 200);
      }
    }, stepInterval);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.linear })
    ).start();

    return () => clearInterval(timer);
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
                <View
                  key={i}
                  style={[styles.gridDot, { opacity: 0.4 + (i % 3) * 0.2 }]}
                />
              ))}
            </View>
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanTranslateY }] },
              ]}
            />
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.styleLabel, { color: colors.foreground }]}>
          {styleName}
        </Text>
        <Text style={[styles.step, { color: colors.mutedForeground }]}>
          {STEPS[stepIndex]}
        </Text>

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
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i <= stepIndex ? "#7C3AED" : colors.border,
                },
              ]}
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
    marginBottom: 20,
    textAlign: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
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
