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
export default function EditRoom() {
  const { id } = useLocalSearchParams(); // Room ID
  const [roomNumber, setRoomNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [status, setStatus] = useState("Available");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const statusOptions = ["Available", "Occupied", "Maintenance"];

  useEffect(() => {
    if (id) {
      fetchRoomDetails();
    }
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        Alert.alert("Error", "Could not fetch room details.");
        router.back();
        return;
      }

      if (data) {
        setRoomNumber(data.room_number || "");
        setMonthlyRent(String(data.monthly_rent || ""));
        setStatus(data.status || "Available");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteRoom = async (roomId: string, currentStatus: string) => {
  // Guard clause block checking actual real-time room operational flags
  if (currentStatus === "Occupied") {
    Alert.alert(
      "Action Prohibited",
      "You cannot delete this room while it is marked as Occupied by an active tenant."
    );
    return;
  }

  Alert.alert(
    "Remove Room",
    "Are you sure you want to permanently delete this unit from the registry?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove Unit",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("rooms")
              .delete()
              .eq("id", roomId);

            if (error) {
              Alert.alert("Operation Failed", error.message);
              return;
            }

            Alert.alert("Success", "Room unit was deleted successfully.");
            
            // Invoke your data reload trigger here (e.g., fetchRooms())
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]
  );
};
  const handleUpdateRoom = async () => {
    if (!roomNumber || !monthlyRent) {
      Alert.alert("Missing Fields", "Please complete all mandatory fields.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("rooms")
        .update({
          room_number: roomNumber.trim(),
          monthly_rent: Number(monthlyRent),
          status: status,
        })
        .eq("id", id);

      if (error) {
        Alert.alert("Update Failed", error.message);
        return;
      }

      Alert.alert("Success", "Room details updated safely.");
      router.back();
    } catch (err) {
      console.log(err);
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

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerNavButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Edit Room Unit</Text>
        <View style={styles.headerMirrorBlock} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Room Name / Code <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="e.g. Unit 101"
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Monthly Valuation Rate (PHP) <Text style={styles.asterisk}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={monthlyRent}
            onChangeText={setMonthlyRent}
            placeholder="e.g. 7500"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Occupancy Status State</Text>
          <View style={styles.statusSelectorRow}>
            {statusOptions.map((option) => {
              const isSelected = status === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.statusOptionBtn, isSelected && styles.statusOptionBtnSelected]}
                  onPress={() => setStatus(option)}
                >
                  <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.button} onPress={handleUpdateRoom} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color="#F5F5F5" size="small" /> : <Text style={styles.buttonText}>Save Modified Unit</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  headerNavButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  headerTitleText: { fontSize: 17, fontWeight: "700", color: "#303841", letterSpacing: -0.3, textAlign: "center" },
  headerMirrorBlock: { width: 40, height: 40 },
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "700", color: "#303841", marginBottom: 8 },
  asterisk: { color: "#FF5722" },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#303841", fontSize: 15, fontWeight: "500" },
  statusSelectorRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statusOptionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF", alignItems: "center" },
  statusOptionBtnSelected: { borderColor: "#76ABAE", backgroundColor: "rgba(118, 171, 174, 0.08)" },
  statusOptionText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  statusOptionTextSelected: { color: "#76ABAE", fontWeight: "700" },
  bottomBar: { backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 20, borderTopWidth: 1, borderColor: "#E2E8F0" },
  button: { backgroundColor: "#FF5722", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#F5F5F5", fontWeight: "700", fontSize: 16 },
});