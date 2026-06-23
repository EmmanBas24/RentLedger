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
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Completed">("Active");

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
          tenant_name:
            item.tenants?.full_name || "",
          property_name:
            item.assets?.property_name || "",
          room_number:
            item.rooms?.room_number || "",
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
        <ActivityIndicator
          size="large"
          color="#618764"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Past rentals</Text>

        <View style={styles.filterRow}>
          {(["Active", "Completed"] as const).map((status, index) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                index === 0 && styles.filterButtonLeft,
                index === 1 && styles.filterButtonRight,
                filterStatus === status &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status &&
                    styles.filterButtonTextActive,
                ]}
              >
                {status === "Active"
                  ? "Active Rentals"
                  : "Past Rentals"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredRentals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="key-chain-variant"
            size={80}
            color="#618764"
          />

          <Text style={styles.emptyTitle}>
            No rentals found
          </Text>

          <Text style={styles.emptySubtitle}>
            Try another filter or add a new rental.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push(`/rentals/${item.id}`)
              }
            >
              <View>
                <Text style={styles.name}>
                  {item.tenant_name}
                </Text>

                <Text style={styles.details}>
                  {item.property_name}
                </Text>

                <Text style={styles.details}>
                  {item.room_number}
                </Text>

                <Text style={styles.rent}>
                  ₱
                  {Number(item.monthly_rent).toLocaleString()}
                  /month
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.rental_status === "Active"
                        ? "#9CB080"
                        : "#EF4444",
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.rental_status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push("/rentals/add")
        }
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color="#fff"
        />

        <Text style={styles.addButtonText}>
          New Rental
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    padding: 16,
    paddingBottom: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
  },

  filterContainer: {
    marginBottom: 18,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#273338",
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F2F4F7",
    borderWidth: 1,
    borderColor: "#D1D9D2",
    alignItems: "center",
  },

  filterButtonLeft: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  filterButtonRight: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },

  filterButtonActive: {
    backgroundColor: "#2B5748",
    borderColor: "#2B5748",
  },

  filterButtonText: {
    color: "#273338",
    fontWeight: "700",
  },

  filterButtonTextActive: {
    color: "#F2F4F7",
  },

  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#2B5748",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    color: "#273338",
  },

  emptySubtitle: {
    color: "#618764",
    marginTop: 8,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#273338",
  },

  details: {
    color: "#618764",
    marginTop: 2,
  },

  rent: {
    color: "#2B5748",
    fontWeight: "700",
    marginTop: 6,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#618764",
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
  },
});