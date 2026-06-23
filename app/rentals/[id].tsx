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
        .order("created_at", { ascending: false });

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

  // UPDATED: Added the explicit monthly room fee itemization inside the HTML template
  const generateReceiptPDF = async (amountPaid: number, isInitialMoveIn: boolean = false) => {
    const receiptId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateString = new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const monthlyRentRate = Number(rental.monthly_rent) || 0;
    let tableRowsHtml = "";
    let totalReceiptAmount = 0;

    if (isInitialMoveIn) {
      const advanceValue = Number(rental.advance_payment) || 0;
      totalReceiptAmount = advanceValue;
      const monthsCovered = monthlyRentRate > 0 ? Math.floor(advanceValue / monthlyRentRate) : 1;

      tableRowsHtml = `
        <tr>
          <td>Standard Monthly Room Fee Base Rate</td>
          <td style="text-align: right; vertical-align: middle;">₱${monthlyRentRate.toLocaleString()} / mo</td>
        </tr>
        <tr>
          <td>Initial Advance Rent Deposit Package<br/><small style="color: #64748B;">Prepaid Coverage Duration: ${monthsCovered} Months</small></td>
          <td style="text-align: right; vertical-align: middle; font-weight: 600; color: #2E5052;">₱${advanceValue.toLocaleString()}</td>
        </tr>
      `;
    } else {
      totalReceiptAmount = amountPaid;
      tableRowsHtml = `
        <tr>
          <td>Standard Monthly Room Fee Base Rate</td>
          <td style="text-align: right;">₱${monthlyRentRate.toLocaleString()}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td>Current Statement Period Allocation Billing</td>
          <td style="text-align: right; font-weight: 600;">₱${amountPaid.toLocaleString()}</td>
        </tr>
      `;
    }

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
            .footer { margin-top: 60px; text-align: center; color: #94A3B8; font-size: 12px; }
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
                  ${tableRowsHtml}
                  <tr class="total-row">
                    <td>Total Handed Balance Settled</td>
                    <td style="text-align: right;">₱${totalReceiptAmount.toLocaleString()}</td>
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
    const amountToPay = rental.monthly_rent;

    Alert.alert(
      "Confirm Payment",
      `Receive payment of ₱${Number(amountToPay).toLocaleString()} for this rental?`,
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

              const { error } = await supabase.from("payments").insert({
                rental_id: rental.id,
                amount: amountToPay,
                payment_status: "Paid",
                user_id: user?.id,
              });

              if (error) throw error;

              await fetchPaymentSummary(rental.id);

              const isFirstPayment = payments.length === 0 && Number(rental.advance_payment) > 0;

              Alert.alert(
                "Success", 
                "Payment recorded successfully!",
                [
                  { text: "Close", style: "cancel" },
                  { 
                    text: "Generate Receipt", 
                    style: "default", 
                    onPress: () => generateReceiptPDF(amountToPay, isFirstPayment) 
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

              const { error } = await supabase
                .from("rentals")
                .update({ rental_status: "Ended" })
                .eq("id", id)
                .eq("user_id", rental.user_id);

              if (error) throw error;

              await supabase
                .from("rooms")
                .update({ status: "Available" })
                .eq("id", rental.room_id);

              await supabase
                .from("tenants")
                .update({ status: "Inactive" })
                .eq("id", rental.tenant_id);

              Alert.alert("Success", "Rental ended successfully.");
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

  const getNextMonthDueDate = (moveInDateString: string, monthlyRent: number, advancePayment: number) => {
    if (!moveInDateString) return "N/A";
    const baseDate = new Date(moveInDateString);
    if (isNaN(baseDate.getTime())) return "N/A";
    
    const rent = Number(monthlyRent) || 1; 
    const advance = Number(advancePayment) || 0;

    const monthsCovered = advance > 0 ? Math.floor(advance / rent) : 1;
    baseDate.setMonth(baseDate.getMonth() + monthsCovered);
    
    return baseDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#303841" }}>Rental not found.</Text>
      </View>
    );
  }

  const displayPaidAmount = paymentSummary.paidAmount > 0 
    ? paymentSummary.paidAmount 
    : (Number(rental.advance_payment) || 0);

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
            <Text style={styles.summaryLabel} numberOfLines={1}>Paid</Text>
            <Text style={styles.summaryValue}>₱{displayPaidAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel} numberOfLines={1}>Overdue</Text>
            <Text style={styles.summaryValue}>₱{paymentSummary.overdueAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* High-visibility Upcoming Bill Schedule Notice Segment */}
        {rental.rental_status === "Active" && (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingLeft}>
              <View style={styles.upcomingIconContainer}>
                <MaterialCommunityIcons name="calendar-alert" size={22} color="#76ABAE" />
              </View>
              <View style={styles.upcomingTextGroup}>
                <Text style={styles.upcomingTitle}>Next Bill Due</Text>
                <Text style={styles.upcomingSubtitle}>
                  {getNextMonthDueDate(rental.move_in_date, rental.monthly_rent, rental.advance_payment)}
                </Text>
              </View>
            </View>
            <Text style={styles.upcomingPrice}>₱{Number(rental.monthly_rent).toLocaleString()}</Text>
          </View>
        )}

        {/* Action CTA Bar Frame for Payment processing */}
        {rental.rental_status === "Active" && (
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
                <Text style={styles.payButtonText}>Collect / Pay Rent</Text>
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
            <Text style={styles.sectionTitle}>Rental Details</Text>
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
              <Text style={styles.cardTitle}>Payment Breakdown</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Rent</Text>
                <Text style={styles.detailValue}>₱{Number(rental.monthly_rent).toLocaleString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Payment Paid</Text>
                <Text style={styles.detailValue}>₱{Number(rental.advance_payment).toLocaleString()}</Text>
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
            <Text style={styles.sectionTitle}>Payment History</Text>
          </View>

          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payment history records found.</Text>
          ) : (
            payments.map((item, index) => {
              const isInitialMoveInRow = index === payments.length - 1;

              const displayAmountRow = isInitialMoveInRow && Number(rental.advance_payment) > 0
                ? Number(rental.advance_payment)
                : Number(item.amount);

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
                      {isInitialMoveInRow && Number(rental.advance_payment) > 0 
                        ? "Initial Move-in Costs" 
                        : (item.billing_month || "Monthly Rental Statement")}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {item.payment_status === "Paid" 
                        ? `Paid on: ${item.payment_date || item.created_at?.split("T")[0]}` 
                        : `Due Date: ${item.due_date || "N/A"}`}
                    </Text>
                  </View>

                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      ₱{displayAmountRow.toLocaleString()}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.historyStatusBadge, styles.badgePaid]}
                      onPress={() => generateReceiptPDF(Number(item.amount), isInitialMoveInRow)}
                    >
                      <MaterialCommunityIcons name="download" size={12} color="#166534" style={{ marginRight: 2 }} />
                      <Text style={[styles.historyStatusText, styles.textPaid]}>Receipt</Text>
                    </TouchableOpacity>
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
            <Text style={styles.endButtonText}>End Rental</Text>
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
  historyStatusText: { fontSize: 11, fontWeight: "700" },
  textPaid: { color: "#166534" },
});