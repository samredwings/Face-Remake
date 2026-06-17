import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProcessingOverlay from "@/components/ProcessingOverlay";
import StyleCard, { TRANSFORM_STYLES } from "@/components/StyleCard";
import { useTransform } from "@/context/TransformContext";
import { useColors } from "@/hooks/useColors";

export default function TransformScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedPhoto, addToHistory } = useTransform();
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedStyle = TRANSFORM_STYLES.find((s) => s.id === selectedStyleId);

  const handleTransform = () => {
    if (!selectedStyle || !selectedPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setProcessing(true);
  };

  const handleProcessingComplete = () => {
    if (!selectedPhoto || !selectedStyle) return;

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    addToHistory({
      id,
      originalUri: selectedPhoto,
      resultUri: selectedPhoto,
      style: selectedStyle.id,
      styleLabel: selectedStyle.label,
      styleColor: selectedStyle.gradientColors[0],
      createdAt: Date.now(),
    });

    setProcessing(false);
    router.push({
      pathname: "/result",
      params: {
        originalUri: selectedPhoto,
        resultUri: selectedPhoto,
        styleLabel: selectedStyle.label,
        styleColor: selectedStyle.gradientColors[0],
        styleId: selectedStyle.id,
      },
    });
  };

  if (!selectedPhoto) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { top: topPad + 8, backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.centerEmpty}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No photo selected</Text>
          <Pressable onPress={() => router.back()} style={[styles.backLink, { borderColor: colors.border }]}>
            <Text style={[styles.backLinkText, { color: colors.foreground }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topSection, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, styles.backBtnInline, { backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Choose Style</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.photoWrap}>
        <Image source={{ uri: selectedPhoto }} style={styles.photo} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", colors.background]}
          style={styles.photoFade}
        />
      </View>

      <FlatList
        data={TRANSFORM_STYLES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StyleCard
            style={item}
            selected={selectedStyleId === item.id}
            onPress={() => setSelectedStyleId(item.id)}
          />
        )}
      />

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <Pressable
          onPress={handleTransform}
          disabled={!selectedStyleId}
          style={({ pressed }) => [
            styles.transformBtn,
            { opacity: !selectedStyleId ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.transformBtnGrad}
          >
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.transformBtnText}>
              {selectedStyle ? `Apply ${selectedStyle.label}` : "Select a style first"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ProcessingOverlay
        visible={processing}
        styleName={selectedStyle?.label ?? ""}
        onComplete={handleProcessingComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnInline: {},
  screenTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  photoWrap: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  transformBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  transformBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  transformBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  centerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  backLink: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
