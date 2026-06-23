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

export default function PaymentDetails() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        rentals(
          tenants(full_name),
          rooms(room_number)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setPayment(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/payments")}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#F5F5F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice View</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Light Focused Content Card */}
        <View style={styles.card}>
          
          {/* Main Statement Amount Header */}
          <View style={styles.heroSection}>
            <Text style={styles.heroLabel}>Total Amount Due</Text>
            <Text style={styles.heroAmount}>
              ₱ {Number(payment.amount).toLocaleString()}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    payment.payment_status === "Paid" ? "#76ABAE" : "#FF5722",
                },
              ]}
            >
              <Text style={styles.statusText}>{payment.payment_status}</Text>
            </View>
          </View>

          {/* Section 1: Tenant Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tenant Details</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Tenant Name</Text>
              <Text style={styles.value}>{payment.rentals?.tenants?.full_name}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Assigned Room</Text>
              <Text style={styles.value}>Room {payment.rentals?.rooms?.room_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Section 2: Schedule Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Schedule</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Billing Month</Text>
              <Text style={styles.value}>{payment.billing_month}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{payment.due_date}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Date Processed</Text>
              <Text style={styles.value}>{payment.payment_date || "Pending Payment"}</Text>
            </View>
          </View>

        </View>

        {/* Action Callout Button */}
        {payment.payment_status !== "Paid" && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() =>
              router.push({
                pathname: "/payments/record-payment",
                params: { paymentId: payment.id },
              })
            }
          >
            <MaterialCommunityIcons name="cash-plus" size={22} color="#F5F5F5" />
            <Text style={styles.payButtonText}>Record Payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#303841", // Matches top native bar area seamlessly
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#303841",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#76ABAE",
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light layout background
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF", // Clean, pure white card background
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  heroLabel: {
    color: "#64748B", // Slate subtle gray for labels
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#303841", // Primary high contrast reading text
    marginVertical: 6,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#76ABAE", // Teal functional group headers
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#303841",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginVertical: 10,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 13,
  },
  payButton: {
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  payButtonText: {
    color: "#F5F5F5",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
});