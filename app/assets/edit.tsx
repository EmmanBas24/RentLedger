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
import { supabase } from "../../src/lib/supabase";

export default function EditAsset() {
  const { id } = useLocalSearchParams();
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  const fetchAsset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User session not found.");
        router.replace("/(auth)/login");
        return;
      }

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        router.back();
        return;
      }

      setPropertyName(data.property_name || "");
      setPropertyType(data.property_type || "");
      setAddress(data.address || "");
      setDescription(data.description || "");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to load property.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!propertyName || !propertyType || !address) {
      Alert.alert(
        "Missing Information",
        "Please complete all required fields."
      );
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User session not found.");
        return;
      }

      const { error } = await supabase
        .from("assets")
        .update({
          property_name: propertyName,
          property_type: propertyType,
          address,
          description,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success", "Property updated successfully.");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to save property.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2B5748" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Property</Text>

      <Text style={styles.label}>Property Name</Text>
      <TextInput
        style={styles.input}
        value={propertyName}
        onChangeText={setPropertyName}
        placeholder="Sunrise Apartment"
      />

      <Text style={styles.label}>Property Type</Text>
      <TextInput
        style={styles.input}
        value={propertyType}
        onChangeText={setPropertyType}
        placeholder="Apartment"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Cebu City"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.description]}
        value={description}
        onChangeText={setDescription}
        placeholder="Property description..."
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#273338",
  },
  label: {
    fontWeight: "600",
    color: "#273338",
    marginBottom: 8,
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
  description: {
    height: 120,
  },
  button: {
    backgroundColor: "#2B5748",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
