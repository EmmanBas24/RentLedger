import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function TenantDetails() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] =
    useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] =
    useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState("Active");

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setFullName(data.full_name || "");
    setContactNumber(
      data.contact_number || ""
    );
    setEmail(data.email || "");
    setAddress(data.address || "");
    setEmergencyContact(
      data.emergency_contact || ""
    );
    setNotes(data.notes || "");
    setStatus(data.status || "Active");

    setLoading(false);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("tenants")
        .update({
          full_name: fullName,
          contact_number: contactNumber,
          email,
          address,
          emergency_contact:
            emergencyContact,
          notes,
          status,
        })
        .eq("id", id);

      if (error) {
        Alert.alert(
          "Error",
          error.message
        );
        return;
      }

      Alert.alert(
        "Success",
        "Tenant updated successfully."
      );

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
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } =
              await supabase
                .from("tenants")
                .delete()
                .eq("id", id);

            if (error) {
              Alert.alert(
                "Error",
                error.message
              );
              return;
            }

            Alert.alert(
              "Success",
              "Tenant deleted."
            );

            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#10B981"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 16 }}
      >
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            setEditing(!editing)
          }
        >
          <Text style={styles.editText}>
            {editing
              ? "Cancel"
              : "Edit Tenant"}
          </Text>
        </TouchableOpacity>

      <Text style={styles.label}>
        Full Name
      </Text>

      <TextInput
        value={fullName}
        onChangeText={setFullName}
        editable={editing}
        style={styles.input}
      />

      <Text style={styles.label}>
        Contact Number
      </Text>

      <TextInput
        value={contactNumber}
        onChangeText={setContactNumber}
        editable={editing}
        style={styles.input}
      />

      <Text style={styles.label}>
        Email
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        editable={editing}
        style={styles.input}
      />

      <Text style={styles.label}>
        Address
      </Text>

      <TextInput
        value={address}
        onChangeText={setAddress}
        editable={editing}
        style={styles.input}
      />

      <Text style={styles.label}>
        Emergency Contact
      </Text>

      <TextInput
        value={emergencyContact}
        onChangeText={
          setEmergencyContact
        }
        editable={editing}
        style={styles.input}
      />

      <Text style={styles.label}>
        Notes
      </Text>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        editable={editing}
        multiline
        style={[
          styles.input,
          {
            height: 100,
          },
        ]}
      />

      {editing && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={
                styles.saveText
              }
            >
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.deleteText}>
          Delete Tenant
        </Text>
      </TouchableOpacity>
    </ScrollView>
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: "700",
    color: "#F2F4F7",
    textAlign: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
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

  editButton: {
    backgroundColor: "#2B5748",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },

  editText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  saveButton: {
    backgroundColor: "#2B5748",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#273338",
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 40,
  },

  deleteText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});