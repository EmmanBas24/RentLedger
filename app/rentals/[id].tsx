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
                <p><strong>Name:</strong> ${rental?.tenants?.full_name}</p>
                <p><strong>Email:</strong> ${rental?.tenants?.email}</p>
                <p><strong>Contact:</strong> ${rental?.tenants?.contact_number}</p>
              </div>
              <div class="info-card">
                <h3>Property Spaces</h3>
                <p><strong>Property:</strong> ${rental?.assets?.property_name}</p>
                <p><strong>Room / Unit:</strong> Room ${rental?.rooms?.room_number}</p>
                <p><strong>Location:</strong> ${rental?.assets?.address}</p>
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

  const handleEndRental = async () => {
    Alert.alert(
      "Terminate Agreement",
      "Are you certain you want to end this active tenancy documentation structure? This will wipe outstanding uncollected fields.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Termination",
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

              Alert.alert("Terminated", "Rental records closed flawlessly.");
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
        <ActivityIndicator size="small" color="#76ABAE" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Premium Integrated Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#303841" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agreement Record</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Premium Account Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTenantLabel}>TENANT</Text>
              <Text style={styles.heroTenantName}>{rental?.tenants?.full_name}</Text>
              <Text style={styles.heroLocationSub}>
                {rental?.assets?.property_name} • Unit {rental?.rooms?.room_number}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{rental?.rental_status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Financial Executive Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL SETTLED</Text>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>
              ₱{paymentSummary.paidAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL OVERDUE</Text>
            <Text style={[styles.summaryValue, { color: paymentSummary.overdueAmount > 0 ? "#EF4444" : "#303841" }]}>
              ₱{paymentSummary.overdueAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Dynamic High-Contrast Bill Invoice Prompt */}
        {rental?.rental_status === "Active" && activeUpcomingBill && (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingHeaderContainer}>
              <View style={styles.upcomingTag}>
                <MaterialCommunityIcons name="file-document-outline" size={12} color="#76ABAE" style={{ marginRight: 4 }} />
                <Text style={styles.upcomingTagText}>NEXT DUE BILL</Text>
              </View>
              <Text style={styles.upcomingPrice}>
                ₱{Number(activeUpcomingBill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            
            <View style={styles.upcomingMetaRow}>
              <View>
                <Text style={styles.upcomingMetaLabel}>DUE MONTH</Text>
                <Text style={styles.upcomingMetaVal}>{activeUpcomingBill.billing_month}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.upcomingMetaLabel}>MATURITY DATE</Text>
                <Text style={styles.upcomingMetaVal}>
                  {new Date(activeUpcomingBill.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.payButton} 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: "/payments/record-payment",
                params: { 
                  paymentId: activeUpcomingBill.id,
                  billing_month: activeUpcomingBill.billing_month,
                  amount: activeUpcomingBill.amount,
                  rental_id: rental.id
                }
              })}
            >
              <MaterialCommunityIcons name="credit-card-check-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.payButtonText}>Collect Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Clean Contact Data Block */}
        <View style={styles.premiumSectionCard}>
          <Text style={styles.cardHeaderTitle}>Contact Information</Text>
          <View style={styles.pureInfoRow}>
            <Text style={styles.pureLabel}>Email Address</Text>
            <Text style={styles.pureValue}>{rental?.tenants?.email || "N/A"}</Text>
          </View>
          <View style={styles.pureInfoRow}>
            <Text style={styles.pureLabel}>Contact Number</Text>
            <Text style={styles.pureValue}>{rental?.tenants?.contact_number || "N/A"}</Text>
          </View>
          <View style={styles.pureInfoRow}>
            <Text style={styles.pureLabel}>Physical Address</Text>
            <Text style={styles.pureValue} numberOfLines={1}>{rental?.assets?.address}</Text>
          </View>
        </View>

        {/* Collapsible Parameters Segment */}
        <TouchableOpacity
          style={styles.accordionToggleHeader}
          activeOpacity={0.7}
          onPress={() => setDetailsExpanded((prev) => !prev)}
        >
          <Text style={styles.cardHeaderTitle}>Agreement Settings</Text>
          <MaterialCommunityIcons
            name={detailsExpanded ? "minus" : "plus"}
            size={18}
            color="#76ABAE"
          />
        </TouchableOpacity>

        {detailsExpanded && (
          <View style={styles.accordionBodyContainer}>
            <View style={styles.pureInfoRow}>
              <Text style={styles.pureLabel}>Base Space Rent</Text>
              <Text style={styles.pureValue}>₱{Number(rental?.monthly_rent).toLocaleString()}</Text>
            </View>
            <View style={styles.pureInfoRow}>
              <Text style={styles.pureLabel}>Move-In Index</Text>
              <Text style={styles.pureValue}>{rental?.move_in_date}</Text>
            </View>
          </View>
        )}

        {/* Ledger & Statement Stream */}
        <View style={[styles.premiumSectionCard, { marginTop: 16 }]}>
          <Text style={styles.cardHeaderTitle}>Payment History</Text>

          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No historical logs detected.</Text>
          ) : (
            payments.map((item, index) => {
              const isPaid = item.payment_status === "Paid";
              const isOverdue = item.payment_status === "Overdue";

              return (
                <View 
                  key={item.id || index} 
                  style={[
                    styles.historyItemRow, 
                    index !== payments.length - 1 && styles.historyItemSeparator
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyMonthText}>
                      {item.billing_month || "Monthly Lease Rent"}
                    </Text>
                    <Text style={styles.historySubMeta}>
                      {isPaid 
                        ? `Cleared: ${item.payment_date || item.created_at?.split("T")[0]}` 
                        : `Matures: ${item.due_date || "N/A"}`}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyAmountText}>
                      ₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    
                    {isPaid ? (
                      <TouchableOpacity 
                        style={[styles.miniStatusBadge, styles.miniBadgePaid]}
                        activeOpacity={0.7}
                        onPress={() => generateReceiptPDF(item)}
                      >
                        <MaterialCommunityIcons name="tray-arrow-down" size={10} color="#10B981" style={{ marginRight: 2 }} />
                        <Text style={[styles.miniStatusText, { color: "#10B981" }]}>RECEIPT</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.miniStatusBadge, isOverdue ? styles.miniBadgeOverdue : styles.miniBadgeDue]}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: "/payments/record-payment",
                          params: { 
                            paymentId: item.id, 
                            billing_month: item.billing_month,
                            amount: item.amount,
                            rental_id: rental.id 
                          }
                        })}
                      >
                        <Text style={[styles.miniStatusText, isOverdue ? { color: "#EF4444" } : { color: "#F59E0B" }]}>
                          {item.payment_status?.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Elegant Destructive Actions Frame */}
        {rental?.rental_status === "Active" && (
          <TouchableOpacity style={styles.endButton} activeOpacity={0.8} onPress={handleEndRental}>
            <Text style={styles.endButtonText}>Terminate Rental</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#FBFBFD" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    backgroundColor: "#FBFBFD"
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#FFF", 
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#303841",
    letterSpacing: -0.3
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 24 
  },
  heroCard: {
    backgroundColor: "#303841",
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    marginBottom: 14,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6
  },
  heroRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start" 
  },
  heroTenantLabel: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#76ABAE", 
    letterSpacing: 1 
  },
  heroTenantName: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#FFF", 
    marginTop: 4,
    letterSpacing: -0.5
  },
  heroLocationSub: { 
    fontSize: 13, 
    color: "#94A3B8", 
    marginTop: 4,
    fontWeight: "500"
  },
  statusBadge: { 
    backgroundColor: "rgba(118, 171, 174, 0.15)", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(118, 171, 174, 0.2)"
  },
  statusText: { 
    color: "#76ABAE", 
    fontWeight: "700", 
    fontSize: 10,
    letterSpacing: 0.6
  },
  summaryRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 16 
  },
  summaryCard: { 
    flex: 1, 
    backgroundColor: "#FFF", 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.03)", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2
  },
  summaryLabel: { 
    color: "#94A3B8", 
    fontSize: 9, 
    fontWeight: "700", 
    letterSpacing: 0.8 
  },
  summaryValue: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#303841", 
    marginTop: 6,
    letterSpacing: -0.3
  },
  upcomingCard: { 
    backgroundColor: "#FFF", 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: "rgba(118, 171, 174, 0.15)",
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3
  },
  upcomingHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 14
  },
  upcomingTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  upcomingTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#76ABAE",
    letterSpacing: 0.3
  },
  upcomingPrice: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#303841",
    letterSpacing: -0.5
  },
  upcomingMetaRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 14,
    marginBottom: 18
  },
  upcomingMetaLabel: { 
    fontSize: 9, 
    fontWeight: "700", 
    color: "#94A3B8",
    letterSpacing: 0.5
  },
  upcomingMetaVal: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#303841", 
    marginTop: 2 
  },
  payButton: { 
    backgroundColor: "#76ABAE", 
    paddingVertical: 14, 
    borderRadius: 16, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  payButtonText: { 
    color: "#FFF", 
    fontWeight: "600", 
    fontSize: 14,
    letterSpacing: -0.2
  },
  premiumSectionCard: { 
    backgroundColor: "#FFF", 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2
  },
  cardHeaderTitle: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#303841", 
    marginBottom: 14,
    letterSpacing: -0.2
  },
  pureInfoRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 8 
  },
  pureLabel: { 
    fontSize: 13, 
    color: "#94A3B8",
    fontWeight: "500"
  },
  pureValue: { 
    fontSize: 13, 
    fontWeight: "500", 
    color: "#303841" 
  },
  accordionToggleHeader: { 
    backgroundColor: "#FFF", 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    marginTop: 14, 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.03)", 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  accordionBodyContainer: { 
    backgroundColor: "#FFF", 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.03)", 
    borderTopWidth: 0,
    marginTop: -8
  },
  emptyText: { 
    fontSize: 13, 
    color: "#94A3B8", 
    textAlign: "center", 
    marginVertical: 16, 
    fontStyle: "italic" 
  },
  historyItemRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 14 
  },
  historyItemSeparator: { 
    borderBottomWidth: 1, 
    borderBottomColor: "#F8FAFC" 
  },
  historyMonthText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#303841" 
  },
  historySubMeta: { 
    fontSize: 12, 
    color: "#94A3B8", 
    marginTop: 2 
  },
  historyAmountText: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#303841",
    letterSpacing: -0.2
  },
  miniStatusBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    marginTop: 4
  },
  miniBadgePaid: { backgroundColor: "#ECFDF5" },
  miniBadgeDue: { backgroundColor: "#FFF9E6" },
  miniBadgeOverdue: { backgroundColor: "#FEF2F2" },
  miniStatusText: { 
    fontSize: 9, 
    fontWeight: "700",
    letterSpacing: 0.3
  },
  endButton: { 
    backgroundColor: "transparent", 
    paddingVertical: 16, 
    borderRadius: 16, 
    marginTop: 24, 
    marginBottom: 40, 
    borderWidth: 1,
    borderColor: "#EF4444",
    justifyContent: "center", 
    alignItems: "center" 
  },
  endButtonText: { 
    color: "#EF4444", 
    fontWeight: "600", 
    fontSize: 14 
  },
});