import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HistoryCard from "@/components/HistoryCard";
import { useTransform } from "@/context/TransformContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSelectedPhoto, history, deleteFromHistory } = useTransform();
  const [pickingSource, setPickingSource] = useState<"camera" | "gallery" | null>(null);

  const openGallery = async () => {
    setPickingSource("gallery");
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedPhoto(result.assets[0].uri);
        router.push("/transform");
      }
    } finally {
      setPickingSource(null);
    }
  };

  const openCamera = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Camera is not available on web. Use the gallery instead.");
      return;
    }
    setPickingSource("camera");
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your camera.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedPhoto(result.assets[0].uri);
        router.push("/transform");
      }
    } finally {
      setPickingSource(null);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoWrap}
          >
            <Feather name="aperture" size={22} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>RemakeFace AI</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Transform your face with AI
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["#7C3AED22", "#EC489922"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: "#7C3AED44" }]}
        >
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Choose a photo to{"\n"}
            <Text style={styles.heroHighlight}>transform</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Pick from gallery or take a selfie. AI handles the rest.
          </Text>

          <View style={styles.pickButtons}>
            <Pressable
              onPress={openGallery}
              disabled={!!pickingSource}
              style={({ pressed }) => [
                styles.pickBtn,
                styles.pickBtnPrimary,
                { opacity: pressed || pickingSource === "gallery" ? 0.7 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#7C3AED", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickBtnGrad}
              >
                <Feather name="image" size={18} color="#fff" />
                <Text style={styles.pickBtnText}>
                  {pickingSource === "gallery" ? "Opening…" : "Gallery"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={openCamera}
              disabled={!!pickingSource}
              style={({ pressed }) => [
                styles.pickBtn,
                { borderColor: colors.border, opacity: pressed || pickingSource === "camera" ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.pickBtnOutline, { backgroundColor: colors.card }]}>
                <Feather name="camera" size={18} color={colors.foreground} />
                <Text style={[styles.pickBtnText, { color: colors.foreground }]}>
                  {pickingSource === "camera" ? "Opening…" : "Camera"}
                </Text>
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                {history.length} transform{history.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <HistoryCard
                  item={item}
                  onPress={() => {
                    setSelectedPhoto(item.originalUri);
                    router.push("/transform");
                  }}
                  onDelete={() => deleteFromHistory(item.id)}
                />
              )}
            />
          </View>
        )}

        {history.length === 0 && (
          <View style={styles.emptySection}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={28} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No transformations yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Choose a photo above and select an AI style to get started.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
    marginBottom: 8,
  },
  heroHighlight: {
    color: "#7C3AED",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 22,
  },
  pickButtons: {
    flexDirection: "row",
    gap: 12,
  },
  pickBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  pickBtnPrimary: {
    borderWidth: 0,
  },
  pickBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  pickBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  pickBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptySection: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
