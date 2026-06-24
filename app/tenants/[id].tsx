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

  // Explicit route forcing to ensure you land directly back on the main tenant directory index
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

      Alert.alert("Success", "Tenant updated successfully.");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Tenant",
      "Are you sure you want to delete this tenant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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

            Alert.alert("Success", "Tenant deleted.");
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Profile</Text>
        <TouchableOpacity 
          onPress={() => setEditing(!editing)} 
          style={[styles.backButton, editing && styles.backButtonActive]}
        >
          <MaterialCommunityIcons 
            name={editing ? "close" : "pencil-outline"} 
            size={20} 
            color={editing ? "#FF5722" : "#76ABAE"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Header Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={32} color="#76ABAE" />
          </View>
          <View style={styles.identityDetails}>
            <Text style={styles.identityName}>{fullName || "Unnamed Tenant"}</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: status === "Active" ? "rgba(118, 171, 174, 0.15)" : "rgba(255, 87, 34, 0.12)" }
            ]}>
              <Text style={[styles.statusBadgeText, { color: status === "Active" ? "#76ABAE" : "#FF5722" }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Form Matrix */}
        <View style={styles.profileCard}>
          {/* Field: Full Name */}
          <View style={styles.fieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="account-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Full Name</Text>
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              editable={editing}
              style={[styles.input, !editing && styles.inputDisabled]}
            />
          </View>

          {/* Field: Contact Number */}
          <View style={styles.fieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Contact Number</Text>
            </View>
            <TextInput
              value={contactNumber}
              onChangeText={setContactNumber}
              editable={editing}
              keyboardType="phone-pad"
              style={[styles.input, !editing && styles.inputDisabled]}
            />
          </View>

          {/* Field: Email */}
          <View style={styles.fieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, !editing && styles.inputDisabled]}
            />
          </View>

          {/* Field: Address */}
          <View style={styles.fieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Permanent Address</Text>
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              editable={editing}
              style={[styles.input, !editing && styles.inputDisabled]}
            />
          </View>

          {/* Field: Emergency Contact */}
          <View style={styles.fieldRow}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Emergency Contact</Text>
            </View>
            <TextInput
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              editable={editing}
              style={[styles.input, !editing && styles.inputDisabled]}
            />
          </View>

          {/* Field: Notes */}
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <View style={styles.labelSection}>
              <MaterialCommunityIcons name="notebook-outline" size={16} color="#64748B" />
              <Text style={styles.label}>Internal Notes</Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              editable={editing}
              multiline
              style={[
                styles.input, 
                styles.textArea, 
                !editing && styles.inputDisabled
              ]}
              placeholder={editing ? "Add structural details or general notes..." : "No additional remarks."}
              placeholderTextColor="#A0AEC0"
            />
          </View>
        </View>

        {/* Dynamic Context Buttons */}
        {editing ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveText}>Save Details</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.destructiveOutlineBtn}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF5722" style={{ marginRight: 6 }} />
            <Text style={styles.destructiveOutlineText}>Remove Tenant Profile</Text>
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
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonActive: {
    backgroundColor: "rgba(255, 87, 34, 0.08)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#303841",
    letterSpacing: -0.3,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(118, 171, 174, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  identityDetails: {
    flex: 1,
    gap: 4,
  },
  identityName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303841",
    letterSpacing: -0.2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  labelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#76ABAE",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 15,
    color: "#303841",
    fontWeight: "500",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputDisabled: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    color: "#475569",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: "#76ABAE",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  destructiveOutlineBtn: {
    borderWidth: 1,
    borderColor: "#FF5722",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  destructiveOutlineText: {
    color: "#FF5722",
    fontSize: 14,
    fontWeight: "700",
  },
});