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
import { supabase } from "../../src/lib/supabase";

export default function AddProperty() {
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveProperty = async () => {
    if (!propertyName || !propertyType || !address) {
      Alert.alert(
        "Missing Information",
        "Please complete all required fields."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("assets")
        .insert([
          {
            property_name: propertyName,
            property_type: propertyType,
            address,
            description,
          },
        ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Property added successfully."
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Add Property
      </Text>

      <View style={styles.labelRow}><Text style={styles.label}>Property Name</Text></View>
      <TextInput style={styles.input} placeholder="Sunrise Apartment" value={propertyName} onChangeText={setPropertyName} />

      <View style={styles.labelRow}><Text style={styles.label}>Property Type</Text></View>
      <TextInput style={styles.input} placeholder="Apartment" value={propertyType} onChangeText={setPropertyType} />

      <View style={styles.labelRow}><Text style={styles.label}>Address</Text></View>
      <TextInput style={styles.input} placeholder="Cebu City" value={address} onChangeText={setAddress} />

      <View style={styles.labelRow}><Text style={styles.label}>Description</Text></View>
      <TextInput style={[styles.input, styles.description]} multiline textAlignVertical="top" placeholder="Property description..." value={description} onChangeText={setDescription} />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveProperty}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Save Property
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000000",
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#0f172a",
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  labelIcon: {
    marginRight: 8,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  description: {
    height: 100,
  },

  button: {
    backgroundColor: "#000000",
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