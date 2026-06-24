import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function AddTenant() {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSaveTenant = async () => {
    if (!fullName || !contactNumber) {
      Alert.alert(
        "Required Fields Missing",
        "Please provide both Full Name and Contact Number parameters."
      );
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Session Expired", "User session context window dropped out. Please re-authenticate.");
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
        Alert.alert("Execution Error", error.message);
        return;
      }

      Alert.alert("Success", "Tenant added successfully.");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("System Error", "An unmapped platform disruption occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Premium Dark Accent Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Onboard Occupant</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Group: Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>FULL NAME <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={[styles.input, focusedField === "fullName" && styles.inputFocused]}
            placeholder="e.g. Juan Dela Cruz"
            placeholderTextColor="#64748B"
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocusedField("fullName")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Form Group: Contact Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>CONTACT NUMBER <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={[styles.input, focusedField === "contactNumber" && styles.inputFocused]}
            placeholder="e.g. 09123456789"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
            onFocus={() => setFocusedField("contactNumber")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Form Group: Email */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <Text style={styles.optionalTag}>OPTIONAL</Text>
          </View>
          <TextInput
            style={[styles.input, focusedField === "email" && styles.inputFocused]}
            placeholder="e.g. juan.delacruz@gmail.com"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Form Group: Permanent Address */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>PERMANENT ADDRESS</Text>
            <Text style={styles.optionalTag}>OPTIONAL</Text>
          </View>
          <TextInput
            style={[styles.input, focusedField === "address" && styles.inputFocused]}
            placeholder="e.g. Cebu City, Cebu"
            placeholderTextColor="#64748B"
            value={address}
            onChangeText={setAddress}
            onFocus={() => setFocusedField("address")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Form Group: Emergency Contact */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>EMERGENCY CONTACT REFERENCE</Text>
            <Text style={styles.optionalTag}>OPTIONAL</Text>
          </View>
          <TextInput
            style={[styles.input, focusedField === "emergencyContact" && styles.inputFocused]}
            placeholder="e.g. 09123456789"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            onFocus={() => setFocusedField("emergencyContact")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Form Group: Additional Notes */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>RECORDS & BACKGROUND NOTES</Text>
            <Text style={styles.optionalTag}>OPTIONAL</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput, focusedField === "notes" && styles.inputFocused]}
            placeholder="Enter reference details, baseline info check verification tags..."
            placeholderTextColor="#64748B"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setFocusedField("notes")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </ScrollView>

      {/* Persistent Premium Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveTenant}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Commit Tenant Record</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 55,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#303841", // Deep dark contrast text color
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  asterisk: {
    color: "#EF4444",
    fontWeight: "900",
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F7072", // Darker dark-teal variance 
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1", // Enhanced contrast border color
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#1E293B", // Strong dark dynamic value input
    fontSize: 14,
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  inputFocused: {
    borderColor: "#303841", // Striking clear signature boundary outline focus
    backgroundColor: "#FFFFFF",
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  notesInput: {
    height: 120,
    lineHeight: 22,
  },
  bottomBar: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  button: {
    backgroundColor: "#303841", // Deep premium charcoal color profile button track setup
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.1,
  },
});