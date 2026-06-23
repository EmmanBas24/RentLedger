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
  
  // UPDATED: Changed technical state constraint type from 'Completed' to 'Ended'
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Ended">("Active");

  useFocusEffect(
    useCallback(() => {
      fetchRentals();
    }, [])
  );

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from("rentals")
        .select(`
          *,
          tenants(full_name),
          assets(property_name),
          rooms(room_number)
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(error);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRentals();
  };

  const filteredRentals = rentals.filter((item) =>
    filterStatus === "All"
      ? true
      : item.rental_status === filterStatus
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dynamic Segmented Filter Control */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter rentals</Text>
        <View style={styles.filterRow}>
          {/* UPDATED: Map array values to match database layout ["Active", "Ended"] */}
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
                {/* UPDATED: Dynamic labeling transforms for localized display updates */}
                {status === "Active" ? "Active Rentals" : "Past Rentals"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Render Content */}
      {filteredRentals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="key-chain-variant"
            size={80}
            color="#76ABAE"
          />
          <Text style={styles.emptyTitle}>No rentals found</Text>
          <Text style={styles.emptySubtitle}>
            Try another filter or add a new rental.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
              onPress={() => router.push(`/rentals/${item.id}`)}
            >
              <View style={styles.cardMainContent}>
                {/* Row 1: Tenant Frame */}
                <Text style={styles.name}>{item.tenant_name}</Text>

                {/* Row 2: Location Subtitle Details */}
                <View style={styles.locationContainer}>
                  <MaterialCommunityIcons name="office-building" size={14} color="#64748B" />
                  <Text style={styles.detailsText}>{item.property_name}</Text>
                  <Text style={styles.detailsDot}>•</Text>
                  <Text style={styles.detailsText}>Room {item.room_number}</Text>
                </View>

                {/* Row 3: Financial Framework Pricing */}
                <Text style={styles.rent}>
                  ₱ {Number(item.monthly_rent).toLocaleString()}
                  <Text style={styles.rentPeriod}> / month</Text>
                </Text>
              </View>

              {/* Status Badge Pin Container */}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.rental_status === "Active" ? "#76ABAE" : "#FF5722",
                  },
                ]}
              >
                <Text style={styles.badgeText}>{item.rental_status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Primary Global Insertion Action Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/rentals/add")}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#F5F5F5" />
        <Text style={styles.addButtonText}>New Rental</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#303841",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#303841",
  },
  filterButtonText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: "#F5F5F5",
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMainContent: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
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
    color: "#BCBCBC",
    marginHorizontal: 6,
  },
  rent: {
    color: "#303841",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 8,
  },
  rentPeriod: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 12,
  },
  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: "#F5F5F5",
    marginLeft: 6,
    fontWeight: "700",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#303841",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});