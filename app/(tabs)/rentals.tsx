import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

interface Rental {
  id: string;
  monthly_rent: number;
  rental_status: string;
  tenant_name: string;
  property_name: string;
  room_number: string;
}

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Ended">("Active");

  const fetchRentals = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.log("Authentication error or no session found:", userError);
        return;
      }

      const userId = userData.user.id;

      const { data, error } = await supabase
        .from("rentals")
        .select(`
          *,
          tenants(full_name),
          assets(property_name),
          rooms(room_number)
        `)
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log("Fetch Error: ", error);
        return;
      }

      const formattedData =
        data?.map((item: any) => ({
          id: item.id,
          monthly_rent: item.monthly_rent,
          rental_status: item.rental_status,
          tenant_name: item.tenants?.full_name || "Unknown Tenant",
          property_name: item.assets?.property_name || "Unknown Property",
          room_number: item.rooms?.room_number || "N/A",
        })) || [];

      setRentals(formattedData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRentals();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRentals();
  };

  const filteredRentals = rentals.filter((item) =>
    filterStatus === "All"
      ? true
      : item.rental_status === filterStatus
  );

  // High-Level Portfolio Calculations
  const activeRentalsCount = rentals.filter((r) => r.rental_status === "Active").length;
  const activeMonthlyRevenue = rentals
    .filter((r) => r.rental_status === "Active")
    .reduce((sum, current) => sum + Number(current.monthly_rent), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Premium Dashboard Hero Header Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Rental Overview</Text>
          
          <View style={styles.heroMainGrid}>
            <View style={styles.heroPrimaryMetric}>
              <Text style={styles.heroMetricNumber}>{activeRentalsCount}</Text>
              <Text style={styles.heroMetricLabel}>Active occupancies</Text>
            </View>
            
            <View style={styles.heroDivider} />

            <View style={styles.heroSecondaryMetrics}>
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#2E7D32" }]} />
                <Text style={styles.subMetricLabel}>Est. Revenue:</Text>
                <Text style={[styles.subMetricValue, { color: "#2E7D32" }]}>
                  ₱{activeMonthlyRevenue.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#76ABAE" }]} />
                <Text style={styles.subMetricLabel}>Total Entries:</Text>
                <Text style={styles.subMetricValue}>{rentals.length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Segmented Filter Row */}
        <View style={styles.filterRow}>
          {(["Active", "Ended"] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status === "Active" ? "Active Rentals" : "Past History"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main List Area */}
        {filteredRentals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="key-chain-variant"
              size={60}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Active Rents</Text>
            <Text style={styles.emptySubtitle}>
              Adjust your active selection filters or configure a new assignment entry below.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRentals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#76ABAE"
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/rentals/${item.id}`)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.tenant_name}
                    </Text>
                    
                    <View
                      style={[
                        styles.badge,
                        item.rental_status === "Active" ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <View style={[styles.dot, item.rental_status === "Active" ? styles.dotActive : styles.dotInactive]} />
                      <Text
                        style={[
                          styles.badgeText,
                          item.rental_status === "Active" ? styles.textActive : styles.textInactive,
                        ]}
                      >
                        {item.rental_status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="office-building" size={13} color="#64748B" />
                    <Text style={styles.detailsText} numberOfLines={1}>
                      {item.property_name}
                    </Text>
                    <Text style={styles.detailsDot}>•</Text>
                    <Text style={styles.detailsText}>Room {item.room_number}</Text>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.rent}>
                      ₱ {Number(item.monthly_rent).toLocaleString()}
                      <Text style={styles.rentPeriod}> / month</Text>
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#76ABAE" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Flat Bottom Action Strip */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.9}
          onPress={() => router.push("/rentals/add")}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Rental</Text>
        </TouchableOpacity>
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
    paddingTop: 8, // Synced to match the 8px top padding of tenant layout inside the safe area
  },
  center: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  /* --- Premium Hero Card Block --- */
  heroCard: {
    backgroundColor: "#303841",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  heroMainGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroPrimaryMetric: {
    flex: 1,
    justifyContent: "center",
  },
  heroMetricNumber: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroMetricLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(226, 232, 240, 0.15)",
    marginHorizontal: 16,
  },
  heroSecondaryMetrics: {
    flex: 1.5,
    gap: 8,
  },
  subMetricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subMetricLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  subMetricValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  /* --- Modern Filter Buttons Row --- */
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterButtonTextActive: {
    color: "#1E293B",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 90,
  },
  /* --- Minimal Elegant Cards --- */
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  detailsText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "500",
  },
  detailsDot: {
    fontSize: 13,
    color: "#CBD5E1",
    marginHorizontal: 6,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  rent: {
    color: "#1E293B",
    fontWeight: "800",
    fontSize: 16,
  },
  rentPeriod: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  /* --- Minimal Status Badges --- */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: "#E8F5E9",
  },
  badgeInactive: {
    backgroundColor: "#F1F5F9",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotActive: { backgroundColor: "#2E7D32" },
  dotInactive: { backgroundColor: "#64748B" },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textActive: {
    color: "#2E7D32",
  },
  textInactive: {
    color: "#475569",
  },
  /* --- Button Layout Strip --- */
  addButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#303841",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    color: "#475569",
  },
  emptySubtitle: {
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});