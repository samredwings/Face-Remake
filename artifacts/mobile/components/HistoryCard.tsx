import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { type TransformResult } from "@/context/TransformContext";
import { useColors } from "@/hooks/useColors";

interface HistoryCardProps {
  item: TransformResult;
  onPress: () => void;
  onDelete: () => void;
}

export default function HistoryCard({ item, onPress, onDelete }: HistoryCardProps) {
  const colors = useColors();
  const [showDelete, setShowDelete] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDelete((v) => !v);
  };

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.imagesRow}>
          <Image source={{ uri: item.originalUri }} style={styles.image} />
          <View style={[styles.arrow, { backgroundColor: colors.surface ?? "#0E0E24" }]}>
            <Feather name="arrow-right" size={10} color={colors.mutedForeground} />
          </View>
          <View style={[styles.resultImageWrap, { borderColor: item.styleColor }]}>
            <Image source={{ uri: item.resultUri }} style={styles.image} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: item.styleColor, opacity: 0.22, borderRadius: 10 },
              ]}
            />
          </View>
        </View>
        <View style={styles.info}>
          <View style={[styles.styleBadge, { backgroundColor: item.styleColor + "30" }]}>
            <Text style={[styles.styleName, { color: item.styleColor }]}>{item.styleLabel}</Text>
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
        </View>

        {showDelete && (
          <Pressable
            style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
          >
            <Feather name="trash-2" size={16} color="#fff" />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 4,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    overflow: "hidden",
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  image: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
  },
  arrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultImageWrap: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  styleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  styleName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  time: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
