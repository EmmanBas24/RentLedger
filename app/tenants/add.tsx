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
  const [emergencyContact, setEmergencyContact] =
    useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSaveTenant = async () => {
    if (!fullName || !contactNumber) {
      Alert.alert(
        "Missing Information",
        "Full Name and Contact Number are required."
      );
      return;
    }

    try {
      setLoading(true);

     const { error } = await supabase
  .from("tenants")
  .insert([
    {
      full_name: fullName,
      contact_number: contactNumber,
      email,
      address,
      emergency_contact: emergencyContact,
      notes,
      status: "Active",
    },
  ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Tenant added successfully."
      );

      router.back();
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Tenant</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 160,
          paddingTop: 16,
        }}
      >
        <Text style={styles.label}>
          Full Name *
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>
          Contact Number *
        </Text>

        <TextInput
          style={styles.input}
          placeholder="09123456789"
          keyboardType="phone-pad"
          value={contactNumber}
          onChangeText={setContactNumber}
        />

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="juan@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>
          Address
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Cebu City"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>
          Emergency Contact
        </Text>

        <TextInput
          style={styles.input}
          placeholder="09123456789"
          keyboardType="phone-pad"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />

        <Text style={styles.label}>
          Notes
        </Text>

        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Additional information..."
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveTenant}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Tenant</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#273338",
  },

  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 34,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2B5748",
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F2F4F7",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#273338",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#273338",
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#2B5748",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    color: "#273338",
  },

  notesInput: {
    height: 100,
  },

  button: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#2B5748",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});