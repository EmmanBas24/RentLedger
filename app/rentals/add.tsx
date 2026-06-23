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

  const [securityDeposit, setSecurityDeposit] =
    useState("");

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
    const { data } = await supabase
      .from("tenants")
      .select("id, full_name")
      .order("full_name");

    setTenants(data || []);
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("assets")
      .select("id, property_name")
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

  const handleCreateRental = async () => {
    Alert.alert("Handler Triggered");
  console.log("Handler Triggered");
if (
  !tenantId ||
  !assetId ||
  !roomId ||
  !monthlyRent ||
  !leaseStartDate ||
  !dueDay
) {
  Alert.alert(
    "Debug",
    JSON.stringify(
      {
        tenantId,
        assetId,
        roomId,
        monthlyRent,
        leaseStartDate,
        dueDay,
      },
      null,
      2
    )
  );

  return;
}

  try {
    setLoading(true);

   const { data, error } = await supabase
  .from("rentals")
  .insert([
    {
      tenant_id: tenantId,
      asset_id: assetId,
      room_id: roomId,
      monthly_rent: Number(monthlyRent),
      security_deposit:
        Number(securityDeposit) || 0,
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
  securityDeposit,
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
  .insert(paymentRecords);

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

      <Text style={styles.label}>Tenant</Text>

      <Picker
        selectedValue={tenantId}
        onValueChange={setTenantId}
        style={styles.input}
      >
        <Picker.Item
          label="Select Tenant"
          value=""
        />

        {tenants.map((tenant) => (
          <Picker.Item
            key={tenant.id}
            label={tenant.full_name}
            value={tenant.id}
          />
        ))}
      </Picker>

      <Text style={styles.label}>Property</Text>

      <Picker
        selectedValue={assetId}
        onValueChange={setAssetId}
        style={styles.input}
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
        style={styles.input}
      >
        <Picker.Item
          label="Select Room"
          value=""
        />

        {rooms.map((room) => (
          <Picker.Item
            key={room.id}
            label={room.room_number}
            value={room.id}
          />
        ))}
      </Picker>

      <Text style={styles.label}>
        Monthly Rent
      </Text>

      <TextInput
        value={monthlyRent}
        editable={false}
        style={styles.input}
      />

      <Text style={styles.label}>
        Security Deposit
      </Text>

      <TextInput
        value={securityDeposit}
        onChangeText={setSecurityDeposit}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>
        Advance Payment
      </Text>

      <TextInput
        value={advancePayment}
        onChangeText={setAdvancePayment}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>
        Lease Start Date
      </Text>

      <TextInput
        value={leaseStartDate}
        onChangeText={setLeaseStartDate}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

      <Text style={styles.label}>
        Lease End Date
      </Text>

      <TextInput
        value={leaseEndDate}
        onChangeText={setLeaseEndDate}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

    <Text style={styles.label}>
  Due Day *
</Text>

<TextInput
  value={dueDay}
  onChangeText={(text) => {
    setDueDay(text);
    console.log("Due Day:", text);
  }}
  keyboardType="number-pad"
  placeholder="Example: 5"
  style={styles.textInput}
/>

<Text style={styles.debugText}>
  Due Day Value: {dueDay}
</Text>

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

  debugText: {
    marginBottom: 10,
    color: "#334155",
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

