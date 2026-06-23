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

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [filter])
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

      const { data, error } =
        await query;

      if (error) {
        console.log(error);
        return;
      }

      const formattedData =
        data?.map((item: any) => ({
          id: item.id,
          billing_month:
            item.billing_month,
          amount: item.amount,
          due_date: item.due_date,
          payment_status:
            item.payment_status,
          tenant_name:
            item.rentals?.tenants
              ?.full_name || "Unknown",
          room_number:
            item.rentals?.rooms
              ?.room_number || "N/A",
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
          color="#10B981"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {[
          "All",
          "Due",
          "Paid",
          "Overdue",
        ].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterChip,
              filter === item &&
                styles.activeChip,
            ]}
            onPress={() =>
              setFilter(item)
            }
          >
            <Text
              style={[
                styles.filterText,
                filter === item &&
                  styles.activeText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cash-remove"
            size={80}
            color="#cbd5e1"
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push(
                  `/payments/${item.id}`
                )
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.tenant_name}
                </Text>

                <Text style={styles.room}>
                  Room {item.room_number}
                </Text>

                <Text
                  style={styles.billing}
                >
                  {item.billing_month}
                </Text>

                <Text style={styles.date}>
                  Due:
                  {" "}
                  {item.due_date}
                </Text>

                <Text
                  style={styles.amount}
                >
                  ₱
                  {Number(
                    item.amount
                  ).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.payment_status ===
                      "Paid"
                        ? "#10B981"
                        : item.payment_status ===
                          "Due"
                        ? "#F59E0B"
                        : "#EF4444",
                  },
                ]}
              >
                <Text
                  style={styles.badgeText}
                >
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
    backgroundColor: "#f8fafc",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },

  activeChip: {
    backgroundColor: "#10B981",
  },

  filterText: {
    fontWeight: "600",
  },

  activeText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  room: {
    color: "#64748b",
    marginTop: 2,
  },

  billing: {
    marginTop: 6,
    fontWeight: "600",
  },

  date: {
    color: "#64748b",
    marginTop: 4,
  },

  amount: {
    color: "#10B981",
    fontWeight: "700",
    marginTop: 6,
    fontSize: 16,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  badgeText: {
    color: "#fff",
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
  },

  emptySubtitle: {
    color: "#64748b",
    marginTop: 8,
  },
});