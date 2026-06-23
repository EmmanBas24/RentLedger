import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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

interface Payment {
  id: string;
  billing_month: string;
  amount: number;
  due_date: string;
  payment_status: string;
  tenant_name: string;
  room_number: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [filter, dateFilter])
  );

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from("payments")
        .select(`
          *,
          rentals(
            tenants(full_name),
            rooms(room_number)
          )
        `)
        .order("due_date", {
          ascending: true,
        });

      if (filter !== "All") {
        query = query.eq(
          "payment_status",
          filter
        );
      }

      if (dateFilter !== "All") {
        const today = new Date();
        const startDate = new Date(today);

        if (dateFilter === "7 Days") {
          startDate.setDate(today.getDate() - 6);
        } else if (dateFilter === "30 Days") {
          startDate.setDate(today.getDate() - 29);
        }

        query = query.gte("due_date", startDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.log(error);
        return;
      }

      const formattedData =
        data?.map((item: any) => ({
          id: item.id,
          billing_month: item.billing_month,
          amount: item.amount,
          due_date: item.due_date,
          payment_status: item.payment_status,
          tenant_name: item.rentals?.tenants?.full_name || "Unknown",
          room_number: item.rentals?.rooms?.room_number || "N/A",
        })) || [];

      setPayments(formattedData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#76ABAE"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>
            Status
          </Text>
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={filter}
              onValueChange={setFilter}
              style={styles.picker}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="Due" value="Due" />
              <Picker.Item label="Paid" value="Paid" />
              <Picker.Item label="Overdue" value="Overdue" />
            </Picker>
          </View>
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>
            Date range
          </Text>
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={dateFilter}
              onValueChange={setDateFilter}
              style={styles.picker}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="Past 7 Days" value="7 Days" />
              <Picker.Item label="Past 30 Days" value="30 Days" />
            </Picker>
          </View>
        </View>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cash-remove"
            size={80}
            color="#76ABAE"
          />

          <Text style={styles.emptyTitle}>
            No Payments Found
          </Text>

          <Text style={styles.emptySubtitle}>
            Payment records will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
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
              onPress={() =>
                router.push(`/payments/${item.id}`)
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.tenant_name}
                </Text>

                <Text style={styles.room}>
                  Room {item.room_number}
                </Text>

                <Text style={styles.billing}>
                  {item.billing_month}
                </Text>

                <Text style={styles.date}>
                  Due: {item.due_date}
                </Text>

                <Text style={styles.amount}>
                  ₱ {Number(item.amount).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.payment_status === "Paid"
                        ? "#76ABAE"
                        : "#FF5722"
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.payment_status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  dropdownContainer: {
    flex: 1,
  },

  dropdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#303841",
    marginBottom: 8,
  },

  dropdownWrapper: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 12,
  },

  picker: {
    width: "100%",
    color: "#303841",
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#FFFFFF", // Changed from Dark Charcoal to clean White
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

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841", // Dark reading text
  },

  room: {
    color: "#64748B", // Clean label gray
    marginTop: 2,
    fontWeight: "500",
  },

  billing: {
    marginTop: 6,
    fontWeight: "600",
    color: "#76ABAE", // Accent color for category/month info
  },

  date: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 13,
  },

  amount: {
    color: "#303841", // Changed from blue/green to match professional high contrast
    fontWeight: "800",
    marginTop: 6,
    fontSize: 17,
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "center", // Centered alongside right section context
  },

  badgeText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#303841",
    marginTop: 15,
  },

  emptySubtitle: {
    color: "#64748B",
    marginTop: 8,
  },
});