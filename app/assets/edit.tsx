import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      Alert.alert("Error", "Unable to load property profile.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!propertyName || !propertyType || !address) {
      Alert.alert(
        "Missing Required Fields",
        "Please complete all mandatory fields before saving updates."
      );
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User session context was lost.");
        return;
      }

      const { error } = await supabase
        .from("assets")
        .update({
          property_name: propertyName.trim(),
          property_type: propertyType.trim(),
          address: address.trim(),
          description: description.trim(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        Alert.alert("Update Failed", error.message);
        return;
      }

      Alert.alert("Success", "Asset modifications saved successfully.");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to complete asset update operation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Perfectly Balanced Structural Screen Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerNavButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Edit Property</Text>
        {/* Mirror element to keep the absolute textual layout perfectly centered */}
        <View style={styles.headerMirrorBlock} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Input Block: Property Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Property Name <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={propertyName}
            onChangeText={setPropertyName}
            placeholder="e.g. Sunrise Horizon Apartments"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        {/* Form Input Block: Property Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Property Type <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={propertyType}
            onChangeText={setPropertyType}
            placeholder="e.g. Apartment, Condo, Villa"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        {/* Form Input Block: Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location Address <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Cebu City, Central Visayas"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        {/* Form Input Block: Description */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>General Description</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            placeholder="Modify asset guidelines, rules, layout descriptors, or boundaries..."
            placeholderTextColor="#A0AEC0"
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Submit Button Container */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#F5F5F5" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-all" size={20} color="#F5F5F5" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Save Modified Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // Balanced structural padding heights removing heavy top gaps across platform profiles
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerNavButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#303841",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  headerMirrorBlock: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: 8,
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
  description: {
    height: 140,
    lineHeight: 22,
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
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