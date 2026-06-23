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
  const [advancePayment, setAdvancePayment] =
    useState("");

  const [leaseStartDate, setLeaseStartDate] =
    useState("");

  const [leaseEndDate, setLeaseEndDate] =
    useState("");

  const [dueDay, setDueDay] = useState("");

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

  const fetchRooms = async (
    selectedAssetId: string
  ) => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("asset_id", selectedAssetId)
      .eq("status", "Available");

    setRooms(data || []);
  };

  const handleRoomChange = (
    selectedRoomId: string
  ) => {
    setRoomId(selectedRoomId);

    const selectedRoom = rooms.find(
      (room) => room.id === selectedRoomId
    );

    if (selectedRoom) {
      setMonthlyRent(
        selectedRoom.monthly_rent.toString()
      );
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
    const advancePaymentValue = Number(advancePayment || 0);
    const dueDayValue = Number(dueDay);

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

    if (!leaseStartDate || !isValidDate(leaseStartDate)) {
      Alert.alert(
        "Validation Error",
        "Enter a valid lease start date in YYYY-MM-DD format."
      );
      return;
    }

    // Lease start date must not be in the past
    const startDateObj = new Date(leaseStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj < today) {
      Alert.alert(
        "Validation Error",
        "Lease start date cannot be in the past."
      );
      return;
    }

    if (
      leaseEndDate &&
      (!isValidDate(leaseEndDate) || new Date(leaseEndDate) < new Date(leaseStartDate))
    ) {
      Alert.alert(
        "Validation Error",
        "Enter a valid lease end date that is on or after the lease start date."
      );
      return;
    }

    if (
      !dueDay ||
      Number.isNaN(dueDayValue) ||
      dueDayValue < 1 ||
      dueDayValue > 28
    ) {
      Alert.alert(
        "Validation Error",
        "Due day must be a whole number between 1 and 28."
      );
      return;
    }

    if (advancePayment && advancePaymentValue < 0) {
      Alert.alert(
        "Validation Error",
        "Advance payment cannot be negative."
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
      monthly_rent: Number(monthlyRent),
      advance_payment:
        Number(advancePayment) || 0,
      lease_start_date: leaseStartDate,
      lease_end_date: leaseEndDate || null,
      due_day: Number(dueDay),
      rental_status: "Active",
    },
  ])
  .select()
  .single();

  
console.log({
  tenantId,
  assetId,
  roomId,
  monthlyRent,
  advancePayment,
  leaseStartDate,
  leaseEndDate,
  dueDay,
});
console.log("DATA:", data);
console.log("ERROR:", error);

if (error) {
  Alert.alert(
    "Rental Error",
    error.message
  );
  return;
}


const rentalId = data.id;

const advanceMonths = Math.floor(
  Number(advancePayment || 0) /
  Number(monthlyRent)
);

const startDate = new Date(
  leaseStartDate
);

const paymentRecords = [];

// Generate Paid Months
for (
  let i = 0;
  i < advanceMonths;
  i++
) {
  const dueDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + i,
    Number(dueDay)
  );

  const billingMonth =
    dueDate.toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  paymentRecords.push({
    rental_id: rentalId,
    billing_month: billingMonth,
    amount: Number(monthlyRent),
    due_date: dueDate
      .toISOString()
      .split("T")[0],
    payment_date: leaseStartDate,
    payment_status: "Paid",
  });
}

// Generate Next Due Month

const nextDueDate = new Date(
  startDate.getFullYear(),
  startDate.getMonth() +
    advanceMonths,
  Number(dueDay)
);

const nextBillingMonth =
  nextDueDate.toLocaleString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

paymentRecords.push({
  rental_id: rentalId,
  billing_month:
    nextBillingMonth,
  amount: Number(monthlyRent),
  due_date: nextDueDate
    .toISOString()
    .split("T")[0],
  payment_status: "Due",
});

const {
  error: paymentError,
} = await supabase
  .from("payments")
  .insert(
    paymentRecords.map((record) => ({
      ...record,
      user_id: user.id,
    }))
  );

if (paymentError) {
  console.log(
    "Payment Error:",
    paymentError
  );
}




    await supabase
      .from("rooms")
      .update({
        status: "Occupied",
      })
      .eq("id", roomId);

    await supabase
      .from("tenants")
      .update({
        status: "Active",
      })
      .eq("id", tenantId);

    Alert.alert(
      "Success",
      "Rental created successfully."
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
};

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

        <Text style={styles.headerTitle}>Create Rental</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>
          Create Rental
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Tenant</Text>

          <Picker
            selectedValue={tenantId}
            onValueChange={setTenantId}
            style={styles.picker}
          >
        <Picker.Item
          label="Select Tenant"
          value=""
        />

        {tenants.map((tenant) => (
          <Picker.Item
            key={tenant.id}
            label={`${tenant.full_name} (${tenant.status})`}
            value={tenant.id}
          />
        ))}
      </Picker>

      <Text style={styles.label}>Property</Text>

      <Picker
        selectedValue={assetId}
        onValueChange={setAssetId}
        style={styles.picker}
      >
        <Picker.Item
          label="Select Property"
          value=""
        />

        {assets.map((asset) => (
          <Picker.Item
            key={asset.id}
            label={asset.property_name}
            value={asset.id}
          />
        ))}
      </Picker>

      <Text style={styles.label}>Room</Text>

      <Picker
        selectedValue={roomId}
        onValueChange={handleRoomChange}
        style={styles.picker}
      >
        <Picker.Item
          label="Select Room"
          value=""
        />

        {rooms.map((room) => (
          <Picker.Item
            key={room.id}
            label={`${room.room_number} — ₱${room.monthly_rent.toLocaleString()}`}
            value={room.id}
          />
        ))}
      </Picker>

      <Text style={styles.label}>Monthly Rent</Text>
      <TextInput
        value={monthlyRent}
        editable={false}
        style={styles.input}
      />

      <Text style={styles.label}>Advance Payment</Text>
      <TextInput
        value={advancePayment}
        onChangeText={setAdvancePayment}
        keyboardType="numeric"
        placeholder="Optional"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <Text style={styles.label}>Lease Start Date</Text>
      <TextInput
        value={leaseStartDate}
        onChangeText={setLeaseStartDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <Text style={styles.label}>Lease End Date</Text>
      <TextInput
        value={leaseEndDate}
        onChangeText={setLeaseEndDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <Text style={styles.label}>Due Day *</Text>
      <TextInput
        value={dueDay}
        onChangeText={setDueDay}
        keyboardType="number-pad"
        placeholder="Example: 5"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
      <Text style={styles.helperText}>
        Due day should be a number between 1 and 28.
      </Text>
    </View>

    <TouchableOpacity
      style={styles.button}
      onPress={handleCreateRental}
      disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.buttonText}>
      Create Rental
    </Text>
  )}
</TouchableOpacity>
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
    backgroundColor: "#f8fafc",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 10,
  },

  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  helperText: {
    color: "#475569",
    fontSize: 13,
    marginBottom: 10,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 5,
  },

  picker: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});

