import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);

  // Automatically refresh records whenever returning focus back to this screen
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadScreenData();
      }
    }, [id])
  );

  const loadScreenData = async () => {
    setLoading(true);
    await Promise.all([fetchProperty(), fetchRooms()]);
    setLoading(false);
  };

  const fetchProperty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User session not found.");
        router.back();
        return;
      }

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setProperty(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("asset_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setRooms(data || []);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditProperty = () => {
    if (!id) return;
    router.push({
      pathname: "/assets/edit",
      params: { id },
    });
  };

  // Navigates directly to your edit.tsx room control panel logic
  const handleEditRoom = (roomId: string) => {
    router.push({
      pathname: "/rooms/edit",
      params: { id: roomId },
    });
  };

  const handleDeleteProperty = async () => {
    try {
      const { data: linkedRooms, error: roomCheckError } = await supabase
        .from("rooms")
        .select("id, status")
        .eq("asset_id", id);

      if (roomCheckError) {
        Alert.alert("Error", "Could not verify property status ledger.");
        return;
      }

      // Hard block if any child rooms inside this asset profile match occupied states
      const hasOccupiedRooms = linkedRooms?.some((room) => room.status === "Occupied");
      if (hasOccupiedRooms) {
        Alert.alert(
          "Action Prohibited",
          "You cannot delete an asset that has occupied rooms."
        );
        return;
      }

      Alert.alert(
        "Delete Property",
        "Are you absolutely sure you want to delete this asset profile?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Asset",
            style: "destructive",
            onPress: async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from("assets")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

              if (error) {
                Alert.alert("Action Failed", error.message);
                return;
              }

              Alert.alert("Deleted", "Property profile successfully removed.");
              router.back();
            },
          },
        ]
      );
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "An unexpected tracking failure occurred.");
    }
  };

  const handleSaveRoom = async () => {
    if (!roomNumber || !monthlyRent) {
      Alert.alert("Missing Fields", "Please populate all mandatory fields.");
      return;
    }

    try {
      setSavingRoom(true);

      const { error } = await supabase.from("rooms").insert([
        {
          asset_id: id,
          room_number: roomNumber.trim(),
          monthly_rent: Number(monthlyRent),
          status: "Available",
        },
      ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setRoomNumber("");
      setMonthlyRent("");
      setShowAddRoomModal(false);
      await fetchRooms();
    } catch (error) {
      console.log(error);
    } finally {
      setSavingRoom(false);
    }
  };

  const getStatusTheme = (status: string) => {
    switch (status) {
      case "Occupied":
        return { bg: "rgba(255, 87, 34, 0.12)", text: "#FF5722" };
      case "Maintenance":
        return { bg: "rgba(255, 184, 0, 0.15)", text: "#D49A00" };
      default:
        return { bg: "rgba(118, 171, 174, 0.15)", text: "#76ABAE" };
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
    <View style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerNavButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Asset Details</Text>
        <TouchableOpacity style={styles.headerNavButton} onPress={handleEditProperty}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#76ABAE" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="office-building" size={24} color="#76ABAE" />
            </View>
            <View style={styles.profileTitleBlock}>
              <Text style={styles.propertyTitle}>{property?.property_name}</Text>
              <Text style={styles.propertyTypeTag}>{property?.property_type}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoMetaSection}>
            <View style={styles.metaItemRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" style={styles.metaIcon} />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Location Address</Text>
                <Text style={styles.metaValue}>{property?.address}</Text>
              </View>
            </View>

            <View style={styles.metaItemRow}>
              <MaterialCommunityIcons name="text-box-outline" size={16} color="#64748B" style={styles.metaIcon} />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Asset Parameters Description</Text>
                <Text style={styles.metaValue}>{property?.description || "No general contextual rules provided."}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>Rooms Inventory</Text>
          <TouchableOpacity style={styles.inlineAddBtn} activeOpacity={0.8} onPress={() => setShowAddRoomModal(true)}>
            <MaterialCommunityIcons name="plus" size={16} color="#F5F5F5" />
            <Text style={styles.inlineAddBtnText}>Add Unit</Text>
          </TouchableOpacity>
        </View>

        {rooms.length === 0 ? (
          <View style={styles.emptyContainerBlock}>
            <MaterialCommunityIcons name="door-closed" size={48} color="#A0AEC0" />
            <Text style={styles.emptyContainerText}>No rooms mapped into this profile asset ledger.</Text>
          </View>
        ) : (
          rooms.map((item) => {
            const currentTheme = getStatusTheme(item.status);
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.roomItemCard}
                activeOpacity={0.7}
                onPress={() => handleEditRoom(item.id)}
              >
                <View style={styles.roomDetailsWrapper}>
                  <View style={styles.roomIconBadge}>
                    <MaterialCommunityIcons name="bed-empty" size={18} color="#303841" />
                  </View>
                  <View>
                    <Text style={styles.roomItemTitle}>{item.room_number}</Text>
                    <Text style={styles.roomItemPrice}>₱{Number(item.monthly_rent).toLocaleString()} /mo</Text>
                  </View>
                </View>
                <View style={styles.roomActionRight}>
                  <View style={[styles.statusBadge, { backgroundColor: currentTheme.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: currentTheme.text }]}>{item.status}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#A0AEC0" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity style={styles.destructiveOutlineBtn} activeOpacity={0.8} onPress={handleDeleteProperty}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF5722" style={{ marginRight: 6 }} />
          <Text style={styles.destructiveOutlineText}>Delete Property Asset</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal animationType="fade" transparent visible={showAddRoomModal} onRequestClose={() => setShowAddRoomModal(false)}>
        <View style={styles.modalBackdropOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalTopHeader}>
              <Text style={styles.modalTitleHeadline}>Add New Room Unit</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddRoomModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#303841" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormBody}>
              <View style={styles.inputStack}>
                <Text style={styles.fieldLabel}>Room Name / Code <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInputBox}
                  placeholder="e.g. Unit 201-A"
                  placeholderTextColor="#A0AEC0"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>

              <View style={styles.inputStack}>
                <Text style={styles.fieldLabel}>Monthly Valuation Base Rate (PHP) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInputBox}
                  placeholder="e.g. 8500"
                  placeholderTextColor="#A0AEC0"
                  value={monthlyRent}
                  onChangeText={setMonthlyRent}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.modalActionSubmitBtn} activeOpacity={0.8} onPress={handleSaveRoom} disabled={savingRoom}>
                {savingRoom ? <ActivityIndicator color="#F5F5F5" size="small" /> : <Text style={styles.modalActionSubmitText}>Register Unit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  headerNavButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  headerTitleText: { fontSize: 17, fontWeight: "700", color: "#303841", letterSpacing: -0.3 },
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 24 },
  profileHeader: { flexDirection: "row", alignItems: "center" },
  iconWrapper: { width: 46, height: 46, borderRadius: 12, backgroundColor: "rgba(118, 171, 174, 0.12)", justifyContent: "center", alignItems: "center" },
  profileTitleBlock: { marginLeft: 14, flex: 1 },
  propertyTitle: { fontSize: 18, fontWeight: "700", color: "#303841", letterSpacing: -0.2 },
  propertyTypeTag: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },
  infoMetaSection: { gap: 14 },
  metaItemRow: { flexDirection: "row", alignItems: "flex-start" },
  metaIcon: { marginTop: 2 },
  metaTextContainer: { marginLeft: 10, flex: 1 },
  metaLabel: { fontSize: 11, fontWeight: "700", color: "#76ABAE", textTransform: "uppercase", letterSpacing: 0.3 },
  metaValue: { fontSize: 14, color: "#303841", fontWeight: "500", marginTop: 3, lineHeight: 20 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 2 },
  sectionTitleText: { fontSize: 16, fontWeight: "700", color: "#303841" },
  inlineAddBtn: { backgroundColor: "#76ABAE", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, flexDirection: "row", alignItems: "center" },
  inlineAddBtnText: { color: "#F5F5F5", fontSize: 12, fontWeight: "700", marginLeft: 3 },
  emptyContainerBlock: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 20 },
  emptyContainerText: { fontSize: 13, color: "#64748B", fontWeight: "500", marginTop: 8, textAlign: "center" },
  roomItemCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  roomDetailsWrapper: { flexDirection: "row", alignItems: "center", flex: 1 },
  roomIconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center", marginRight: 12 },
  roomItemTitle: { fontSize: 15, fontWeight: "700", color: "#303841" },
  roomItemPrice: { fontSize: 13, fontWeight: "600", color: "#64748B", marginTop: 2 },
  roomActionRight: { flexDirection: "row", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  destructiveOutlineBtn: { borderWidth: 1, borderColor: "#FF5722", borderRadius: 12, paddingVertical: 14, justifyContent: "center", alignItems: "center", flexDirection: "row", marginTop: 28 },
  destructiveOutlineText: { color: "#FF5722", fontSize: 14, fontWeight: "700" },
  modalBackdropOverlay: { flex: 1, backgroundColor: "rgba(48, 56, 65, 0.4)", justifyContent: "flex-end" },
  modalContentCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34 },
  modalTopHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitleHeadline: { fontSize: 18, fontWeight: "700", color: "#303841" },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  modalFormBody: { gap: 16 },
  inputStack: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#303841" },
  required: { color: "#FF5722" },
  formInputBox: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#303841", fontWeight: "500" },
  modalActionSubmitBtn: { backgroundColor: "#FF5722", borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center", marginTop: 8 },
  modalActionSubmitText: { color: "#F5F5F5", fontSize: 15, fontWeight: "700" },
});