import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

interface Tenant {
  id: string;
  full_name: string;
  status: string;
}

interface Asset {
  id: string;
  property_name: string;
}

interface Room {
  id: string;
  room_number: string;
  monthly_rent: number;
  status: string;
}

export default function AddRental() {
  const [loading, setLoading] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [tenantId, setTenantId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [monthlyRent, setMonthlyRent] = useState("");
 const [amountPaid, setAmountPaid] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // NEW: Payment Method State

  useEffect(() => {
    fetchTenants();
    fetchAssets();
  }, []);

  useEffect(() => {
    if (assetId) {
      fetchRooms(assetId);
    }
  }, [assetId]);

  const fetchTenants = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTenants([]);
      return;
    }

    const { data } = await supabase
      .from("tenants")
      .select("id, full_name, status")
      .eq("user_id", user.id)
      .order("full_name");

    setTenants(data || []);
  };

  const fetchAssets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAssets([]);
      return;
    }

    const { data } = await supabase
      .from("assets")
      .select("id, property_name")
      .eq("user_id", user.id)
      .order("property_name");

    setAssets(data || []);
  };

  const fetchRooms = async (selectedAssetId: string) => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("asset_id", selectedAssetId)
      .eq("status", "Available");

    setRooms(data || []);
  };

  const handleRoomChange = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);

    const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

    if (selectedRoom) {
      setMonthlyRent(selectedRoom.monthly_rent.toString());
    }
  };

  const isValidDate = (value: string) => {
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(new Date(value).getTime())
    );
  };

  const handleCreateRental = async () => {
    const monthlyRentValue = Number(monthlyRent);
   const amountPaidValue = Number(amountPaid || 0);

    if (!tenantId || !assetId || !roomId) {
      Alert.alert(
        "Validation Error",
        "Please choose a tenant, property, and room."
      );
      return;
    }

    if (!monthlyRent || monthlyRentValue <= 0) {
      Alert.alert(
        "Validation Error",
        "Select a room with a valid monthly rent."
      );
      return;
    }

   if (!amountPaid || amountPaidValue < monthlyRentValue) {
      Alert.alert(
        "Validation Error",
        `Advance payment must be at least equal to the monthly rent (₱${monthlyRentValue.toLocaleString()}).`
      );
      return;
    }

    // NEW: Enforce selecting a payment method
    if (!paymentMethod) {
      Alert.alert(
        "Validation Error",
        "Please select a payment method for the advance payment."
      );
      return;
    }

    if (!moveInDate || !isValidDate(moveInDate)) {
      Alert.alert(
        "Validation Error",
        "Enter a valid move-in date in YYYY-MM-DD format."
      );
      return;
    }

    const startDateObj = new Date(moveInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj < today) {
      Alert.alert(
        "Validation Error",
        "Move-in date cannot be in the past."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User session not found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("rentals")
        .insert([
          {
            user_id: user.id,
            tenant_id: tenantId,
            asset_id: assetId,
            room_id: roomId,
            monthly_rent: monthlyRentValue,
            move_in_date: moveInDate,
            rental_status: "Active",
          },
        ])
        .select()
        .single();

      if (error) {
        Alert.alert("Rental Error", error.message);
        setLoading(false);
        return;
      }

      const rentalId = data.id;
     const paidMonths =
  Math.floor(
    amountPaidValue /
    monthlyRentValue
  );
      
      const dayTarget = parseInt(moveInDate.split("-")[2], 10);
      const baseYear = startDateObj.getFullYear();
      const baseMonth = startDateObj.getMonth();

      const paymentRecords = [];

      // Generate Auto-Paid Months from Advance Payments
    for (let i = 0; i < paidMonths; i++){
        const dueDate = new Date(baseYear, baseMonth + i, dayTarget);
        const billingMonth = dueDate.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
         });

        paymentRecords.push({
          rental_id: rentalId,
          billing_month: billingMonth,
          amount: monthlyRentValue,
          due_date: dueDate.toISOString().split("T")[0],
          payment_date: moveInDate,
          payment_status: "Paid",
          payment_method: paymentMethod, // NEW: Connected to transaction mapping row
        });
      }

      // Generate Next Following Unpaid Active "Due" Month
   const nextDueDate = new Date(
  baseYear,
  baseMonth + paidMonths,
  dayTarget
);
      const nextBillingMonth = nextDueDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      paymentRecords.push({
        rental_id: rentalId,
        billing_month: nextBillingMonth,
        amount: monthlyRentValue,
        due_date: nextDueDate.toISOString().split("T")[0],
        payment_status: "Due",
        payment_method: null, // Left empty because it hasn't been collected yet
      });

      const { error: paymentError } = await supabase
        .from("payments")
        .insert(
          paymentRecords.map((record) => ({
            ...record,
            user_id: user.id,
          }))
        );

      if (paymentError) {
        console.log("Payment Error:", paymentError);
      }

      await supabase
        .from("rooms")
        .update({ status: "Occupied" })
        .eq("id", roomId);

      await supabase
        .from("tenants")
        .update({ status: "Active" })
        .eq("id", tenantId);

      Alert.alert("Success", "Rental created successfully.");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Rental</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container}>
      

        <View style={styles.section}>
          <Text style={styles.label}>Tenant</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tenantId}
              onValueChange={setTenantId}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="Select Tenant" value="" />
              {tenants.map((tenant) => (
                <Picker.Item
                  key={tenant.id}
                  label={`${tenant.full_name} (${tenant.status})`}
                  value={tenant.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Property</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={assetId}
              onValueChange={setAssetId}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="Select Property" value="" />
              {assets.map((asset) => (
                <Picker.Item
                  key={asset.id}
                  label={asset.property_name}
                  value={asset.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Room</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={roomId}
              onValueChange={handleRoomChange}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="Select Room" value="" />
              {rooms.map((room) => (
                <Picker.Item
                  key={room.id}
                  label={`${room.room_number} — ₱${room.monthly_rent.toLocaleString()}`}
                  value={room.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Monthly Rent</Text>
          <TextInput
            value={monthlyRent}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />

     <Text style={styles.label}>
  Amount Paid
</Text>
          <TextInput
           value={amountPaid}
onChangeText={setAmountPaid}
            keyboardType="numeric"
   placeholder="Enter amount received"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {/* NEW: Payment Method Form Field Block */}
          <Text style={styles.label}>Payment Method (For Advance Deposit)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              dropdownIconColor="#76ABAE"
            >
              <Picker.Item label="Select Payment Method" value="" />
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="GCash" value="GCash" />
              <Picker.Item label="Maya" value="Maya" />
              <Picker.Item label="Bank Transfer" value="Bank Transfer" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <Text style={styles.label}>Move-in Date</Text>
          <TextInput
            value={moveInDate}
            onChangeText={setMoveInDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateRental}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Create Rental</Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#303841",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#303841",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#303841",
    marginBottom: 4,
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E5E7EB",
    color: "#64748B",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 12,
    backgroundColor: "#FFF",
    marginBottom: 4,
    overflow: "hidden",
  },
  button: {
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 40,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});