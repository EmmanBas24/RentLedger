import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function AddRoom() {
  const { assetId } = useLocalSearchParams();

  const [roomNumber, setRoomNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveRoom = async () => {
    if (!roomNumber || !monthlyRent) {
      Alert.alert(
        "Missing Information",
        "Please complete all fields."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("rooms")
        .insert([
          {
            asset_id: assetId,
            room_number: roomNumber,
            monthly_rent: Number(monthlyRent),
            status: "Available",
          },
        ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Room added successfully."
      );

      router.back();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible
      onRequestClose={() => router.back()}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Add Room</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Room 101"
            value={roomNumber}
            onChangeText={setRoomNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Monthly Rent"
            value={monthlyRent}
            onChangeText={setMonthlyRent}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Save Room
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: "#111827",
  },

  button: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 14,
  },

  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
});