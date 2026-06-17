import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useTransform } from "@/context/TransformContext";
import { useColors } from "@/hooks/useColors";

const API_BASE =
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

async function runFaceSwap(sourceBase64: string, targetBase64: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/face-swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceImage: sourceBase64, targetImage: targetBase64 }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Server error ${res.status}`);
  }

  return data.resultUrl as string;
}

export default function TransformScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sourcePhoto, sourcePhotoBase64, addToHistory } = useTransform();

  const [targetUri, setTargetUri] = useState<string | null>(null);
  const [targetBase64, setTargetBase64] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<"gallery" | "camera" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickTarget = async (source: "gallery" | "camera") => {
    setPickingTarget(source);
    setError(null);
    try {
      if (source === "camera") {
        if (Platform.OS === "web") {
          Alert.alert("Not available", "Camera is not supported on web.");
          return;
        }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed", "Camera access required."); return; }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed", "Photo library access required."); return; }
      }

      const fn = source === "camera"
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await fn({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri, base64 } = result.assets[0];
        Haptics.selectionAsync();
        setTargetUri(uri);
        setTargetBase64(base64 ? `data:image/jpeg;base64,${base64}` : null);
      }
    } finally {
      setPickingTarget(null);
    }
  };

  const handleSwap = () => {
    if (!sourcePhotoBase64 || !targetBase64) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setError(null);
    setProcessing(true);
  };

  const handleProcessingComplete = async () => {
    if (!sourcePhoto || !sourcePhotoBase64 || !targetUri || !targetBase64) {
      setProcessing(false);
      return;
    }

    try {
      const resultUrl = await runFaceSwap(sourcePhotoBase64, targetBase64);
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      addToHistory({
        id,
        originalUri: sourcePhoto,
        targetUri,
        resultUrl,
        createdAt: Date.now(),
      });

      setProcessing(false);
      router.push({
        pathname: "/result",
        params: { originalUri: sourcePhoto, targetUri, resultUrl },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Face swap failed";
      setProcessing(false);
      setError(msg);
    }
  };

  if (!sourcePhoto) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
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

  const canSwap = !!sourcePhotoBase64 && !!targetBase64;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Face Swap</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photosRow}>
          <View style={styles.photoBlock}>
            <View style={[styles.photoLabelRow]}>
              <LinearGradient colors={["#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stepDot}>
                <Text style={styles.stepNum}>1</Text>
              </LinearGradient>
              <Text style={[styles.photoLabel, { color: colors.foreground }]}>Your Face</Text>
              <View style={[styles.readyBadge, { backgroundColor: "#22C55E20" }]}>
                <Feather name="check" size={10} color="#22C55E" />
                <Text style={[styles.readyText, { color: "#22C55E" }]}>Ready</Text>
              </View>
            </View>
            <View style={[styles.photoWrap, { borderColor: "#22C55E80" }]}>
              <Image source={{ uri: sourcePhoto }} style={styles.photo} resizeMode="cover" />
            </View>
          </View>

          <View style={styles.swapArrow}>
            <LinearGradient colors={["#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.swapArrowInner}>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </View>

          <View style={styles.photoBlock}>
            <View style={styles.photoLabelRow}>
              <View style={[styles.stepDot, { backgroundColor: targetUri ? undefined : colors.card }]}>
                {targetUri ? (
                  <LinearGradient colors={["#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
                    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                      <Text style={styles.stepNum}>2</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.stepNum, { color: colors.mutedForeground }]}>2</Text>
                )}
              </View>
              <Text style={[styles.photoLabel, { color: colors.foreground }]}>Target</Text>
              {!targetUri && (
                <View style={[styles.readyBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.readyText, { color: colors.mutedForeground }]}>Needed</Text>
                </View>
              )}
              {targetUri && (
                <View style={[styles.readyBadge, { backgroundColor: "#22C55E20" }]}>
                  <Feather name="check" size={10} color="#22C55E" />
                  <Text style={[styles.readyText, { color: "#22C55E" }]}>Ready</Text>
                </View>
              )}
            </View>
            {targetUri ? (
              <Pressable onPress={() => setTargetUri(null)} style={styles.photoWrapTouchable}>
                <View style={[styles.photoWrap, { borderColor: "#7C3AED80" }]}>
                  <Image source={{ uri: targetUri }} style={styles.photo} resizeMode="cover" />
                  <View style={styles.changeOverlay}>
                    <Feather name="refresh-cw" size={18} color="#fff" />
                    <Text style={styles.changeText}>Change</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="image" size={28} color={colors.mutedForeground} />
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                  Pick target
                </Text>
              </View>
            )}
          </View>
        </View>

        {!targetUri && (
          <View style={styles.targetPickSection}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              Choose a target photo
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Your face will be swapped into this image.
            </Text>
            <View style={styles.targetPickRow}>
              <Pressable
                onPress={() => pickTarget("gallery")}
                disabled={!!pickingTarget}
                style={({ pressed }) => [
                  styles.targetPickBtn,
                  { opacity: pressed || pickingTarget === "gallery" ? 0.7 : 1 },
                ]}
              >
                <LinearGradient colors={["#7C3AED", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.targetPickBtnInner}>
                  <Feather name="image" size={18} color="#fff" />
                  <Text style={styles.targetPickBtnText}>
                    {pickingTarget === "gallery" ? "Opening…" : "From Gallery"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => pickTarget("camera")}
                disabled={!!pickingTarget}
                style={({ pressed }) => [
                  styles.targetPickBtnOutline,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed || pickingTarget === "camera" ? 0.7 : 1 },
                ]}
              >
                <Feather name="camera" size={18} color={colors.foreground} />
                <Text style={[styles.targetPickBtnText, { color: colors.foreground }]}>
                  {pickingTarget === "camera" ? "Opening…" : "Take Photo"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {error && (
          <View style={[styles.errorBox, { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
            <Feather name="alert-circle" size={16} color="#EF4444" />
            <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 },
        ]}
      >
        <Pressable
          onPress={handleSwap}
          disabled={!canSwap}
          style={({ pressed }) => [
            styles.swapBtn,
            { opacity: !canSwap ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.swapBtnGrad}
          >
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.swapBtnText}>
              {canSwap ? "Swap My Face" : "Select target photo first"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ProcessingOverlay
        visible={processing}
        styleName="Face Swap"
        onComplete={handleProcessingComplete}
        isAsync
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  photosRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 24 },
  photoBlock: { flex: 1 },
  photoLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  stepNum: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  photoLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  readyBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  readyText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  photoWrap: { aspectRatio: 1, borderRadius: 14, borderWidth: 2, overflow: "hidden" },
  photoWrapTouchable: { aspectRatio: 1 },
  photo: { width: "100%", height: "100%" },
  changeOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 2 },
  changeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  photoPlaceholder: { aspectRatio: 1, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  swapArrow: { paddingTop: 44, alignItems: "center" },
  swapArrowInner: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  targetPickSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  targetPickRow: { flexDirection: "row", gap: 12 },
  targetPickBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  targetPickBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  targetPickBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  targetPickBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 20 },
  swapBtn: { borderRadius: 16, overflow: "hidden" },
  swapBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  swapBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  centerEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backLink: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  backLinkText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
