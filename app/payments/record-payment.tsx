import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function RecordPayment() {
  const { paymentId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  const [paymentDate, setPaymentDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [amount, setAmount] =
    useState("");

  const [expectedAmount, setExpectedAmount] =
    useState<number | null>(null);

  const [referenceNumber, setReferenceNumber] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {
    const fetchExpectedAmount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("payments")
          .select("amount")
          .eq("id", paymentId)
          .single();

        if (error) {
          Alert.alert("Error", error.message);
          router.back();
          return;
        }

        setExpectedAmount(data?.amount ?? null);
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Unable to load payment details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchExpectedAmount();
    }
  }, [paymentId]);

  const handleSavePayment =
    async () => {
      if (!amount) {
        Alert.alert("Validation Error", "Please enter the payment amount.");
        return;
      }

      const enteredAmount = Number(amount);
      if (expectedAmount !== null && enteredAmount < expectedAmount) {
        Alert.alert(
          "Validation Error",
          `Payment amount must be at least ₱${expectedAmount.toLocaleString()}.`
        );
        return;
      }

      try {
        setLoading(true);

        const { error } =
          await supabase
            .from("payments")
            .update({
              payment_status:
                "Paid",
              payment_date:
                paymentDate,
              payment_method:
                paymentMethod,
              amount: enteredAmount,
              reference_number:
                referenceNumber,
              remarks:
                remarks,
            })
            .eq("id", paymentId);

        if (error) {
          Alert.alert(
            "Error",
            error.message
          );
          return;
        }

        Alert.alert(
          "Success",
          "Payment recorded successfully."
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

        <Text style={styles.headerTitle}>Record Payment</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Record Payment
      </Text>

      <Text style={styles.label}>
        Payment Date
      </Text>

      <TextInput
        value={paymentDate}
        onChangeText={
          setPaymentDate
        }
        placeholder="2026-06-25"
        style={styles.input}
      />

      <Text style={styles.label}>
        Payment Method
      </Text>

      <Picker
        selectedValue={
          paymentMethod
        }
        onValueChange={
          setPaymentMethod
        }
        style={styles.picker}
      >
        <Picker.Item
          label="Cash"
          value="Cash"
        />

        <Picker.Item
          label="GCash"
          value="GCash"
        />

        <Picker.Item
          label="Bank Transfer"
          value="Bank Transfer"
        />
      </Picker>

      {expectedAmount !== null && (
        <View>
          <Text style={styles.label}>
            Amount Due
          </Text>
          <Text style={styles.amountDue}>
            ₱{expectedAmount.toLocaleString()}
          </Text>
        </View>
      )}

      <Text style={styles.label}>
        Amount Paid
      </Text>

      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>
        Reference Number
      </Text>

      <TextInput
        value={
          referenceNumber
        }
        onChangeText={
          setReferenceNumber
        }
        placeholder="Optional"
        style={styles.input}
      />

      <Text style={styles.label}>
        Remarks
      </Text>

      <TextInput
        value={remarks}
        onChangeText={setRemarks}
        placeholder="Optional"
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={
          handleSavePayment
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={
              styles.buttonText
            }
          >
            Save Payment
          </Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
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

    amountDue: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 10,
    },

    input: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 12,
      paddingHorizontal: 15,
      height: 55,
      marginBottom: 10,
    },

    picker: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 12,
      marginBottom: 10,
    },

    button: {
      backgroundColor:
        "#10B981",
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
    },

    buttonText: {
      color: "#fff",
      textAlign: "center",
      fontWeight: "700",
      fontSize: 16,
    },
  });