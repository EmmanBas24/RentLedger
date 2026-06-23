import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

export default function RentalDetails() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<any>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState({
    paidAmount: 0,
    dueAmount: 0,
    overdueAmount: 0,
    totalRent: 0,
  });

  useEffect(() => {
    fetchRental();
  }, []);

  const fetchRental = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User session not found.");
        router.replace("/(auth)/login");
        return;
      }

      const { data, error } = await supabase
        .from("rentals")
        .select(`
          *,
          tenants(full_name,email,contact_number),
          assets(property_name,address),
          rooms(room_number)
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setRental(data);
      await fetchPaymentSummary(data.id, data.lease_start_date, data.lease_end_date, data.monthly_rent);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRent = (
    startDate: string,
    endDate: string,
    monthlyRent: number
  ) => {
    if (!startDate || !endDate || !monthlyRent) {
      return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) + 1;

    if (months < 0) {
      months = 0;
    }

    return months * monthlyRent;
  };

  const fetchPaymentSummary = async (
    rentalId: string,
    leaseStartDate: string,
    leaseEndDate: string,
    monthlyRent: number
  ) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_status")
        .eq("rental_id", rentalId);

      if (error) {
        console.log(error);
        return;
      }

      const paidAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Paid"
              ? sum + Number(item.amount)
              : sum,
          0
        ) || 0;
      const dueAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Due"
              ? sum + Number(item.amount)
              : sum,
          0
        ) || 0;
      const overdueAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Overdue"
              ? sum + Number(item.amount)
              : sum,
          0
        ) || 0;

      setPaymentSummary({
        paidAmount,
        dueAmount,
        overdueAmount,
        totalRent: calculateTotalRent(
          leaseStartDate,
          leaseEndDate,
          monthlyRent
        ),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleEndRental = async () => {
    Alert.alert(
      "End Rental",
      "Are you sure you want to end this rental?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Rental",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              await supabase
                .from("rentals")
                .update({
                  rental_status: "Completed",
                })
                .eq("id", id)
                .eq("user_id", rental.user_id);

              await supabase
                .from("rooms")
                .update({
                  status: "Available",
                })
                .eq("id", rental.room_id);

              await supabase
                .from("tenants")
                .update({
                  status: "Inactive",
                })
                .eq("id", rental.tenant_id);

              Alert.alert(
                "Success",
                "Rental ended successfully."
              );

              router.back();
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Error",
                "Something went wrong."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

  if (!rental) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#303841" }}>Rental not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header section with theme colors */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Rental Details</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Tenant Information Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account"
              size={22}
              color="#76ABAE"
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>
              Tenant Information
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Name</Text>
            <Text style={styles.itemValue}>{rental.tenants?.full_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Email</Text>
            <Text style={styles.itemValue}>{rental.tenants?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Contact</Text>
            <Text style={styles.itemValue}>{rental.tenants?.contact_number}</Text>
          </View>
        </View>

        {/* Property Information Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="home-city"
              size={22}
              color="#76ABAE"
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>
              Property Information
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Property</Text>
            <Text style={styles.itemValue}>{rental.assets?.property_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Room</Text>
            <Text style={styles.itemValue}>{rental.rooms?.room_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.itemLabel}>Address</Text>
            <Text style={styles.itemValue}>{rental.assets?.address}</Text>
          </View>
        </View>

        {/* Summary Card Row 1 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Due</Text>
            <Text style={styles.summaryValue}>
              ₱{paymentSummary.dueAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>
              ₱{paymentSummary.paidAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Summary Card Row 2 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Rent</Text>
            <Text style={styles.summaryValue}>
              ₱{paymentSummary.totalRent.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={styles.summaryValue}>
              ₱{paymentSummary.overdueAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Collapsible Accordion Header */}
        <TouchableOpacity
          style={[styles.dropdownHeader, detailsExpanded && styles.dropdownHeaderActive]}
          onPress={() => setDetailsExpanded((prev) => !prev)}
        >
          <View>
            <Text style={styles.sectionTitle}>
              Rental Details
            </Text>
            <Text style={styles.dropdownSubtext}>
              {detailsExpanded ? "Tap to hide details" : "Tap to show details"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={detailsExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#303841"
          />
        </TouchableOpacity>

        {/* Collapsible Dropdown Content */}
        {detailsExpanded && (
          <View style={styles.accordionContainer}>
            <View style={[styles.card, styles.accordionCardSpacing]}>
              <Text style={styles.cardTitle}>
                Payment Summary
              </Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Monthly Rent
                </Text>
                <Text style={styles.detailValue}>
                  ₱{Number(rental.monthly_rent).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Advance Payment
                </Text>
                <Text style={styles.detailValue}>
                  ₱{Number(rental.advance_payment).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Lease Schedule
              </Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Start Date
                </Text>
                <Text style={styles.detailValue}>
                  {rental.lease_start_date}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  End Date
                </Text>
                <Text style={styles.detailValue}>
                  {rental.lease_end_date}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Due Day
                </Text>
                <Text style={styles.detailValue}>
                  {rental.due_day}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Status
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {rental.rental_status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Button styled using designated call-to-action tone */}
        {rental.rental_status === "Active" && (
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndRental}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#FFF"
            />
            <Text style={styles.endButtonText}>
              End Rental
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#303841",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#434E5A",
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#303841",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionIcon: {
    marginRight: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  itemLabel: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#303841",
    flex: 2,
    textAlign: "right",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#64748B",
    fontSize: 14,
  },
  detailValue: {
    color: "#303841",
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#E6F4F1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: "#76ABAE",
    fontWeight: "700",
    fontSize: 13,
  },
  endButton: {
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  endButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  dropdownHeader: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownHeaderActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  accordionContainer: {
    backgroundColor: "#EAEAEA",
    padding: 12,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopWidth: 0,
  },
  accordionCardSpacing: {
    marginBottom: 10,
  },
  dropdownSubtext: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303841",
  },
});