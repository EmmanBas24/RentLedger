import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { generateTenantAndPropertyReport } from "../../src/utils/generateTenantReport";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Live Metrics Counts
  const [totalProperties, setTotalProperties] = useState(0);
  const [occupiedUnits, setOccupiedUnits] = useState(0);
  const [availableUnits, setAvailableUnits] = useState(0);

  // Track field focus states for cleaner dynamic input styling
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndMetrics();
    }, [])
  );

  const fetchProfileAndMetrics = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [profileRes, assetsRes, roomsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("assets").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("status"),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setEmail(profileRes.data.email || "");
        setPhone(profileRes.data.phone || "");
        setAddress(profileRes.data.address || "");
        setAvatarUrl(profileRes.data.avatar_url || null);
      }

      setTotalProperties(assetsRes.count || 0);

      const roomData = roomsRes.data || [];
      setOccupiedUnits(
        roomData.filter((r) => r.status?.toLowerCase() === "occupied").length
      );
      setAvailableUnits(
        roomData.filter((r) => r.status?.toLowerCase() === "available").length
      );
    } catch (err) {
      console.error("Error syncing profile metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to update your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);

      const asset = result.assets[0];
      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
     const filePath = fileName;

      // Read the file as a blob for upload
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer for Supabase upload
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: asset.mimeType || `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update the profile record with the new avatar URL
    const { error: updateError, data: updateData, count } = await supabase
  .from("profiles")
  .update({ avatar_url: publicUrl })
  .eq("id", userId)
  .select();
if (updateError) {
  Alert.alert("Update Failed", updateError.message);
  return;
}

if (!updateData || updateData.length === 0) {
  Alert.alert("Update Failed", "No rows were updated. RLS may be blocking the update.");
  return;
}

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      phone,
      address,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Profile updated.");
      setEditing(false);
    }
  };

  const handleCompilePDF = async () => {
    try {
      setGeneratingReport(true);
      await generateTenantAndPropertyReport({
        totalProperties,
        occupiedUnits,
        availableUnits,
      });
    } catch (err: any) {
      Alert.alert(
        "Report Failure",
        err.message || "Could not complete report generation request."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  const formItems = [
    {
      label: "Full Name",
      value: fullName,
      setter: setFullName,
      type: "default",
      icon: "account-outline",
    },
    {
      label: "Email Address",
      value: email,
      setter: setEmail,
      type: "email-address",
      icon: "email-outline",
    },
    {
      label: "Phone Number",
      value: phone,
      setter: setPhone,
      type: "phone-pad",
      icon: "phone-outline",
    },
    {
      label: "Physical Address",
      value: address,
      setter: setAddress,
      type: "default",
      icon: "map-marker-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Dashboard Hero Header Card */}
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {fullName?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}

            {/* Camera badge overlay */}
            <View style={styles.cameraBadge}>
              {uploadingImage ? (
                <ActivityIndicator size={12} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name="camera"
                  size={12}
                  color="#FFFFFF"
                />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.heroTitle} numberOfLines={1}>
            {fullName || "User Profile"}
          </Text>
          <View style={styles.badgeContainer}>
            <MaterialCommunityIcons
              name="shield-check"
              size={13}
              color="#76ABAE"
            />
            <Text style={styles.heroSubtitle}>Landlord Account</Text>
          </View>
        </View>

        {/* --- DYNAMIC PROPERTY OVERVIEW & PDF COMPILER ZONE --- */}
        <Text style={styles.sectionHeader}>Property Overview</Text>
        <View style={styles.analyticsCard}>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.borderRight]}>
              <Text style={styles.statNumber}>{totalProperties}</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </View>
            <View style={[styles.statBox, styles.borderRight]}>
              <Text style={[styles.statNumber, { color: "#2E7D32" }]}>
                {occupiedUnits}
              </Text>
              <Text style={styles.statLabel}>Occupied</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#76ABAE" }]}>
                {availableUnits}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.reportActionButton,
              generatingReport && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={handleCompilePDF}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <ActivityIndicator color="#303841" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={20}
                  color="#303841"
                />
                <Text style={styles.reportActionText}>
                  Export PDF Statements Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Account Information</Text>

        {/* Minimal Clean Profile Rows */}
        <View style={styles.card}>
          {formItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.fieldRow,
                index !== formItems.length - 1 && styles.borderBottom,
              ]}
            >
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={18}
                  color="#64748B"
                  style={styles.iconMargin}
                />
                <Text style={styles.label}>{item.label}</Text>
              </View>

              {editing ? (
                <TextInput
                  style={[
                    styles.input,
                    focusedField === item.label && styles.inputFocused,
                  ]}
                  value={item.value}
                  onChangeText={item.setter}
                  keyboardType={item.type as any}
                  onFocus={() => setFocusedField(item.label)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={`Set ${item.label.toLowerCase()}`}
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.value} numberOfLines={1}>
                  {item.value || "Not set"}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Dynamic Action Buttons Block */}
        <TouchableOpacity
          style={[styles.primaryButton, editing && styles.saveButtonVariant]}
          activeOpacity={0.9}
          onPress={() => (editing ? handleUpdateProfile() : setEditing(true))}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons
                name={editing ? "check-circle" : "account-edit"}
                size={18}
                color="#FFF"
              />
              <Text style={styles.buttonText}>
                {editing ? "Save Changes" : "Edit Profile"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={() => setEditing(false)}
          >
            <Text style={styles.cancelText}>Cancel Changes</Text>
          </TouchableOpacity>
        )}

        <View style={styles.dividerStrip} />

        {/* High Visibility Destructive Action Zone */}
        <TouchableOpacity
          style={styles.logoutCardButton}
          activeOpacity={0.85}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          }}
        >
          <View style={styles.logoutIconCircle}>
            <MaterialCommunityIcons name="logout" size={18} color="#F43F5E" />
          </View>
          <View style={styles.logoutTextContainer}>
            <Text style={styles.logoutText}>Sign Out Account</Text>
            <Text style={styles.logoutSubtitle}>
              Disconnect securely from RentLedger
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#FDA4AF"
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroCard: {
    backgroundColor: "#1E252B",
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#76ABAE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#76ABAE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1E252B",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(118, 171, 174, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  heroSubtitle: { color: "#76ABAE", fontSize: 11, fontWeight: "700" },
  analyticsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  borderRight: { borderRightWidth: 1, borderRightColor: "#F1F5F9" },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#303841" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },
  reportActionButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reportActionText: { color: "#303841", fontSize: 13, fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 56,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  labelContainer: { flexDirection: "row", alignItems: "center" },
  iconMargin: { marginRight: 10 },
  label: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  value: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  input: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    width: "60%",
    textAlign: "right",
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputFocused: { borderColor: "#76ABAE", backgroundColor: "#FFFFFF" },
  primaryButton: {
    backgroundColor: "#1E252B",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonVariant: { backgroundColor: "#2E7D32", shadowColor: "#2E7D32" },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  cancelButton: { marginTop: 14, alignItems: "center", paddingVertical: 6 },
  cancelText: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  dividerStrip: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
    marginHorizontal: 8,
  },
  logoutCardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFE4E6",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE4E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoutTextContainer: { flex: 1 },
  logoutText: { color: "#E11D48", fontWeight: "700", fontSize: 15 },
  logoutSubtitle: {
    color: "#FB7185",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
});