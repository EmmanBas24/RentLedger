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

  useEffect(() => {
    fetchRental();
  }, []);

  const fetchRental = async () => {
    try {
      const { data, error } = await supabase
        .from("rentals")
        .select(`
          *,
          tenants(full_name,email,contact_number),
          assets(property_name,address),
          rooms(room_number)
        `)
        .eq("id", id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setRental(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
                .eq("id", id);

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
          color="#10B981"
        />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.center}>
        <Text>Rental not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Rental Details</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Tenant Information
        </Text>

        <Text style={styles.item}>
          Name: {rental.tenants?.full_name}
        </Text>

        <Text style={styles.item}>
          Email: {rental.tenants?.email}
        </Text>

        <Text style={styles.item}>
          Contact:
          {" "}
          {rental.tenants?.contact_number}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Property Information
        </Text>

        <Text style={styles.item}>
          Property:
          {" "}
          {rental.assets?.property_name}
        </Text>

        <Text style={styles.item}>
          Room:
          {" "}
          {rental.rooms?.room_number}
        </Text>

        <Text style={styles.item}>
          Address:
          {" "}
          {rental.assets?.address}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Rental Details
        </Text>

        <Text style={styles.item}>
          Monthly Rent:
          {" "}
          ₱
          {Number(
            rental.monthly_rent
          ).toLocaleString()}
        </Text>

        <Text style={styles.item}>
          Security Deposit:
          {" "}
          ₱
          {Number(
            rental.security_deposit
          ).toLocaleString()}
        </Text>

        <Text style={styles.item}>
          Advance Payment:
          {" "}
          ₱
          {Number(
            rental.advance_payment
          ).toLocaleString()}
        </Text>

        <Text style={styles.item}>
          Lease Start:
          {" "}
          {rental.lease_start_date}
        </Text>

        <Text style={styles.item}>
          Lease End:
          {" "}
          {rental.lease_end_date}
        </Text>

        <Text style={styles.item}>
          Due Day:
          {" "}
          {rental.due_day}
        </Text>

        <Text style={styles.item}>
          Status:
          {" "}
          {rental.rental_status}
        </Text>
      </View>

      {rental.rental_status === "Active" && (
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndRental}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color="#fff"
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
    backgroundColor: "#F2F4F7",
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
    backgroundColor: "#F2F4F7",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#273338",
  },

  item: {
    fontSize: 15,
    marginBottom: 8,
    color: "#618764",
  },

  endButton: {
    backgroundColor: "#2B5748",
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  endButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
});