import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface PaymentItem {
  id: string;
  billing_month: string;
  amount: number;
  due_date: string;
  payment_status: string;
  tenant_name: string;
  room_number: string;
}

interface ReportParams {
  payments: PaymentItem[];
  type: "Paid" | "Due" | "All";
}

export async function generatePaymentReport({ payments, type }: ReportParams) {
  if (payments.length === 0) {
    throw new Error("No payment records to include in the report.");
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const title =
    type === "All"
      ? "All Payments Report"
      : type === "Paid"
      ? "Paid Clearances Report"
      : "Pending Dues Report";

  const accentColor = type === "Paid" ? "#2E7D32" : type === "Due" ? "#D97706" : "#303841";

  const tableRows = payments
    .map(
      (p, i) => `
      <tr style="${i % 2 === 0 ? "" : "background-color: #F8FAFC;"}">
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; font-size: 12px; color: #1E293B;">${p.tenant_name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; font-size: 12px; color: #475569;">${p.room_number}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; font-size: 12px; color: #475569;">${p.billing_month}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; font-size: 12px; color: #475569;">${p.due_date}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; font-size: 12px; font-weight: 700; color: #1E293B; text-align: right;">₱ ${p.amount.toLocaleString()}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #EEF2F6; text-align: center;">
          <span style="
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            background-color: ${p.payment_status === "Paid" ? "#ECFDF5" : p.payment_status === "Overdue" ? "#FFF1F2" : "#FFFBEB"};
            color: ${p.payment_status === "Paid" ? "#065F46" : p.payment_status === "Overdue" ? "#991B1B" : "#92400E"};
          ">${p.payment_status}</span>
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1E293B; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid ${accentColor}; padding-bottom: 20px; }
        .brand { font-size: 24px; font-weight: 800; color: #303841; letter-spacing: -0.5px; }
        .brand-sub { font-size: 11px; color: #76ABAE; margin-top: 2px; }
        .report-title { font-size: 18px; font-weight: 700; color: ${accentColor}; text-align: right; }
        .report-date { font-size: 11px; color: #64748B; margin-top: 4px; text-align: right; }
        .summary-bar { display: flex; gap: 16px; margin-bottom: 28px; }
        .summary-box { flex: 1; background: #F8FAFC; border: 1px solid #EEF2F6; border-radius: 12px; padding: 16px; text-align: center; }
        .summary-number { font-size: 28px; font-weight: 800; color: ${accentColor}; }
        .summary-label { font-size: 10px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #EEF2F6; }
        thead th { background-color: #1E252B; color: #FFFFFF; padding: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; text-align: left; }
        thead th:nth-child(5) { text-align: right; }
        thead th:last-child { text-align: center; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #EEF2F6; display: flex; justify-content: space-between; }
        .footer-text { font-size: 10px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">RentLedger</div>
          <div class="brand-sub">Property Management System</div>
        </div>
        <div>
          <div class="report-title">${title}</div>
          <div class="report-date">Generated: ${dateStr}</div>
        </div>
      </div>

      <div class="summary-bar">
        <div class="summary-box">
          <div class="summary-number">${payments.length}</div>
          <div class="summary-label">Total Records</div>
        </div>
        <div class="summary-box">
          <div class="summary-number">₱ ${totalAmount.toLocaleString()}</div>
          <div class="summary-label">Total Amount</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Room</th>
            <th>Billing</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <div class="footer-text">RentLedger &copy; ${now.getFullYear()}</div>
        <div class="footer-text">${payments.length} record(s) &bull; ${title}</div>
      </div>
    </body>
  </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: title,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Sharing is not available on this device.");
  }
}