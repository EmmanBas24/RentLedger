import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

interface Asset {
  id: string;
  property_name: string;
  property_type: string;
  address: string;
  description: string;
  rooms?: { id: string; status: string }[];
}

const getPropertyTypeStyles = (type: string) => {
  const normalized = type?.toLowerCase().trim() || "";
  if (normalized.includes("apart")) return { bg: "#E0F2FE", text: "#0369A1" };
  if (normalized.includes("condo")) return { bg: "#F3E8FF", text: "#6B21A8" };
  if (normalized.includes("house") || normalized.includes("board")) return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#E2E8F0", text: "#475569" };
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);
  
  const [roomMetrics, setRoomMetrics] = useState<Record<string, { available: number; total: number }>>({});
  const [totalAvailableRooms, setTotalAvailableRooms] = useState(0);
  const [totalOccupiedRooms, setTotalOccupiedRooms] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
    }, [])
  );

  const fetchRoomCounts = async (assetsList: Asset[]) => {
    const ids = assetsList.map((asset) => asset.id);
    if (ids.length === 0) {
      setRoomMetrics({});
      setTotalAvailableRooms(0);
      setTotalOccupiedRooms(0);
      return;
    }
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("asset_id,status")
      .in("asset_id", ids);

    if (roomError) {
      console.log(roomError);
      setRoomMetrics({});
      return;
    }

    let globalAvailable = 0;
    let globalOccupied = 0;
    const metricsMap: Record<string, { available: number; total: number }> = {};
    
    ids.forEach(id => {
      metricsMap[id] = { available: 0, total: 0 };
    });

    (roomData || []).forEach((room: any) => {
      if (!metricsMap[room.asset_id]) {
        metricsMap[room.asset_id] = { available: 0, total: 0 };
      }
      
      metricsMap[room.asset_id].total += 1;
      
      if (room.status === "Available") {
        metricsMap[room.asset_id].available += 1;
        globalAvailable += 1;
      } else if (room.status === "Occupied") {
        globalOccupied += 1;
      }
    });

    setRoomMetrics(metricsMap);
    setTotalAvailableRooms(globalAvailable);
    setTotalOccupiedRooms(globalOccupied);
  };

  const fetchAssets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAssets([]);
        setRoomMetrics({});
        return;
      }
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log(error);
        return;
      }
      const assetsData = data || [];
      setAssets(assetsData);
      await fetchRoomCounts(assetsData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  const handleSaveProperty = async () => {
    if (!propertyName || !propertyType || !address) {
      Alert.alert("Missing Required Fields", "Please fill in all mandatory data fields.");
      return;
    }
    try {
      setSavingProperty(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Session Error", "User authorization context not found.");
        return;
      }
      const { error } = await supabase.from("assets").insert([
        {
          user_id: user.id,
          property_name: propertyName.trim(),
          property_type: propertyType.trim(),
          address: address.trim(),
          description: description.trim(),
        },
      ]);
      if (error) {
        Alert.alert("Error Creating Record", error.message);
        return;
      }
      setPropertyName("");
      setPropertyType("");
      setAddress("");
      setDescription("");
      setShowAddModal(false);
      fetchAssets();
    } catch (err) {
      console.log(err);
      Alert.alert("System Error", "Something went wrong.");
    } finally {
      setSavingProperty(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [asset.property_name, asset.property_type, asset.address, asset.description]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const renderProperty = ({ item }: { item: Asset }) => {
    const assetStats = roomMetrics[item.id] || { available: 0, total: 0 };
    const typeColors = getPropertyTypeStyles(item.property_type);

    let badgeStyle = styles.badgeUnavailable;
    let dotStyle = styles.dotUnavailable;
    let textStyle = styles.textUnavailable;
    let badgeText = "Fully Occupied";

    if (assetStats.total === 0) {
      badgeStyle = styles.badgeEmpty;
      dotStyle = styles.dotEmpty;
      textStyle = styles.textEmpty;
      badgeText = "No Rooms Setup";
    } else if (assetStats.available > 0) {
      badgeStyle = styles.badgeAvailable;
      dotStyle = styles.dotAvailable;
      textStyle = styles.textAvailable;
      badgeText = `${assetStats.available} Available Room${assetStats.available > 1 ? "s" : ""}`;
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/assets/[id]", params: { id: item.id } })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.propertyName} numberOfLines={1}>
              {item.property_name}
            </Text>
            <Text style={[styles.propertyType, { backgroundColor: typeColors.bg, color: typeColors.text }]}>
              {item.property_type}
            </Text>
          </View>
          
          <Text style={styles.address} numberOfLines={1}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#76ABAE" /> {item.address}
          </Text>

          <View style={styles.cardBottomRow}>
            <View style={[styles.badge, badgeStyle]}>
              <View style={[styles.dot, dotStyle]} />
              <Text style={[styles.badgeText, textStyle]}>
                {badgeText}
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#76ABAE" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  const totalRoomsCalculated = totalAvailableRooms + totalOccupiedRooms;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Property Overview</Text>
          
          <View style={styles.heroMainGrid}>
            <View style={styles.heroPrimaryMetric}>
              <Text style={styles.heroMetricNumber}>{assets.length}</Text>
              <Text style={styles.heroMetricLabel}>Total Properties</Text>
            </View>
            
            <View style={styles.heroDivider} />

            <View style={styles.heroSecondaryMetrics}>
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#4ECE7B" }]} />
                <Text style={styles.subMetricLabel}>Available Rooms:</Text>
                <Text style={[styles.subMetricValue, { color: "#4ECE7B" }]}>{totalAvailableRooms}</Text>
              </View>
              
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#F43F5E" }]} />
                <Text style={styles.subMetricLabel}>Occupied Units:</Text>
                <Text style={[styles.subMetricValue, { color: "#F43F5E" }]}>{totalOccupiedRooms}</Text>
              </View>

              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#67E8F9" }]} />
                <Text style={styles.subMetricLabel}>Total Capacity:</Text>
                <Text style={[styles.subMetricValue, { color: "#67E8F9" }]}>{totalRoomsCalculated}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <MaterialCommunityIcons name="magnify" size={20} color={isSearchFocused ? "#76ABAE" : "#64748B"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Filter down properties..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {assets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="home-city-outline" size={44} color="#76ABAE" />
            </View>
            <Text style={styles.emptyTitle}>No Properties Listed</Text>
            <Text style={styles.emptySubtitle}>
              Your real estate assets ledger is empty. Tap below to introduce a property.
            </Text>
          </View>
        ) : filteredAssets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="text-box-search-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Matches Found</Text>
            <Text style={styles.emptySubtitle}>We couldn't track assets matching "{searchQuery}"</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAssets}
            keyExtractor={(item) => item.id}
            renderItem={renderProperty}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#76ABAE" />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.9}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Property</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent
          visible={showAddModal}
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.overlay}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Property</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddModal(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Property Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sunrise Heights Apartments"
                placeholderTextColor="#94A3B8"
                value={propertyName}
                onChangeText={setPropertyName}
              />

              <Text style={styles.label}>Property Type *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Apartment, Condo, Boarding House"
                placeholderTextColor="#94A3B8"
                value={propertyType}
                onChangeText={setPropertyType}
              />

              <Text style={styles.label}>Full Location Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Street, Barangay, City/Province"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.label}>Internal Private Notes <Text style={{fontWeight: "400", color:"#94A3B8"}}>(Optional)</Text></Text>
              <TextInput
                style={[styles.modalInput, styles.modalDescription]}
                multiline
                textAlignVertical="top"
                placeholder="Add gate codes, amenities or landmarks..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={styles.modalSaveButton}
                activeOpacity={0.8}
                onPress={handleSaveProperty}
                disabled={savingProperty}
              >
                {savingProperty ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Property Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  heroCard: {
    backgroundColor: "#1E252B", 
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    color: "#76ABAE", 
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  heroMainGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroPrimaryMetric: {
    flex: 1.1,
    justifyContent: "center",
  },
  heroMetricNumber: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  heroMetricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 64,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginHorizontal: 14,
  },
  heroSecondaryMetrics: {
    flex: 1.4,
    gap: 8,
  },
  subMetricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  subMetricLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  subMetricValue: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  searchContainerFocused: {
    borderColor: "#76ABAE", 
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 95,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  propertyType: {
    fontWeight: "700",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  address: {
    color: "#475569",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F8FAFC",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeAvailable: {
    backgroundColor: "#ECFDF5",
  },
  badgeUnavailable: {
    backgroundColor: "#FFF1F2",
  },
  badgeEmpty: {
    backgroundColor: "#F1F5F9",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotAvailable: { backgroundColor: "#10B981" },
  dotUnavailable: { backgroundColor: "#F43F5E" },
  dotEmpty: { backgroundColor: "#64748B" },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textAvailable: {
    color: "#065F46",
  },
  textUnavailable: {
    color: "#991B1B",
  },
  textEmpty: {
    color: "#475569",
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#1E252B",
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptySubtitle: {
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "500",
  },
  modalDescription: {
    minHeight: 90,
  },
  modalSaveButton: {
    backgroundColor: "#76ABAE",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});