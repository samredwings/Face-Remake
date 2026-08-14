import { Feather } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Alert,
  GestureResponderEvent,
  Image,
  Linking,
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
    targetUri: string;
    resultUrl: string;
  }>();

  const { originalUri, resultUrl } = params;

  const [sliderX, setSliderX] = useState(0.5);
  const [activeTab, setActiveTab] = useState<"compare" | "result">("result");
  const [containerWidth, setContainerWidth] = useState(0);
  const containerWidthRef = useRef(0);
  const thumbScale = useRef(new Animated.Value(1)).current;
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContainerLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const width = e.nativeEvent.layout.width;
    containerWidthRef.current = width;
    setContainerWidth(width);
  };

  const handlePanMove = (e: GestureResponderEvent) => {
    if (!containerWidthRef.current) return;
    const ratio = Math.max(0.05, Math.min(0.95, e.nativeEvent.locationX / containerWidthRef.current));
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
        message: "Check out my AI face swap made with RemakeFace AI.",
        url: resultUrl,
      });
    } catch {}
  };

  const handleSave = async () => {
    if (saving) return;
    if (Platform.OS === "web") {
      Alert.alert("Save from your device", "Use Share to save the result from a mobile device.");
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          permission.canAskAgain
            ? "Allow photo access to save your result."
            : "Allow photo access in Settings to save your result.",
          permission.canAskAgain
            ? [{ text: "OK" }]
            : [
                { text: "Not now", style: "cancel" },
                { text: "Open Settings", onPress: () => void Linking.openSettings() },
              ],
        );
        return;
      }

      const destination = new File(Paths.cache, `remakeface-${Date.now()}.jpg`);
      const download = await File.downloadFileAsync(resultUrl, destination);
      await MediaLibrary.createAssetAsync(download.uri);
      Alert.alert("Saved", "Your face swap is now in your photo library.");
    } catch {
      Alert.alert("Could not save", "Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  if (!originalUri || !resultUrl) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.centerEmpty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No result found</Text>
          <Pressable onPress={() => router.navigate("/")} style={[styles.goHomeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.goHomeBtnText, { color: colors.foreground }]}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={[styles.successPill, { backgroundColor: colors.successSoft }]}>
          <Feather name="check-circle" size={12} color={colors.success} />
          <Text style={[styles.successText, { color: colors.success }]}>Face Swap Complete</Text>
        </View>
        <Pressable onPress={handleShare} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
          <Feather name="share-2" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["result", "compare"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab ? colors.card : "transparent",
                borderColor: activeTab === tab ? colors.border : "transparent",
              },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>
              {tab === "result" ? "Result" : "Before / After"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.imageSection}>
        {activeTab === "result" ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: resultUrl }} style={styles.fullImage} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", colors.background]}
              style={styles.imageFade}
            />
            <View style={styles.resultBadge}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resultBadgeInner}>
                <Feather name="zap" size={12} color="#fff" />
                <Text style={styles.resultBadgeText}>AI Face Swap</Text>
              </LinearGradient>
            </View>
          </View>
        ) : (
          <View
            style={styles.compareWrap}
            onLayout={handleContainerLayout}
            onStartShouldSetResponder={() => true}
            onResponderMove={handlePanMove}
            onResponderGrant={handleThumbPress}
          >
            <Image source={{ uri: resultUrl }} style={styles.fullImageAbs} resizeMode="cover" />
            <View style={[styles.originalClip, { width: `${sliderX * 100}%` }]}>
              <Image
                source={{ uri: originalUri }}
                style={[styles.fullImageAbs, { width: containerWidth || 1 }]}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.dividerLine, { left: `${sliderX * 100}%` }]}>
              <Animated.View
                style={[styles.thumb, { transform: [{ scale: thumbScale }], borderColor: "#7C3AED" }]}
              >
                <Feather name="more-horizontal" size={16} color="#7C3AED" />
              </Animated.View>
            </View>
            <View style={[styles.compareLabel, styles.compareLabelLeft, { backgroundColor: colors.overlay ?? "rgba(8,8,15,0.8)" }]}>
              <Text style={styles.compareLabelText}>BEFORE</Text>
            </View>
            <View style={[styles.compareLabel, styles.compareLabelRight, { backgroundColor: "#7C3AED99" }]}>
              <Text style={styles.compareLabelText}>AFTER</Text>
            </View>
          </View>
        )}
      </View>

      {activeTab === "compare" && (
        <Text style={[styles.dragHint, { color: colors.mutedForeground }]}>Drag to compare</Text>
      )}

      <View
        style={[
          styles.actions,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="refresh-cw" size={15} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>New Swap</Text>
        </Pressable>

        <Pressable
          onPress={() => router.navigate("/")}
          style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="home" size={15} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Home</Text>
        </Pressable>

        <Pressable
          onPress={() => void handleSave()}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGrad}>
            <Feather name="download" size={15} color="#fff" />
            <Text style={styles.primaryBtnText}>{saving ? "Saving…" : "Save"}</Text>
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
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  successPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  successText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  imageSection: { flex: 1, paddingHorizontal: 16, paddingBottom: 4 },
  imageWrap: { flex: 1, borderRadius: 20, overflow: "hidden", position: "relative" },
  fullImage: { width: "100%", height: "100%" },
  imageFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  resultBadge: { position: "absolute", bottom: 16, right: 16 },
  resultBadgeInner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  resultBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  compareWrap: { flex: 1, borderRadius: 20, overflow: "hidden", position: "relative" },
  fullImageAbs: { width: "100%", height: "100%", position: "absolute" },
  originalClip: { position: "absolute", top: 0, left: 0, height: "100%", overflow: "hidden" },
  dividerLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  thumb: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", borderWidth: 2, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  compareLabel: { position: "absolute", bottom: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compareLabelLeft: { left: 12 },
  compareLabelRight: { right: 12 },
  compareLabelText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  dragHint: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  actions: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  secondaryBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  primaryBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  primaryBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13 },
  primaryBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  centerEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  goHomeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  goHomeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  shadowOffset: { width: 0, height: 2 },
});
