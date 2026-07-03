import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
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
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a property image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) return;

      setImageUri(result.assets[0].uri);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not select image.");
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageUri) return null;

    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("properties")
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("properties").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSaveProperty = async () => {
    if (!propertyName || !propertyType || !address) {
      Alert.alert(
        "Missing Required Fields",
        "Please complete all mandatory data inputs before registering."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Session Expired", "User session context not found.");
        return;
      }

      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(user.id);
      }

      const { error } = await supabase.from("assets").insert([
        {
          user_id: user.id,
          property_name: propertyName.trim(),
          property_type: propertyType.trim(),
          address: address.trim(),
          description: description.trim(),
          image_url: imageUrl,
        },
      ]);

      if (error) {
        Alert.alert("Error Creating Record", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Property profile has been registered successfully."
      );
      router.back();
    } catch (error: any) {
      Alert.alert(
        "System Error",
        error.message || "An unexpected problem occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color="#303841"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Property Photo</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>

          <TouchableOpacity
            style={styles.imageUploadArea}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                />
                <View style={styles.imageOverlay}>
                  <View style={styles.changePhotoBadge}>
                    <MaterialCommunityIcons
                      name="camera-flip-outline"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={28}
                    color="#76ABAE"
                  />
                </View>
                <Text style={styles.uploadTitle}>Upload Property Photo</Text>
                <Text style={styles.uploadSubtitle}>
                  Tap to select from your gallery
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Group: Property Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Property Name <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunrise Horizon Apartments"
            placeholderTextColor="#A0AEC0"
            value={propertyName}
            onChangeText={setPropertyName}
          />
        </View>

        {/* Form Group: Property Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Property Type <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Apartment, Condo, Commercial"
            placeholderTextColor="#A0AEC0"
            value={propertyType}
            onChangeText={setPropertyType}
          />
        </View>

        {/* Form Group: Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Location Address <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cebu City, Central Visayas"
            placeholderTextColor="#A0AEC0"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Form Group: Description */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>General Description</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>
          <TextInput
            style={[styles.input, styles.description]}
            placeholder="Enter layout details, land background markers, or special guidelines..."
            placeholderTextColor="#A0AEC0"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      {/* Persistent Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveProperty}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F5" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="content-save-outline"
                size={20}
                color="#F5F5F5"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.buttonText}>Save Property Profile</Text>
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
  description: {
    height: 120,
    lineHeight: 20,
  },
  imageUploadArea: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
  },
  imagePlaceholder: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  uploadSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-end",
  },
  changePhotoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(30, 37, 43, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
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