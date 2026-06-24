import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

export default function TenantDetails() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "User session not found.");
      router.replace("/(auth)/login");
      return;
    }

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.log(error);
      Alert.alert("Error", error.message);
      handleBackNavigation();
      return;
    }

    setFullName(data.full_name || "");
    setContactNumber(data.contact_number || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setEmergencyContact(data.emergency_contact || "");
    setNotes(data.notes || "");
    setStatus(data.status || "Active");

    setLoading(false);
  };

  const handleBackNavigation = () => {
    router.replace("/tenants");
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User session not found.");
        return;
      }

      const { error } = await supabase
        .from("tenants")
        .update({
          full_name: fullName,
          contact_number: contactNumber,
          email,
          address,
          emergency_contact: emergencyContact,
          notes,
          status,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success", "Tenant record updated smoothly.");
      setEditing(false);
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Tenant Profile",
      "Are you sure you want to completely remove this tenant account record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Record",
          style: "destructive",
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
              .from("tenants")
              .delete()
              .eq("id", id)
              .eq("user_id", user.id);

            if (error) {
              Alert.alert("Error", error.message);
              return;
            }

            Alert.alert("Success", "Tenant records permanently expunged.");
            handleBackNavigation();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Premium Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1E252B" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Tenant Directory Profile</Text>
        <TouchableOpacity 
          onPress={() => setEditing(!editing)} 
          style={[styles.headerButton, editing && styles.headerButtonActive]}
        >
          <MaterialCommunityIcons 
            name={editing ? "close" : "pencil"} 
            size={18} 
            color={editing ? "#FF5722" : "#76ABAE"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Identity Profile Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account-tie" size={28} color="#76ABAE" />
          </View>
          <View style={styles.identityDetails}>
            <Text style={styles.identityName}>{fullName || "Unnamed Tenant"}</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: status === "Active" ? "rgba(46, 125, 50, 0.1)" : "rgba(255, 87, 34, 0.1)" }
            ]}>
              <View style={[styles.statusDot, { backgroundColor: status === "Active" ? "#2E7D32" : "#FF5722" }]} />
              <Text style={[styles.statusBadgeText, { color: status === "Active" ? "#2E7D32" : "#FF5722" }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Interactive Status Selector Panel (Only displays in Edit Mode) */}
        {editing && (
          <View style={styles.statusSelectPanel}>
            <Text style={styles.sectionHeadingText}>Update Status State</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity 
                style={[styles.toggleOption, status === "Active" && styles.toggleOptionActiveActive]}
                onPress={() => setStatus("Active")}
              >
                <Text style={[styles.toggleText, status === "Active" && styles.toggleTextActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleOption, status === "Inactive" && styles.toggleOptionActiveInactive]}
                onPress={() => setStatus("Inactive")}
              >
                <Text style={[styles.toggleText, status === "Inactive" && styles.toggleTextActive]}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Detailed Form Matrix Field Management */}
        <View style={styles.profileFormContainer}>
          {/* Field: Full Name */}
          <View style={styles.formFieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="card-account-details-outline" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Full Legal Name</Text>
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              editable={editing}
              style={[styles.inputField, !editing && styles.inputFieldDisabled]}
              placeholderTextColor="#A0AEC0"
            />
            {/* FIXED: Added clear context baseline divider line below input data */}
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>

          {/* Field: Contact Number */}
          <View style={styles.formFieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="cellphone" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Contact Number</Text>
            </View>
            <TextInput
              value={contactNumber}
              onChangeText={setContactNumber}
              editable={editing}
              keyboardType="phone-pad"
              style={[styles.inputField, !editing && styles.inputFieldDisabled]}
              placeholderTextColor="#A0AEC0"
            />
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>

          {/* Field: Email */}
          <View style={styles.formFieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="email-fast-outline" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Email Address</Text>
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.inputField, !editing && styles.inputFieldDisabled]}
              placeholderTextColor="#A0AEC0"
            />
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>

          {/* Field: Address */}
          <View style={styles.formFieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Permanent Registered Address</Text>
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              editable={editing}
              style={[styles.inputField, !editing && styles.inputFieldDisabled]}
              placeholderTextColor="#A0AEC0"
            />
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>

          {/* Field: Emergency Contact */}
          <View style={styles.formFieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="account-alert-outline" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Emergency Backup Contact</Text>
            </View>
            <TextInput
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              editable={editing}
              style={[styles.inputField, !editing && styles.inputFieldDisabled]}
              placeholderTextColor="#A0AEC0"
            />
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>

          {/* Field: Notes */}
          <View style={[styles.formFieldRow, { borderBottomWidth: 0 }]}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="text-box-search-outline" size={15} color="#76ABAE" />
              <Text style={styles.fieldLabelText}>Internal Landlord Ledger Notes</Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              editable={editing}
              multiline
              style={[
                styles.inputField, 
                styles.textAreaField, 
                !editing && styles.inputFieldDisabled
              ]}
              placeholder={editing ? "Write special custom notes here..." : "No administrative ledger notes configured."}
              placeholderTextColor="#A0AEC0"
            />
            {!editing && <View style={styles.viewModeLineDivider} />}
          </View>
        </View>

        {/* Form Context Control Blocks */}
        {editing ? (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-all" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryDangerBtn}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF5722" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryDangerText}>Remove Tenant Profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EEF2F6",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "rgba(255, 87, 34, 0.08)",
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E252B",
    letterSpacing: -0.2,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(118, 171, 174, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  identityDetails: {
    flex: 1,
    justifyContent: "center",
  },
  identityName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E252B",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusSelectPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 20,
  },
  sectionHeadingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  toggleOptionActiveActive: {
    borderColor: "#2E7D32",
    backgroundColor: "rgba(46, 125, 50, 0.06)",
  },
  toggleOptionActiveInactive: {
    borderColor: "#FF5722",
    backgroundColor: "rgba(255, 87, 34, 0.06)",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#1E252B",
    fontWeight: "700",
  },
  profileFormContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 26,
  },
  formFieldRow: {
    paddingVertical: 14,
  },
  labelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  fieldLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputField: {
    fontSize: 15,
    color: "#1E252B",
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputFieldDisabled: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
    color: "#334155",
    fontSize: 15,
    fontWeight: "500",
  },
  // FIXED: Style for clean baseline structural lines under view state elements
  viewModeLineDivider: {
    height: 1,
    backgroundColor: "#EEF2F6",
    marginTop: 10,
    opacity: 0.8,
  },
  textAreaField: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  primaryActionBtn: {
    flexDirection: "row",
    backgroundColor: "#76ABAE",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  secondaryDangerBtn: {
    borderWidth: 1.5,
    borderColor: "#FF5722",
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  secondaryDangerText: {
    color: "#FF5722",
    fontSize: 14,
    fontWeight: "700",
  },
});