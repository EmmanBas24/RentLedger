import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function AddTenant() {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSaveTenant = async () => {
    if (!fullName || !contactNumber) {
      Alert.alert(
        "Missing Required Fields",
        "Please fill out both Full Name and Contact Number before saving."
      );
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Session Expired", "User session not found. Please log in again.");
        return;
      }

      const { error } = await supabase
        .from("tenants")
        .insert([
          {
            user_id: user.id,
            full_name: fullName,
            contact_number: contactNumber,
            email: email.trim(),
            address: address.trim(),
            emergency_contact: emergencyContact,
            notes: notes.trim(),
            status: "Inactive",
          },
        ]);

      if (error) {
        Alert.alert("Error Creating Record", error.message);
        return;
      }

      Alert.alert("Success", "Tenant profile has been created successfully.");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("System Error", "An unexpected problem occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Structural Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Tenant</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Group: Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Juan Dela Cruz"
            placeholderTextColor="#A0AEC0"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Form Group: Contact Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Number <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 09123456789"
            placeholderTextColor="#A0AEC0"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
          />
        </View>

        {/* Form Group: Email */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. juan.delacruz@gmail.com"
            placeholderTextColor="#A0AEC0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Form Group: Permanent Address */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Permanent Address</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cebu City, Cebu"
            placeholderTextColor="#A0AEC0"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Form Group: Emergency Contact */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Emergency Contact Number</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. 09123456789"
            placeholderTextColor="#A0AEC0"
            keyboardType="phone-pad"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />
        </View>

        {/* Form Group: Additional Notes */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Additional Notes</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Enter reference details, landmark address info, or background checks..."
            placeholderTextColor="#A0AEC0"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* Persistent Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveTenant}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F5" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#F5F5F5" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Save Tenant Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303841",
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#303841",
    marginBottom: 8,
  },
  asterisk: {
    color: "#FF5722",
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#76ABAE",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#303841",
    fontSize: 15,
    fontWeight: "500",
  },
  notesInput: {
    height: 120,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  button: {
    backgroundColor: "#FF5722",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },
});