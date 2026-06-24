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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [tenantId, setTenantId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [monthlyRent, setMonthlyRent] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [moveInDate, setMoveInDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    fetchTenants();
    fetchAssets();
  }, []);

  useEffect(() => {
    if (assetId) {
      setRoomId("");
      setMonthlyRent("");
      fetchRooms(assetId);
    } else {
      setRooms([]);
      setRoomId("");
      setMonthlyRent("");
    }
  }, [assetId]);

  const fetchTenants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tenants")
        .select("id, full_name, status")
        .eq("user_id", user.id)
        .order("full_name");
      setTenants(data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("assets")
        .select("id, property_name")
        .eq("user_id", user.id)
        .order("property_name");
      setAssets(data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
    }
  };

  const fetchRooms = async (selectedAssetId: string) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("asset_id", selectedAssetId)
        .eq("status", "Available");

      if (error) {
        setRooms([]);
        return;
      }
      setRooms(data || []);
    } catch (err) {
      setRooms([]);
    }
  };

  const handleRoomChange = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);
    if (!selectedRoomId || !rooms || !Array.isArray(rooms)) {
      setMonthlyRent("");
      return;
    }
    const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
    setMonthlyRent(selectedRoom ? String(selectedRoom.monthly_rent ?? "") : "");
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

    if (!tenantId || !assetId || !roomId || !paymentMethod || !moveInDate) {
      Alert.alert("Missing Fields", "Please complete all mandatory parameters.");
      return;
    }

    if (!monthlyRent || monthlyRentValue <= 0) {
      Alert.alert("Validation Error", "Select a room holding a valid pricing matrix.");
      return;
    }

    if (amountPaidValue < monthlyRentValue) {
      Alert.alert("Validation Error", `Advance payment must meet base floor rent (₱${monthlyRentValue.toLocaleString()}).`);
      return;
    }

    if (!isValidDate(moveInDate)) {
      Alert.alert("Validation Error", "Enter date framework formatted cleanly in YYYY-MM-DD.");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session");

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

      if (error || !data) throw error;

      const rentalId = data.id;
      const paidMonths = Math.floor(amountPaidValue / monthlyRentValue);
      const startDateObj = new Date(moveInDate);
      const dateParts = moveInDate.split("-");
      const dayTarget = parseInt(dateParts[2], 10);
      const baseYear = startDateObj.getFullYear();
      const baseMonth = startDateObj.getMonth();

      const paymentRecords = [];

      for (let i = 0; i < paidMonths; i++) {
        const dueDate = new Date(baseYear, baseMonth + i, dayTarget);
        const billingMonth = dueDate.toLocaleString("en-US", { month: "long", year: "numeric" });
        paymentRecords.push({
          user_id: user.id,
          rental_id: rentalId,
          billing_month: billingMonth,
          amount: monthlyRentValue,
          amount_paid: i === 0 ? amountPaidValue : null,
          due_date: dueDate.toISOString().split("T")[0],
          payment_date: moveInDate,
          payment_status: "Paid",
          payment_method: i === 0 ? paymentMethod : null,
        });
      }

      const nextDueDate = new Date(baseYear, baseMonth + paidMonths, dayTarget);
      const nextBillingMonth = nextDueDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      paymentRecords.push({
        user_id: user.id,
        rental_id: rentalId,
        billing_month: nextBillingMonth,
        amount: monthlyRentValue,
        amount_paid: null,
        due_date: nextDueDate.toISOString().split("T")[0],
        payment_status: "Due",
        payment_method: null,
      });

      await supabase.from("payments").insert(paymentRecords);
      await Promise.all([
        supabase.from("rooms").update({ status: "Occupied" }).eq("id", roomId),
        supabase.from("tenants").update({ status: "Active" }).eq("id", tenantId)
      ]);

      Alert.alert("Success", "Rental file deployed safely.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", "Could not complete core execution loop safely.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Normalized Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Rental</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Single Consolidated Unified Card Container */}
        <View style={styles.formCard}>
          
          <Text style={styles.label}>SELECT TENANT</Text>
          <View style={[styles.pickerContainer, focusedField === "tenant" && styles.inputFocused]}>
            <Picker
              selectedValue={tenantId}
              onValueChange={setTenantId}
              dropdownIconColor="#303841"
              enabled={!loading}
              onFocus={() => setFocusedField("tenant")}
              onBlur={() => setFocusedField(null)}
              style={styles.picker}
            >
              <Picker.Item label="Choose Tenant" value="" style={styles.placeholderText} />
              {tenants.map((t) => (
                <Picker.Item key={t.id} label={`${t.full_name} (${t.status})`} value={t.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>ASSIGN PROPERTY</Text>
          <View style={[styles.pickerContainer, focusedField === "asset" && styles.inputFocused]}>
            <Picker
              selectedValue={assetId}
              onValueChange={setAssetId}
              dropdownIconColor="#303841"
              enabled={!loading}
              onFocus={() => setFocusedField("asset")}
              onBlur={() => setFocusedField(null)}
              style={styles.picker}
            >
              <Picker.Item label="Choose Property" value="" style={styles.placeholderText} />
              {assets.map((a) => (
                <Picker.Item key={a.id} label={a.property_name} value={a.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>ASSIGN ROOM</Text>
          <View style={[styles.pickerContainer, focusedField === "room" && styles.inputFocused, !assetId && styles.disabledField]}>
            <Picker
              selectedValue={roomId}
              onValueChange={handleRoomChange}
              dropdownIconColor="#303841"
              enabled={!loading && !!assetId}
              onFocus={() => setFocusedField("room")}
              onBlur={() => setFocusedField(null)}
              style={styles.picker}
            >
              <Picker.Item label="Choose Room" value="" style={styles.placeholderText} />
              {rooms.map((r) => (
                <Picker.Item key={r.id} label={r.room_number} value={r.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>MONTHLY BASE RENT (₱)</Text>
          <View style={[styles.inputWrapper, styles.disabledField]}>
            <MaterialCommunityIcons name="currency-php" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              value={monthlyRent ? Number(monthlyRent).toLocaleString() : ""}
              editable={false}
              style={[styles.input, { color: "#94A3B8" }]}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Text style={styles.label}>ADVANCE PAYMENT AMOUNT (₱)</Text>
          <View style={[styles.inputWrapper, focusedField === "amountPaid" && styles.inputFocused]}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color="#303841" style={styles.inputIcon} />
            <TextInput
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              editable={!loading}
              onFocus={() => setFocusedField("amountPaid")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.label}>PAYMENT METHOD</Text>
          <View style={[styles.pickerContainer, focusedField === "method" && styles.inputFocused]}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              dropdownIconColor="#303841"
              enabled={!loading}
              onFocus={() => setFocusedField("method")}
              onBlur={() => setFocusedField(null)}
              style={styles.picker}
            >
              <Picker.Item label="Select Method" value="" style={styles.placeholderText} />
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="GCash" value="GCash" />
              <Picker.Item label="Maya" value="Maya" />
              <Picker.Item label="Bank Transfer" value="Bank Transfer" />
            </Picker>
          </View>

          <Text style={styles.label}>START / MOVE-IN DATE</Text>
          <View style={[styles.inputWrapper, focusedField === "moveIn" && styles.inputFocused]}>
            <MaterialCommunityIcons name="calendar" size={18} color="#303841" style={styles.inputIcon} />
            <TextInput
              value={moveInDate}
              onChangeText={setMoveInDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              editable={!loading}
              onFocus={() => setFocusedField("moveIn")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.8 }]}
          onPress={handleCreateRental}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save Rental</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#303841",
    fontSize: 14,
    fontWeight: "600",
  },
  inputFocused: {
    borderColor: "#303841",
  },
  disabledField: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    height: 48,
    justifyContent: "center",
  },
  picker: {
    color: "#303841",
  },
  placeholderText: {
    color: "#94A3B8",
  },
  button: {
    backgroundColor: "#303841",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});