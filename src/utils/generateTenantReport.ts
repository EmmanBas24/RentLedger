import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "../lib/supabase";

export interface ReportMetrics {
  totalProperties: number;
  occupiedUnits: number;
  availableUnits: number;
}

export async function generateTenantAndPropertyReport(
  metrics: ReportMetrics
): Promise<void> {
  // 1. Fetch data explicitly including your exact full_name column
  const { data: activeTenants, error: tenantError } = await supabase
    .from("tenants")
    .select("full_name, address, contact_number")
    .eq("status", "Active");

  if (tenantError) {
    throw new Error(`Tenants query failed: ${tenantError.message}`);
  }

  const tenantsList = activeTenants || [];

  const dateString = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1E293B; padding: 30px; line-height: 1.5; }
        .header { border-bottom: 2px solid #1E252B; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header-title h1 { margin: 0; color: #1E252B; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header-title p { margin: 4px 0 0 0; color: #64748B; font-size: 13px; }
        .date-badge { font-size: 12px; color: #76ABAE; font-weight: 700; text-transform: uppercase; }
        
        .section-title { font-size: 13px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; margin-bottom: 10px; }
        
        .metrics-grid { display: flex; gap: 16px; margin-bottom: 24px; }
        .metric-card { flex: 1; background: #F8FAFC; border: 1px solid #EEF2F6; padding: 16px; border-radius: 12px; text-align: center; }
        .metric-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: 800; color: #1E252B; }
        .metric-value.occupied { color: #2E7D32; }
        .metric-value.available { color: #76ABAE; }

        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background-color: #1E252B; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #334155; }
        tr:nth-child(even) td { background-color: #F8FAFC; }
        .tenant-name { font-weight: 600; color: #1E293B; }
        .empty-row { text-align: center; color: #94A3B8; padding: 24px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">
          <h1>RentLedger Tenant and Property Report</h1>
          <p>Official Landlord Rental Account Statement</p>
        </div>
        <div class="date-badge">Generated: ${dateString}</div>
      </div>

      <div class="section-title">Report Summary Section</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Properties</div>
          <div class="metric-value">${metrics.totalProperties}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Occupied Units</div>
          <div class="metric-value occupied">${metrics.occupiedUnits}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Available Units</div>
          <div class="metric-value available">${metrics.availableUnits}</div>
        </div>
      </div>

      <div class="section-title">Tenant Information Table</div>
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Contact Number</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          ${
            tenantsList.length
              ? tenantsList
                  .map((t) => {
                    return `
                  <tr>
                    <td class="tenant-name">${t.full_name || "Unknown Tenant"}</td>
                    <td>${t.contact_number || "—"}</td>
                    <td>${t.address || "—"}</td>
                  </tr>
                `;
                  })
                  .join("")
              : `<tr><td colspan="3" class="empty-row">No active records registered in the database.</td></tr>`
          }
        </tbody>
      </table>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "RentLedger_Tenant_Property_Report",
    });
  }
}