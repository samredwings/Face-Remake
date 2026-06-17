import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface Style {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  gradientColors: [string, string];
}

export const TRANSFORM_STYLES: Style[] = [
  {
    id: "anime",
    label: "Anime",
    description: "Vibrant Japanese animation style",
    icon: "star",
    gradientColors: ["#6366F1", "#8B5CF6"],
  },
  {
    id: "cartoon",
    label: "Cartoon",
    description: "Bold outlines & vivid colors",
    icon: "smile",
    gradientColors: ["#F59E0B", "#EF4444"],
  },
  {
    id: "oilpaint",
    label: "Oil Paint",
    description: "Classic brushstroke texture",
    icon: "edit-3",
    gradientColors: ["#059669", "#0891B2"],
  },
  {
    id: "sketch",
    label: "Sketch",
    description: "Pencil & charcoal drawing",
    icon: "pen-tool",
    gradientColors: ["#6B7280", "#374151"],
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Neon-lit futuristic glow",
    icon: "zap",
    gradientColors: ["#06B6D4", "#7C3AED"],
  },
  {
    id: "oldage",
    label: "Old Age",
    description: "See yourself decades later",
    icon: "user",
    gradientColors: ["#D97706", "#92400E"],
  },
  {
    id: "young",
    label: "Young",
    description: "Turn back the clock",
    icon: "sun",
    gradientColors: ["#EC4899", "#F43F5E"],
  },
  {
    id: "watercolor",
    label: "Watercolor",
    description: "Soft blended paint washes",
    icon: "droplet",
    gradientColors: ["#3B82F6", "#06B6D4"],
  },
];

interface StyleCardProps {
  style: Style;
  selected: boolean;
  onPress: () => void;
}

export default function StyleCard({ style, selected, onPress }: StyleCardProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { borderColor: selected ? style.gradientColors[0] : colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <LinearGradient
        colors={selected ? style.gradientColors : [colors.card, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.iconWrap, selected ? {} : { backgroundColor: colors.surface ?? "#0E0E24" }]}>
          {selected ? (
            <Feather name={style.icon} size={20} color="#fff" />
          ) : (
            <LinearGradient
              colors={style.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Feather name={style.icon} size={18} color="#fff" />
            </LinearGradient>
          )}
        </View>
        <Text style={[styles.label, { color: selected ? "#fff" : colors.foreground }]}>
          {style.label}
        </Text>
        <Text style={[styles.desc, { color: selected ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]} numberOfLines={2}>
          {style.description}
        </Text>
        {selected && (
          <View style={styles.checkWrap}>
            <Feather name="check-circle" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  gradient: {
    padding: 14,
    minHeight: 120,
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  checkWrap: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});
