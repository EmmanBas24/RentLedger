import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
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
  const [paying, setPaying] = useState(false);
  const [rental, setRental] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState({
    paidAmount: 0,
    dueAmount: 0,
    overdueAmount: 0,
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
      await fetchPaymentSummary(data.id);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSummary = async (rentalId: string) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("rental_id", rentalId)
        .order("due_date", { ascending: false });

      if (error) {
        console.log(error);
        return;
      }

      setPayments(data || []);

      const paidAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Paid" ? sum + Number(item.amount) : sum,
          0
        ) || 0;
      const dueAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Due" ? sum + Number(item.amount) : sum,
          0
        ) || 0;
      const overdueAmount =
        data?.reduce(
          (sum: number, item: any) =>
            item.payment_status === "Overdue" ? sum + Number(item.amount) : sum,
          0
        ) || 0;

      setPaymentSummary({
        paidAmount,
        dueAmount,
        overdueAmount,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const generateReceiptPDF = async (paymentItem: any) => {
    const receiptId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateString = new Date(paymentItem.payment_date || new Date()).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const amountCharged = Number(paymentItem.amount) || 0;

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; padding: 30px; color: #333; }
            .receipt-box { max-width: 800px; margin: auto; border: 1px solid #E5E7EB; padding: 30px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #76ABAE; padding-bottom: 20px; }
            .title { color: #303841; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .meta-details { text-align: right; font-size: 14px; color: #64748B; line-height: 1.5; }
            .info-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-card { background: #F8FAFC; padding: 15px; border-radius: 6px; border: 1px solid #E2E8F0; }
            .info-card h3 { margin: 0 0 10px 0; color: #76ABAE; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-card p { margin: 4px 0; font-size: 14px; color: #334155; }
            .table-container { margin-top: 40px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background-color: #303841; color: white; padding: 12px; font-size: 14px; }
            td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 14px; line-height: 1.4; }
            .total-row { font-weight: bold; font-size: 16px; background-color: #EBF5F6; color: #2E5052; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div>
                <div class="title">RENTAL PAYMENT RECEIPT</div>
                <div style="color: #76ABAE; font-weight: 600;">Statement Breakdown</div>
              </div>
              <div class="meta-details">
                <strong>Receipt #:</strong> ${receiptId}<br />
                <strong>Date Issued:</strong> ${dateString}<br />
                <strong>Status:</strong> PAID
              </div>
            </div>

            <div class="info-section">
              <div class="info-card">
                <h3>Tenant Details</h3>
                <p><strong>Name:</strong> ${rental.tenants?.full_name}</p>
                <p><strong>Email:</strong> ${rental.tenants?.email}</p>
                <p><strong>Contact:</strong> ${rental.tenants?.contact_number}</p>
              </div>
              <div class="info-card">
                <h3>Property Spaces</h3>
                <p><strong>Property:</strong> ${rental.assets?.property_name}</p>
                <p><strong>Room / Unit:</strong> Room ${rental.rooms?.room_number}</p>
                <p><strong>Location:</strong> ${rental.assets?.address}</p>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount Charged</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rental Billing Allocation Month: ${paymentItem.billing_month || "Statement Period"}<br/>
                    <small style="color: #64748B;">Payment Method: ${paymentItem.payment_method || "N/A"}</small></td>
                    <td style="text-align: right; vertical-align: middle;">₱${amountCharged.toLocaleString()}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total Handed Balance Settled</td>
                    <td style="text-align: right;">₱${amountCharged.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Rental Receipt" });
      } else {
        Alert.alert("Success", "Receipt saved onto device cache local storage!");
      }
    } catch (pdfError) {
      Alert.alert("Error", "Could not generate transaction PDF document assets.");
    }
  };

  const handlePayRent = async () => {
    // Find oldest unpaid item to collect payment on
    const upcomingBillItem = [...payments]
      .reverse()
      .find((item) => item.payment_status === "Due" || item.payment_status === "Overdue");

    if (!upcomingBillItem) {
      Alert.alert("No Balance Due", "This rental account contains no active pending open billing periods.");
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Process payment of ₱${Number(upcomingBillItem.amount).toLocaleString()} for ${upcomingBillItem.billing_month}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setPaying(true);
              const {
                data: { user },
              } = await supabase.auth.getUser();

              // Update current row to Paid
              const { error } = await supabase
                .from("payments")
                .update({
                  payment_status: "Paid",
                  payment_date: new Date().toISOString().split("T")[0],
                  payment_method: "Cash",
                })
                .eq("id", upcomingBillItem.id)
                .eq("user_id", user?.id);

              if (error) throw error;

              // FIXED SEQUENCE GENERATION: Check what the max existing due date in your payment list is
              // This guarantees we only append months *after* the furthest registered bill record.
              const chronologicalPayments = [...payments].sort(
                (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              );
              const highestBillRecord = chronologicalPayments[chronologicalPayments.length - 1];

              const baseDate = new Date(highestBillRecord ? highestBillRecord.due_date : upcomingBillItem.due_date);
              baseDate.setMonth(baseDate.getMonth() + 1);

              const nextBillingStr = baseDate.toLocaleString("en-US", { month: "long", year: "numeric" });
              const nextDueDateStr = baseDate.toISOString().split("T")[0];

              // Insert next statement schedule entry safely
              await supabase.from("payments").insert({
                rental_id: rental.id,
                user_id: user?.id,
                billing_month: nextBillingStr,
                amount: upcomingBillItem.amount,
                due_date: nextDueDateStr,
                payment_status: "Due",
              });

              await fetchPaymentSummary(rental.id);

              Alert.alert(
                "Success", 
                "Payment recorded successfully!",
                [
                  { text: "Close", style: "cancel" },
                  { 
                    text: "Generate Receipt", 
                    style: "default", 
                    onPress: () => generateReceiptPDF({ ...upcomingBillItem, payment_status: "Paid", payment_method: "Cash" }) 
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to log payment.");
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  const handleEndRental = async () => {
    Alert.alert(
      "End Rental",
      "Are you sure you want to end this rental?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Rental",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const { error: rentalError } = await supabase
                .from("rentals")
                .update({ rental_status: "Ended" })
                .eq("id", id)
                .eq("user_id", rental.user_id);

              if (rentalError) throw rentalError;

              const { error: deletePaymentsError } = await supabase
                .from("payments")
                .delete()
                .eq("rental_id", id)
                .in("payment_status", ["Due", "Overdue"]);

              if (deletePaymentsError) throw deletePaymentsError;

              await supabase
                .from("rooms")
                .update({ status: "Available" })
                .eq("id", rental.room_id);

              await supabase
                .from("tenants")
                .update({ status: "Inactive" })
                .eq("id", rental.tenant_id);

              Alert.alert("Success", "Rental ended and outstanding dues deleted successfully.");
              router.back();
            } catch (error: any) {
              console.log(error);
              Alert.alert("Error", error.message || "Something went wrong.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const activeUpcomingBill = [...payments]
    .reverse()
    .find((item) => item.payment_status === "Due" || item.payment_status === "Overdue");

if (loading || !rental) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rental Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Tenant Information Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account" size={22} color="#76ABAE" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Tenant Information</Text>
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
            <MaterialCommunityIcons name="home-city" size={22} color="#76ABAE" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Property Information</Text>
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

        {/* Financial Overview Metrics */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel} numberOfLines={1}>Paid Total</Text>
            <Text style={styles.summaryValue}>₱{paymentSummary.paidAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel} numberOfLines={1}>Overdue</Text>
            <Text style={styles.summaryValue}>₱{paymentSummary.overdueAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* High-visibility Upcoming Bill Schedule Notice Segment */}
        {rental.rental_status === "Active" && activeUpcomingBill && (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingLeft}>
              <View style={styles.upcomingIconContainer}>
                <MaterialCommunityIcons name="calendar-alert" size={22} color="#76ABAE" />
              </View>
              <View style={styles.upcomingTextGroup}>
                <Text style={styles.upcomingTitle}>Next Bill Due ({activeUpcomingBill.billing_month})</Text>
                <Text style={styles.upcomingSubtitle}>
                  {new Date(activeUpcomingBill.due_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.upcomingPrice}>₱{Number(activeUpcomingBill.amount).toLocaleString()}</Text>
          </View>
        )}

        {/* Action CTA Bar Frame for Payment processing */}
        {rental.rental_status === "Active" && activeUpcomingBill && (
          <TouchableOpacity 
            style={[styles.payButton, paying && { opacity: 0.7 }]} 
            onPress={handlePayRent}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="cash-register" size={20} color="#FFF" />
                <Text style={styles.payButtonText}>Collect Rent Summary</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Collapsible Accordion Block */}
        <TouchableOpacity
          style={[styles.dropdownHeader, detailsExpanded && styles.dropdownHeaderActive]}
          onPress={() => setDetailsExpanded((prev) => !prev)}
        >
          <View>
            <Text style={styles.sectionTitle}>Rental Parameters</Text>
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

        {detailsExpanded && (
          <View style={styles.accordionContainer}>
            <View style={[styles.card, styles.accordionCardSpacing]}>
              <Text style={styles.cardTitle}>Terms Agreement</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base Monthly Rent</Text>
                <Text style={styles.detailValue}>₱{Number(rental.monthly_rent).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule Status</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Move-in Date</Text>
                <Text style={styles.detailValue}>{rental.move_in_date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rental Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{rental.rental_status}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment History Details Section */}
        <View style={[styles.card, { marginTop: 15 }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={22} color="#76ABAE" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Ledger & Statement History</Text>
          </View>

          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No statement records found.</Text>
          ) : (
            payments.map((item, index) => {
              const isPaid = item.payment_status === "Paid";

              return (
                <View 
                  key={item.id || index} 
                  style={[
                    styles.historyRow, 
                    index !== payments.length - 1 && styles.historySeparator
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyMonth}>
                      {item.billing_month || "Monthly Rent"}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {isPaid 
                        ? `Paid on: ${item.payment_date || item.created_at?.split("T")[0]}` 
                        : `Due Date: ${item.due_date || "N/A"}`}
                    </Text>
                  </View>

                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      ₱{Number(item.amount).toLocaleString()}
                    </Text>
                    {isPaid ? (
                      <TouchableOpacity 
                        style={[styles.historyStatusBadge, styles.badgePaid]}
                        onPress={() => generateReceiptPDF(item)}
                      >
                        <MaterialCommunityIcons name="download" size={12} color="#166534" style={{ marginRight: 2 }} />
                        <Text style={[styles.historyStatusText, styles.textPaid]}>Receipt</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.historyStatusBadge, item.payment_status === "Overdue" ? styles.badgeOverdue : styles.badgeDue]}>
                        <Text style={[styles.historyStatusText, item.payment_status === "Overdue" ? styles.textOverdue : styles.textDue]}>
                          {item.payment_status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* End Rental CTA Triggers */}
        {rental.rental_status === "Active" && (
          <TouchableOpacity style={styles.endButton} onPress={handleEndRental}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#FFF" />
            <Text style={styles.endButtonText}>Terminate Rental</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: "#303841" },
  backButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center", backgroundColor: "#434E5A", borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F5" },
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  card: { backgroundColor: "#FFF", padding: 16, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: "#E5E7EB" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#303841" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sectionIcon: { marginRight: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 4 },
  itemLabel: { fontSize: 14, color: "#64748B", flex: 1 },
  itemValue: { fontSize: 14, fontWeight: "600", color: "#303841", flex: 2, textAlign: "right" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#303841", marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  detailLabel: { color: "#64748B", fontSize: 14 },
  detailValue: { color: "#303841", fontSize: 14, fontWeight: "700" },
  statusBadge: { backgroundColor: "#E6F4F1", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: "#76ABAE", fontWeight: "700", fontSize: 13 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 15 },
  summaryCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  summaryLabel: { color: "#64748B", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: "700", color: "#303841" },
  dropdownHeader: { backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: "#E5E7EB", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownHeaderActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, borderBottomWidth: 0 },
  accordionContainer: { backgroundColor: "#EAEAEA", padding: 12, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: "#E5E7EB", borderTopWidth: 0 },
  accordionCardSpacing: { marginBottom: 10 },
  dropdownSubtext: { color: "#64748B", marginTop: 4, fontSize: 12 },
  upcomingCard: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    backgroundColor: "#EBF5F6", 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: "#BCE3E6", 
    borderLeftWidth: 5, 
    borderLeftColor: "#76ABAE" 
  },
  upcomingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  upcomingIconContainer: { backgroundColor: "#FFF", padding: 8, borderRadius: 10, shadowColor: "#76ABAE", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  upcomingTextGroup: { flexDirection: "column" },
  upcomingTitle: { fontSize: 13, fontWeight: "800", color: "#507274", textTransform: "uppercase", letterSpacing: 0.5 },
  upcomingSubtitle: { fontSize: 16, fontWeight: "700", color: "#303841", marginTop: 2 },
  upcomingPrice: { fontSize: 18, fontWeight: "800", color: "#2E5052" },
  payButton: { backgroundColor: "#76ABAE", padding: 16, borderRadius: 12, marginBottom: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, shadowColor: "#76ABAE", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  payButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  endButton: { backgroundColor: "#FF5722", padding: 16, borderRadius: 12, marginTop: 10, marginBottom: 40, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  endButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  emptyText: { fontSize: 14, color: "#64748B", textAlign: "center", marginVertical: 10, fontStyle: "italic" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  historySeparator: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  historyLeft: { flex: 2 },
  historyRight: { flex: 1, alignItems: "flex-end", gap: 4 },
  historyMonth: { fontSize: 15, fontWeight: "700", color: "#303841" },
  historyMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: "700", color: "#303841" },
  historyStatusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePaid: { backgroundColor: "#DCFCE7" },
  badgeDue: { backgroundColor: "#FEF3C7" },
  badgeOverdue: { backgroundColor: "#FEE2E2" },
  historyStatusText: { fontSize: 11, fontWeight: "700" },
  textPaid: { color: "#166534" },
  textDue: { color: "#B45309" },
  textOverdue: { color: "#991B1B" },
});