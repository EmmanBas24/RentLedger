import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
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

  const markAsPaid = async () => {
    Alert.alert(
      "Confirm Payment",
      "Mark this payment as paid?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            const today =
              new Date()
                .toISOString()
                .split("T")[0];

            const { error } =
              await supabase
                .from("payments")
                .update({
                  payment_status:
                    "Paid",
                  payment_date:
                    today,
                })
                .eq("id", id);

            if (error) {
              Alert.alert(
                "Error",
                error.message
              );
              return;
            }

            Alert.alert(
              "Success",
              "Payment recorded."
            );

            fetchPayment();
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
          color="#10B981"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/payments")}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Payment Details</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
        <Text style={styles.title}>
          Payment Details
        </Text>

        <Text style={styles.label}>
          Tenant
        </Text>

        <Text style={styles.value}>
          {
            payment.rentals?.tenants
              ?.full_name
          }
        </Text>

        <Text style={styles.label}>
          Room
        </Text>

        <Text style={styles.value}>
          {
            payment.rentals?.rooms
              ?.room_number
          }
        </Text>

        <Text style={styles.label}>
          Billing Month
        </Text>

        <Text style={styles.value}>
          {payment.billing_month}
        </Text>

        <Text style={styles.label}>
          Amount
        </Text>

        <Text style={styles.amount}>
          ₱
          {Number(
            payment.amount
          ).toLocaleString()}
        </Text>

        <Text style={styles.label}>
          Due Date
        </Text>

        <Text style={styles.value}>
          {payment.due_date}
        </Text>

        <Text style={styles.label}>
          Payment Date
        </Text>

        <Text style={styles.value}>
          {payment.payment_date ||
            "Not Yet Paid"}
        </Text>

        <Text style={styles.label}>
          Status
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                payment.payment_status ===
                "Paid"
                  ? "#10B981"
                  : payment.payment_status ===
                    "Due"
                  ? "#F59E0B"
                  : "#EF4444",
            },
          ]}
        >
          <Text
            style={
              styles.statusText
            }
          >
            {
              payment.payment_status
            }
          </Text>
        </View>
      </View>

 {payment.payment_status !==
  "Paid" && (
  <TouchableOpacity
    style={styles.payButton}
    onPress={() =>
      router.push({
        pathname:
          "/payments/record-payment",
        params: {
          paymentId:
            payment.id,
        },
      })
    }
  >
    <MaterialCommunityIcons
      name="cash-plus"
      size={22}
      color="#fff"
    />

    <Text
      style={styles.payButtonText}
    >
      Record Payment
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
    backgroundColor: "#f8fafc",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#273338",
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2B5748",
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F2F4F7",
  },

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

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    color: "#64748b",
    marginTop: 12,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 3,
  },

  amount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 5,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
  },

  payButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  payButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
});