import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [expectedAmount, setExpectedAmount] = useState<number | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    isMounted.current = true;
    
    const fetchExpectedAmount = async () => {
      if (!paymentId) return;
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

        if (isMounted.current) {
          setExpectedAmount(data?.amount ?? null);
        }
      } catch (error) {
        console.log("Fetch Error:", error);
        Alert.alert("Error", "Unable to load payment details.");
        router.back();
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchExpectedAmount();

    return () => {
      // Kills all pending state resolutions when navigating away
      isMounted.current = false;
    };
  }, [paymentId]);

  const handleSavePayment = async () => {
    const cleanedAmount = amount.trim();
    if (!cleanedAmount) {
      Alert.alert("Validation Error", "Please enter the payment amount.");
      return;
    }

    const enteredAmount = Number(cleanedAmount);
    if (Number.isNaN(enteredAmount) || enteredAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid payment amount.");
      return;
    }

    if (expectedAmount !== null && enteredAmount < expectedAmount) {
      Alert.alert(
        "Validation Error",
        `Payment amount must be at least ₱${expectedAmount.toLocaleString()}.`
      );
      return;
    }

    try {
      setLoading(true);

      // 1. Update current invoice row
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update({
          payment_status: "Paid",
          payment_date: paymentDate,
          payment_method: paymentMethod,
          amount_paid: enteredAmount,
          reference_number: referenceNumber.trim() || null,
          remarks: remarks.trim() || null,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updateError || !updatedPayment) {
        Alert.alert("Error", updateError?.message || "Failed to update payment.");
        if (isMounted.current) setLoading(false);
        return;
      }

      // 2. Query rental contract structures 
      const { data: rental, error: rentalError } = await supabase
        .from("rentals")
        .select("monthly_rent, user_id")
        .eq("id", updatedPayment.rental_id)
        .single();

      if (rentalError || !rental) {
        Alert.alert("Error fetching rental metadata", rentalError?.message || "Rental metadata mismatch.");
        if (isMounted.current) setLoading(false);
        return;
      }

      // 3. Robust Date Engineering Logic
      const currentDueDate = new Date(updatedPayment.due_date);
      if (Number.isNaN(currentDueDate.getTime())) {
        throw new Error("Invalid format encountered within database schema date mapping.");
      }

      const nextDueDateObj = new Date(currentDueDate);
      nextDueDateObj.setMonth(currentDueDate.getMonth() + 1);

      const nextDueDateStr = nextDueDateObj.toISOString().split("T")[0];
      const nextMonthLabel = nextDueDateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      // 4. Validate and execute future period generation
      const { data: existingPayment, error: checkError } = await supabase
        .from("payments")
        .select("id")
        .eq("rental_id", updatedPayment.rental_id)
        .eq("due_date", nextDueDateStr)
        .maybeSingle();

      if (!checkError && !existingPayment) {
        await supabase.from("payments").insert([
          {
            user_id: updatedPayment.user_id,
            rental_id: updatedPayment.rental_id,
            billing_month: nextMonthLabel,
            amount: rental.monthly_rent,
            due_date: nextDueDateStr,
            payment_status: "Due",
          },
        ]);
      }

      Alert.alert("Success", "Payment recorded successfully.", [
        { 
          text: "OK", 
          onPress: () => {
            // Give native animation layout threads a clean window to reset
            setTimeout(() => {
              router.back();
            }, 100);
          } 
        }
      ]);
    } catch (error) {
      console.log("Execution Error Handled Safely:", error);
      Alert.alert("Error", "Something went wrong processing transactional cycles.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={loading}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Process Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {expectedAmount !== null && (
          <View style={styles.dueBanner}>
            <MaterialCommunityIcons name="receipt" size={24} color="#76ABAE" />
            <View style={styles.dueBannerTextContainer}>
              <Text style={styles.dueLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.amountDue}>
                ₱{expectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <Text style={styles.label}>Amount Received (₱)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="currency-php" size={20} color="#76ABAE" style={styles.inputIcon} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              style={styles.input}
              editable={!loading}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={(itemValue) => setPaymentMethod(itemValue)}
              dropdownIconColor="#76ABAE"
              enabled={!loading}
            >
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="GCash" value="GCash" />
              <Picker.Item label="Maya" value="Maya" />
              <Picker.Item label="Bank Transfer" value="Bank Transfer" />
            </Picker>
          </View>

          <Text style={styles.label}>Payment Date</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="calendar" size={20} color="#76ABAE" style={styles.inputIcon} />
            <TextInput
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              editable={!loading}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <Text style={styles.label}>Reference Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#76ABAE" style={styles.inputIcon} />
            <TextInput
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="e.g. Transaction ID Reference"
              style={styles.input}
              editable={!loading}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Text style={styles.label}>Remarks</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add internal transaction notes here..."
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              editable={!loading}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSavePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Confirm Payment</Text>
            </>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#303841",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#76ABAE",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F5F5",
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dueBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 5,
    borderLeftColor: "#76ABAE",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dueBannerTextContainer: {
    marginLeft: 14,
  },
  dueLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#76ABAE",
    letterSpacing: 1,
    marginBottom: 2,
  },
  amountDue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#303841",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#303841",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#303841",
    fontSize: 15,
    fontWeight: "500",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    overflow: "hidden",
  },
  textAreaWrapper: {
    height: 90,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});