import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTransform, type TransformResult } from "@/context/TransformContext";
import { useColors } from "@/hooks/useColors";

const HistoryCard = React.memo(function HistoryCard({
  item,
  onDelete,
}: {
  item: TransformResult;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [showDel, setShowDel] = useState(false);

  const timeAgo = (ts: number) => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowDel((v) => !v);
      }}
      onPress={() => showDel && setShowDel(false)}
      style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.histImages}>
        <Image source={{ uri: item.originalUri }} style={styles.histImg} />
        <View style={[styles.histArrow, { backgroundColor: colors.surface ?? "#0E0E24" }]}>
          <Feather name="arrow-right" size={10} color="#EC4899" />
        </View>
        <View style={[styles.histResultWrap, { borderColor: "#7C3AED" }]}>
          <Image source={{ uri: item.resultUrl }} style={styles.histImg} />
        </View>
      </View>
      <View style={styles.histFooter}>
        <View style={[styles.histBadge, { backgroundColor: "#7C3AED30" }]}>
          <Feather name="zap" size={10} color="#7C3AED" />
          <Text style={[styles.histBadgeText, { color: "#7C3AED" }]}>Face Swap</Text>
        </View>
        <Text style={[styles.histTime, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
      </View>
      {showDel && (
        <Pressable
          style={[styles.histDel, { backgroundColor: colors.destructive }]}
          onPress={() => { onDelete(); setShowDel(false); }}
        >
          <Feather name="trash-2" size={14} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSourcePhoto, history, historyReady, deleteFromHistory } = useTransform();
  const [picking, setPicking] = useState<"gallery" | "camera" | null>(null);
  const [historyVisible, setHistoryVisible] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS !== "web" || !historyReady) return;

    const browserWindow = globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const handle = browserWindow.requestIdleCallback(() => setHistoryVisible(true), { timeout: 800 });
      return () => browserWindow.cancelIdleCallback?.(handle);
    }

    const handle = setTimeout(() => setHistoryVisible(true), 0);
    return () => clearTimeout(handle);
  }, [historyReady]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickImage = async (source: "gallery" | "camera") => {
    setPicking(source);
    try {
      if (source === "camera") {
        if (Platform.OS === "web") {
          Alert.alert("Not available", "Camera is not supported on web. Use the gallery.");
          return;
        }
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert("Permission needed", "Camera access is required.", [
            { text: "Not now", style: "cancel" },
            ...(permission.canAskAgain
              ? []
              : [{ text: "Open Settings", onPress: () => void Linking.openSettings() }]),
          ]);
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert("Permission needed", "Photo library access is required.", [
            { text: "Not now", style: "cancel" },
            ...(permission.canAskAgain
              ? []
              : [{ text: "Open Settings", onPress: () => void Linking.openSettings() }]),
          ]);
          return;
        }
      }

      const fn =
        source === "camera"
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await fn({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri, base64 } = result.assets[0];
        if (!base64) {
          Alert.alert("Photo unavailable", "This photo could not be prepared. Please choose another image.");
          return;
        }
        const dataUri = `data:image/jpeg;base64,${base64}`;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSourcePhoto(uri, dataUri);
        router.push("/transform");
      }
    } finally {
      setPicking(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Feather name="aperture" size={22} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>RemakeFace AI</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Hyper-realistic AI face swap
            </Text>
          </View>
        </View>

         <LinearGradient
             colors={[`${colors.gradientStart}22`, `${colors.gradientEnd}22`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: "#7C3AED44" }]}
        >
          <View style={styles.heroSteps}>
            {[
              { icon: "user", label: "Your face" },
              { icon: "arrow-right", label: "" },
              { icon: "image", label: "Target photo" },
              { icon: "arrow-right", label: "" },
              { icon: "zap", label: "AI result" },
            ].map((step, i) => (
              <React.Fragment key={i}>
                {step.label ? (
                  <View style={styles.heroStep}>
                    <LinearGradient
                       colors={i === 4 ? [colors.gradientStart, colors.gradientEnd] : ["#ffffff18", "#ffffff10"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.heroStepIcon}
                    >
                      <Feather name={step.icon as any} size={16} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.heroStepLabel, { color: colors.mutedForeground }]}>
                      {step.label}
                    </Text>
                  </View>
                ) : (
                  <Feather name="arrow-right" size={14} color={colors.mutedForeground} style={{ marginBottom: 18 }} />
                )}
              </React.Fragment>
            ))}
          </View>

           <Text style={[styles.heroTitle, { color: colors.foreground }]}>
             Put yourself{"\n"}anywhere
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
             Choose a face photo, add a target scene, and let AI create the believable blend.
          </Text>

          <View style={styles.pickRow}>
            <Pressable
              onPress={() => pickImage("gallery")}
              disabled={!!picking}
              style={({ pressed }) => [styles.pickBtn, { opacity: pressed || picking === "gallery" ? 0.7 : 1 }]}
            >
               <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pickBtnInner}>
                <Feather name="image" size={18} color="#fff" />
                <Text style={styles.pickBtnText}>{picking === "gallery" ? "Opening…" : "Gallery"}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => pickImage("camera")}
              disabled={!!picking}
              style={({ pressed }) => [
                styles.pickBtnOutline,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed || picking === "camera" ? 0.7 : 1 },
              ]}
            >
              <Feather name="camera" size={18} color={colors.foreground} />
              <Text style={[styles.pickBtnText, { color: colors.foreground }]}>
                {picking === "camera" ? "Opening…" : "Selfie"}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        {historyReady && historyVisible && history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent swaps</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                {history.length}
              </Text>
            </View>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={3}
              removeClippedSubviews={Platform.OS !== "web"}
              columnWrapperStyle={{ gap: 8 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                  <HistoryCard item={item} onDelete={() => deleteFromHistory(item.id)} />
                </View>
              )}
            />
          </View>
        )}

        {historyReady && historyVisible && history.length === 0 && (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={28} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No swaps yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Pick a photo above to run your first AI face swap.
            </Text>
          </View>
        )}
        {(!historyReady || !historyVisible) && (
          <View style={styles.historyLoading} accessibilityLabel="Loading recent swaps" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 22, marginBottom: 28 },
  heroSteps: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  heroStep: { alignItems: "center", gap: 4 },
  heroStepIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  heroStepLabel: { fontSize: 9, fontFamily: "Inter_500Medium" },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30, marginBottom: 8 },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 20 },
  pickRow: { flexDirection: "row", gap: 12 },
  pickBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  pickBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  pickBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  pickBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  section: { marginBottom: 24 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  histCard: { borderRadius: 14, borderWidth: 1, padding: 10, overflow: "hidden" },
  histImages: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  histImg: { flex: 1, aspectRatio: 1, borderRadius: 8 },
  histArrow: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  histResultWrap: { flex: 1, aspectRatio: 1, borderRadius: 8, borderWidth: 1.5, overflow: "hidden" },
  histFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  histBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  histBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  histTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  histDel: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  historyLoading: { minHeight: 112 },
});
