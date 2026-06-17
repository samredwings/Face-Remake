import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    originalUri: string;
    resultUri: string;
    styleLabel: string;
    styleColor: string;
    styleId: string;
  }>();

  const { originalUri, resultUri, styleLabel, styleColor } = params;

  const [sliderX, setSliderX] = useState(0.5);
  const containerWidth = useRef(0);
  const thumbScale = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContainerLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    containerWidth.current = e.nativeEvent.layout.width;
  };

  const handlePanMove = (e: GestureResponderEvent) => {
    if (!containerWidth.current) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0.05, Math.min(0.95, x / containerWidth.current));
    setSliderX(ratio);
  };

  const handleThumbPress = () => {
    Animated.sequence([
      Animated.timing(thumbScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(thumbScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.selectionAsync();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out my ${styleLabel} transformation made with RemakeFace AI!`,
      });
    } catch {}
  };

  const handleTryAgain = () => {
    router.back();
  };

  const handleNewPhoto = () => {
    router.navigate("/");
  };

  if (!originalUri || !resultUri) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.floatBack, { top: topPad + 8, backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.centerEmpty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No result found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={[styles.stylePill, { backgroundColor: (styleColor ?? "#7C3AED") + "30" }]}>
          <Feather name="zap" size={12} color={styleColor ?? "#7C3AED"} />
          <Text style={[styles.stylePillText, { color: styleColor ?? "#7C3AED" }]}>
            {styleLabel}
          </Text>
        </View>
        <Pressable
          onPress={handleShare}
          style={[styles.headerBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="share-2" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.compareSection}>
        <View
          style={styles.compareContainer}
          onLayout={handleContainerLayout}
          onStartShouldSetResponder={() => true}
          onResponderMove={handlePanMove}
          onResponderGrant={handleThumbPress}
        >
          <Image source={{ uri: resultUri }} style={styles.fullImage} resizeMode="cover" />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: styleColor ?? "#7C3AED", opacity: 0.25 },
            ]}
          />

          <View style={[styles.originalClip, { width: `${sliderX * 100}%` }]}>
            <Image
              source={{ uri: originalUri }}
              style={[styles.fullImage, { width: containerWidth.current || "100%" as any }]}
              resizeMode="cover"
            />
          </View>

          <View style={[styles.dividerLine, { left: `${sliderX * 100}%` }]}>
            <Animated.View
              style={[
                styles.thumb,
                {
                  transform: [{ scale: thumbScale }],
                  borderColor: styleColor ?? "#7C3AED",
                },
              ]}
            >
              <Feather name="more-horizontal" size={16} color={styleColor ?? "#7C3AED"} />
            </Animated.View>
          </View>

          <View style={[styles.labelLeft, { backgroundColor: colors.overlay ?? "rgba(8,8,15,0.85)" }]}>
            <Text style={styles.labelText}>BEFORE</Text>
          </View>
          <View style={[styles.labelRight, { backgroundColor: colors.overlay ?? "rgba(8,8,15,0.85)" }]}>
            <Text style={[styles.labelText, { color: styleColor ?? "#7C3AED" }]}>AFTER</Text>
          </View>
        </View>

        <Text style={[styles.dragHint, { color: colors.mutedForeground }]}>
          Drag to compare
        </Text>
      </View>

      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <Pressable
          onPress={handleTryAgain}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="refresh-cw" size={16} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Try Style</Text>
        </Pressable>

        <Pressable
          onPress={handleNewPhoto}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="image" size={16} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>New Photo</Text>
        </Pressable>

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGrad}
          >
            <Feather name="share-2" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Share</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stylePillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  compareSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  compareContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  originalClip: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    overflow: "hidden",
  },
  dividerLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  labelLeft: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelRight: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  dragHint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  floatBack: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  centerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
