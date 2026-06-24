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

interface Payment {
  id: string;
  billing_month: string;
  amount: number;
  due_date: string;
  payment_status: string;
  tenant_name: string;
  room_number: string;
}

type FilterType = "All" | "Paid" | "Due" | "Overdue";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allUnfilteredPayments, setAllUnfilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const fetchPayments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPayments([]);
        setAllUnfilteredPayments([]);
        return;
      }

      // Query database matching strict foreign relations patterns & filtering out Cancelled rows
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          rentals!inner(
            user_id,
            tenants(full_name),
            rooms(room_number)
          )
        `)
        .eq("rentals.user_id", user.id)
        .neq("payment_status", "Cancelled") // Exclude cancelled invoices from ledger operations
        .order("due_date", { ascending: true });

      // REQUIRED SYSTEM TRACE DEBUG ENGINE LOGS
      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        console.log("Supabase Fetch Error:", error);
        return;
      }

      const today = new Date();

      const processedData: Payment[] = (data || []).map((item: any) => {
        let displayStatus = "Due";
        if (item.payment_status === "Paid") {
          displayStatus = "Paid";
        } else {
          const dueDate = new Date(item.due_date);
          if (dueDate < today) {
            displayStatus = "Overdue";
          }
        }

        return {
          id: item.id,
          billing_month: item.billing_month || "Monthly Rent",
          amount: Number(item.amount) || 0,
          due_date: item.due_date,
          payment_status: displayStatus,
          tenant_name: item.rentals?.tenants?.full_name || "Unknown Tenant",
          room_number: item.rentals?.rooms?.room_number || "N/A",
        };
      });

      setAllUnfilteredPayments(processedData);
      console.log("FORMATTED DATA:", processedData);

      // Cleaned status filter row checks
      const filteredData = processedData.filter((item) => {
        if (activeFilter === "Paid") {
          return item.payment_status === "Paid";
        }
        if (activeFilter === "Due") {
          return item.payment_status === "Due";
        }
        if (activeFilter === "Overdue") {
          return item.payment_status === "Overdue";
        }
        return true;
      });

      console.log("FILTERED DATA:", filteredData);
      setPayments(filteredData);
    } catch (error) {
      console.log("Error handling system parsing metrics loop:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const countPaid = allUnfilteredPayments.filter(p => p.payment_status === "Paid").length;
  const countDue = allUnfilteredPayments.filter(p => p.payment_status === "Due").length;
  const countOverdue = allUnfilteredPayments.filter(p => p.payment_status === "Overdue").length;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Paid":
        return { badge: styles.badgePaid, dot: styles.dotPaid, text: styles.textPaid };
      case "Due":
        return { badge: styles.badgeDue, dot: styles.dotDue, text: styles.textDue };
      case "Overdue":
        return { badge: styles.badgeOverdue, dot: styles.dotOverdue, text: styles.textOverdue };
      default:
        return { badge: styles.badgeDefault, dot: styles.dotDefault, text: styles.textDefault };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  const filterOptions: FilterType[] = ["All", "Paid", "Due", "Overdue"];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Ledger Invoices Overview</Text>
          
          <View style={styles.heroMainGrid}>
            <View style={styles.heroPrimaryMetric}>
              <Text style={styles.heroMetricNumber}>{allUnfilteredPayments.length}</Text>
              <Text style={styles.heroMetricLabel}>Total Invoices</Text>
            </View>
            
            <View style={styles.heroDivider} />

            <View style={styles.heroSecondaryMetrics}>
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#4ECE7B" }]} />
                <Text style={styles.subMetricLabel}>Paid Clearances:</Text>
                <Text style={[styles.subMetricValue, { color: "#4ECE7B" }]}>{countPaid}</Text>
              </View>
              
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#D97706" }]} />
                <Text style={styles.subMetricLabel}>Pending Dues:</Text>
                <Text style={[styles.subMetricValue, { color: "#D97706" }]}>{countDue}</Text>
              </View>

              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#F43F5E" }]} />
                <Text style={styles.subMetricLabel}>Overdue Delays:</Text>
                <Text style={[styles.subMetricValue, { color: "#F43F5E" }]}>{countOverdue}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterButton,
                  isActive && styles.filterButtonActive,
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isActive && styles.filterButtonTextActive,
                    tab === "Overdue" && !isActive && styles.overdueLabelText,
                    tab === "Due" && !isActive && styles.dueLabelText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="cash-multiple" size={44} color="#76ABAE" />
            </View>
            <Text style={styles.emptyTitle}>No Balance Transactions</Text>
            <Text style={styles.emptySubtitle}>
              Monitored ledger invoices show clean tracking sheets for this filter.
            </Text>
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#76ABAE" />
            }
            renderItem={({ item }) => {
              const theme = getStatusStyles(item.payment_status);
              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => router.push({
                    pathname: "/payments/record-payment",
                    params: { paymentId: item.id }
                  })}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.nameContainer}>
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarMiniText}>
                            {item.tenant_name?.charAt(0)?.toUpperCase() || "U"}
                          </Text>
                        </View>
                        <Text style={styles.name} numberOfLines={1}>
                          {item.tenant_name}
                        </Text>
                      </View>

                      <View style={[styles.badge, theme.badge]}>
                        <View style={[styles.dot, theme.dot]} />
                        <Text style={[styles.badgeText, theme.text]}>
                          {item.payment_status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="door-open" size={14} color="#475569" />
                        <Text style={styles.room}>Room {item.room_number}</Text>
                      </View>
                      
                      <View style={styles.billingContainer}>
                        <MaterialCommunityIcons name="calendar-range" size={13} color="#76ABAE" />
                        <Text style={styles.billing}>{item.billing_month}</Text>
                      </View>
                    </View>

                    <View style={styles.cardBottomRow}>
                      <Text style={styles.dateText}>
                        Due: {item.due_date}
                      </Text>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amount}>₱ {item.amount.toLocaleString()}</Text>
                        <View style={styles.arrowCircle}>
                          <MaterialCommunityIcons name="chevron-right" size={16} color="#76ABAE" />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
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
    flex: 1,
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
    flex: 1.3,
    gap: 6,
  },
  subMetricRow: {
    flex: 1,
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
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterButtonTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  overdueLabelText: {
    color: "#F43F5E",
  },
  dueLabelText: {
    color: "#D97706",
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
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
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0F2F1",
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#76ABAE",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  room: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  billingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  billing: {
    fontSize: 11,
    fontWeight: "700",
    color: "#76ABAE",
    textTransform: "uppercase",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F8FAFC",
  },
  dateText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgePaid: { backgroundColor: "#ECFDF5" },
  dotPaid: { backgroundColor: "#10B981" },
  textPaid: { color: "#065F46" },
  badgeDue: { backgroundColor: "#FFFBEB" },
  dotDue: { backgroundColor: "#D97706" },
  textDue: { color: "#92400E" },
  badgeOverdue: { backgroundColor: "#FFF1F2" },
  dotOverdue: { backgroundColor: "#F43F5E" },
  textOverdue: { color: "#991B1B" },
  badgeDefault: { backgroundColor: "#F1F5F9" },
  dotDefault: { backgroundColor: "#64748B" },
  textDefault: { color: "#334155" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
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
});