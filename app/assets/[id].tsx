import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

interface Property {
  id: string;
  property_name: string;
  property_type: string;
  address: string;
  description: string;
}

interface Room {
  id: string;
  room_number: string;
  monthly_rent: number;
  status: string;
}

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();

  const [property, setProperty] =
    useState<Property | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);

  useEffect(() => {
    fetchProperty();
    fetchRooms();
  }, []);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) {
      setProperty(data);
    }
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("asset_id", id)
      .order("created_at");

    if (!error) {
      setRooms(data || []);
    }

    setLoading(false);
  };

  const handleDeleteProperty = async () => {
    Alert.alert(
      "Delete Property",
      "Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("assets")
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
              "Property deleted."
            );

            router.back();
          },
        },
      ]
    );
  };

  const handleSaveRoom = async () => {
    if (!roomNumber || !monthlyRent) {
      Alert.alert(
        "Missing Information",
        "Please complete all fields."
      );
      return;
    }

    try {
      setSavingRoom(true);

      const { error } = await supabase
        .from("rooms")
        .insert([
          {
            asset_id: id,
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

      setRoomNumber("");
      setMonthlyRent("");
      setShowAddRoomModal(false);
      fetchRooms();
    } catch (error) {
      console.log(error);
    } finally {
      setSavingRoom(false);
    }
  };

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "Occupied":
        return "#ef4444";

      case "Maintenance":
        return "#f59e0b";

      default:
        return "#10B981";
    }
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Property Details</Text>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>
          {property?.property_name}
        </Text>

        <Text style={styles.type}>
          {property?.property_type}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>
            {property?.address}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>
            {property?.description || "No description provided."}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addRoomButton}
        onPress={() => setShowAddRoomModal(true)}
      >
        <Text style={styles.addRoomText}>
          + Add Room
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={showAddRoomModal}
        onRequestClose={() => setShowAddRoomModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddRoomModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Room 101"
              placeholderTextColor="#6b7280"
              value={roomNumber}
              onChangeText={setRoomNumber}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Monthly Rent"
              placeholderTextColor="#6b7280"
              value={monthlyRent}
              onChangeText={setMonthlyRent}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveRoom}
              disabled={savingRoom}
            >
              {savingRoom ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSaveText}>
                  Save Room
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>
        Rooms
      </Text>

      {rooms.length === 0 ? (
        <View style={styles.emptyRoom}>
          <Text>
            No rooms added yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.roomCard}>
              <View>
                <Text style={styles.roomName}>
                  {item.room_number}
                </Text>

                <Text
                  style={styles.roomRent}
                >
                  ₱
                  {Number(
                    item.monthly_rent
                  ).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(
                        item.status
                      ),
                  },
                ]}
              >
                <Text
                  style={
                    styles.statusText
                  }
                >
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteProperty}
      >
        <Text style={styles.deleteText}>
          Delete Property
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#000000",
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#111111",
  },

  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    marginLeft: 8,
  },

  pageTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  headerRight: {
    width: 60,
  },

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

  modalTitle: {
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

  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: "#111827",
  },

  modalSaveButton: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 14,
  },

  modalSaveText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },

  type: {
    color: "#0f172a",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 18,
  },

  detailRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 14,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },

  detailValue: {
    color: "#111827",
    lineHeight: 20,
  },

  addRoomButton: {
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 14,
    marginBottom: 20,
  },

  addRoomText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },

  emptyRoom: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  roomCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  roomName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },

  roomRent: {
    color: "#374151",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 40,
  },

  deleteText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
});