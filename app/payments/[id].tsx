import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
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

interface PaymentDetails {
  id: string;
  amount: number;
  due_date: string;
  payment_status: string;
  billing_month: string;
  payment_date: string | null;
  payment_method: string | null;
  amount_paid: number | null;
  reference_number: string | null;
  remarks: string | null;
  rentals: {
    tenants: { full_name: string };
    rooms: { room_number: string };
  };
}

export default function PaymentDetails() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);

  const fetchPaymentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          rentals(
            tenants(full_name),
            rooms(room_number)
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        Alert.alert("Database Error", error.message);
        router.back();
        return;
      }
      setPayment(data);
    } catch (err) {
      console.log("Fetch Details Error:", err);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchPaymentDetails();
    }, [id, fetchPaymentDetails])
  );

  const handleDownloadPDF = async () => {
    if (!payment) return;

    try {
      setPdfGenerating(true);

      const tenantName = payment.rentals?.tenants?.full_name || "Unknown Tenant";
      const roomNumber = payment.rentals?.rooms?.room_number || "N/A";
      const renderedAmount = (payment.amount_paid ?? payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const baseAmount = payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

      // Premium, beautiful HTML/CSS receipt template layout design
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; padding: 50px; background-color: #FFFFFF; line-height: 1.5; }
              .invoice-box { max-width: 800px; margin: auto; padding: 10px; }
              
              /* Header Section */
              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .brand-title { font-size: 26px; font-weight: 800; color: #303841; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
              .brand-subtitle { font-size: 13px; color: #64748B; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }
              .invoice-tag { text-align: right; }
              .status-badge { display: inline-block; padding: 6px 14px; background-color: #10B981; color: #FFFFFF; font-weight: 700; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              
              /* Info Block */
              .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .info-col { width: 50%; vertical-align: top; }
              .info-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
              .info-text { font-size: 14px; color: #334155; font-weight: 600; margin: 0 0 4px 0; }
              
              /* Receipt Table */
              .receipt-table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px; }
              .receipt-table th { background-color: #303841; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px 16px; }
              .receipt-table td { padding: 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #334155; }
              .text-right { text-align: right; }
              
              /* Calculation Block */
              .summary-table { width: 40%; margin-left: auto; border-collapse: collapse; margin-bottom: 40px; }
              .summary-row td { padding: 8px 16px; font-size: 14px; color: #64748B; }
              .total-row { background-color: #F8FAFC; border-top: 2px solid #E2E8F0; }
              .total-row td { padding: 14px 16px; font-size: 16px; font-weight: 800; color: #303841; }
              
              /* Footer and Remarks */
              .remarks-box { background-color: #F8FAFC; border-left: 4px solid #CBD5E1; padding: 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #475569; font-style: italic; margin-bottom: 50px; }
              .footer { text-align: center; border-top: 1px solid #E2E8F0; padding-top: 24px; color: #94A3B8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              
              <table class="header-table">
                <tr>
                  <td>
                    <h1 class="brand-title">Rental Receipt</h1>
                    <p class="brand-subtitle">Official Statement of Account</p>
                  </td>
                  <td class="invoice-tag">
                    <span class="status-badge">Acknowledge Paid</span>
                  </td>
                </tr>
              </table>
              
              <table class="info-grid">
                <tr>
                  <td class="info-col">
                    <div class="info-label">Tenant Recipient</div>
                    <p class="info-text" style="font-size: 18px; color: #303841; font-weight: 700;">${tenantName}</p>
                    <p class="info-text">Unit Assignment: Room ${roomNumber}</p>
                  </td>
                  <td class="info-col" style="text-align: right;">
                    <div class="info-label">Transaction Reference</div>
                    <p class="info-text">Date Settled: ${payment.payment_date || "N/A"}</p>
                    <p class="info-text">Method: ${payment.payment_method || "N/A"}</p>
                    <p class="info-text" style="font-family: monospace; color: #64748B;">Ref No: ${payment.reference_number || "None"}</p>
                  </td>
                </tr>
              </table>
              
              <table class="receipt-table">
                <thead>
                  <tr>
                    <th>Description Statement</th>
                    <th>Billing Cycle</th>
                    <th class="text-right">Base Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Space Rental Assessment Fee</strong><br>
                      <span style="font-size: 12px; color: #64748B;">Premises charges for designated room space allocation ledger</span>
                    </td>
                    <td>${payment.billing_month}</td>
                    <td class="text-right">₱${baseAmount}</td>
                  </tr>
                </tbody>
              </table>
              
              <table class="summary-table">
                <tr class="summary-row">
                  <td>Subtotal Due:</td>
                  <td class="text-right">₱${baseAmount}</td>
                </tr>
                <tr class="summary-row total-row">
                  <td><strong>Amount Paid:</strong></td>
                  <td class="text-right" style="color: #10B981;"><strong>₱${renderedAmount}</strong></td>
                </tr>
              </table>
              
              ${payment.remarks ? `
                <div class="info-label">Collector Remarks Ledger Context</div>
                <div class="remarks-box">"${payment.remarks}"</div>
              ` : ""}
              
              <div class="footer">
                This transaction ledger statement document was generated digitally.<br>
                Thank you for your active lease commitment compliance.
              </div>
              
            </div>
          </body>
        </html>
      `;

      // 1. Generate local print cache URI context
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // 2. Format a clean system filename
      const cleanTenantName = tenantName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const cleanMonth = payment.billing_month.replace(/\s+/g, "_").toLowerCase();
      const filename = `receipt_${cleanTenantName}_${cleanMonth}.pdf`;
      
      // 3. Move document container directly to internal system document storage structures
      const targetInternalURI = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: targetInternalURI,
      });

      // 4. Fire open native phone UI download/share sheet pipeline directly
      await Sharing.shareAsync(targetInternalURI, {
        mimeType: "application/pdf",
        dialogTitle: "Download Receipt",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      Alert.alert("System Error", "Failed to compile premium layout architecture down into system storage context.");
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#303841", fontWeight: "600" }}>Invoice not found.</Text>
      </View>
    );
  }

  const isPaid = payment.payment_status === "Paid";
  const isOverdue = payment.payment_status === "Overdue";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Main Info Hero Card */}
        <View style={styles.receiptCard}>
          <View style={[
            styles.statusIconCircle, 
            isPaid ? styles.circlePaid : isOverdue ? styles.circleOverdue : styles.circleDue
          ]}>
            <MaterialCommunityIcons 
              name={isPaid ? "check-decagram" : isOverdue ? "alert-circle-outline" : "clock-outline"} 
              size={38} 
              color={isPaid ? "#10B981" : isOverdue ? "#F43F5E" : "#D97706"} 
            />
          </View>
          
          <Text style={styles.tenantName}>{payment.rentals?.tenants?.full_name || "Unknown Tenant"}</Text>
          <Text style={styles.roomLabel}>Room {payment.rentals?.rooms?.room_number || "N/A"}</Text>
          
          <Text style={styles.mainAmount}>₱{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.billingCycle}>{payment.billing_month}</Text>
        </View>

        {/* Breakdown Matrix Block */}
        <View style={styles.detailsBlock}>
          <Text style={styles.sectionTitle}>Invoice Ledger Data</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Target Due Date</Text>
            <Text style={styles.metaValue}>{payment.due_date}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice Status</Text>
            <Text style={[
              styles.statusText, 
              isPaid ? styles.txtPaid : isOverdue ? styles.txtOverdue : styles.txtDue
            ]}>
              {payment.payment_status.toUpperCase()}
            </Text>
          </View>

          {/* Conditional Settled Section: Only displays if status is Paid */}
          {isPaid && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Transaction Receipt</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date Settled</Text>
                <Text style={styles.metaValue}>{payment.payment_date || "N/A"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Payment Mode</Text>
                <Text style={styles.metaValue}>{payment.payment_method || "N/A"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Amount Rendered</Text>
                <Text style={[styles.metaValue, { fontWeight: "700", color: "#10B981" }]}>
                  ₱{(payment.amount_paid ?? payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Reference No.</Text>
                <Text style={styles.metaValue}>{payment.reference_number || "None Provided"}</Text>
              </View>
              
              {/* Download PDF Action Anchor Button directly below receipt details metrics */}
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.pdfButton} 
                onPress={handleDownloadPDF}
                disabled={pdfGenerating}
                activeOpacity={0.7}
              >
                {pdfGenerating ? (
                  <ActivityIndicator size="small" color="#76ABAE" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="#76ABAE" style={{ marginRight: 6 }} />
                    <Text style={styles.pdfButtonText}>Download PDF Receipt</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {payment.remarks && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Internal Notes</Text>
              <Text style={styles.remarksContent}>"{payment.remarks}"</Text>
            </>
          )}
        </View>

        {/* Action Button: Visible ONLY for non-paid outstanding invoices */}
        {!isPaid && (
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/payments/record-payment",
              params: { paymentId: payment.id }
            })}
          >
            <MaterialCommunityIcons name="credit-card-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Pay Due</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#F5F5F5" 
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
    color: "#F5F5F5" 
  },
  scrollContainer: { 
    padding: 20 
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  circlePaid: { backgroundColor: "#ECFDF5" },
  circleDue: { backgroundColor: "#FFFBEB" },
  circleOverdue: { backgroundColor: "#FFF1F2" },
  tenantName: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#303841" 
  },
  roomLabel: { 
    fontSize: 14, 
    color: "#76ABAE", 
    fontWeight: "600", 
    marginTop: 2 
  },
  mainAmount: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "#303841", 
    marginTop: 16,
    letterSpacing: -0.5,
  },
  billingCycle: { 
    fontSize: 12, 
    color: "#94A3B8", 
    fontWeight: "700", 
    textTransform: "uppercase", 
    marginTop: 4,
    letterSpacing: 0.5,
  },
  detailsBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: "800", 
    color: "#76ABAE", 
    marginBottom: 10, 
    textTransform: "uppercase", 
    letterSpacing: 0.8 
  },
  metaRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 10 
  },
  metaLabel: { 
    fontSize: 14, 
    color: "#64748B", 
    fontWeight: "500" 
  },
  metaValue: { 
    fontSize: 14, 
    color: "#303841", 
    fontWeight: "600" 
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: "700" 
  },
  txtPaid: { color: "#10B981" },
  txtDue: { color: "#D97706" },
  txtOverdue: { color: "#F43F5E" },
  divider: { 
    height: 1, 
    backgroundColor: "#F5F5F5", 
    marginVertical: 14 
  },
  remarksContent: { 
    fontSize: 14, 
    color: "#475569", 
    lineHeight: 22, 
    fontStyle: "italic",
    marginTop: 4 
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 12,
    height: 44,
    marginTop: 4,
  },
  pdfButtonText: {
    color: "#76ABAE",
    fontWeight: "700",
    fontSize: 14,
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: { 
    color: "#FFFFFF", 
    fontWeight: "700", 
    fontSize: 16 
  },
});