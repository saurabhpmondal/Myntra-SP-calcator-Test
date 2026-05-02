// js/export.js

import { showToast } from "./config.js";
import { getVisibleRows } from "./table.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initExport() {
  const btn =
    document.getElementById("exportBtn");

  btn?.addEventListener(
    "click",
    exportVisibleTable
  );
}

/* ----------------------------------
   EXPORT
-----------------------------------*/
function exportVisibleTable() {
  const rows =
    getVisibleRows();

  if (!rows.length) {
    showToast("No data to export");
    return;
  }

  const data = [];

  /* Rebate removed */
  data.push([
    "ERP SKU",
    "Style ID",
    "Brand",
    "Article",
    "Status",
    "MRP",
    "SP",
    "GT Charge",
    "List Price",
    "Com %",
    "Com Rs",
    "Fixed Fee",
    "Tax on Com+Fixed",
    "Upload Settlement",
    "TDS+TCS",
    "Bank Settlement",
    "Royalty",
    "Marketing",
    "Payout Before CODB",
    "Dispatch Cost",
    "Return Charge",
    "Return Cost",
    "RTV %",
    "RTV CODB",
    "Payout After CODB",
    "TP",
    "TP Profit Rs",
    "TP Profit %"
  ]);

  rows.forEach(r => {
    data.push([
      r.erpSku,
      r.styleId,
      r.brand,
      r.articleType,
      r.status,

      fix(r.mrp),
      fix(r.sp),
      fix(r.gta),
      fix(r.listPrice),

      fix(r.commissionPct),
      fix(r.commissionRs),
      fix(r.fixedFee),
      fix(r.taxOnComFixed),

      fix(r.uploadSettlement),
      fix(r.tdsTcs),
      fix(r.bankSettlement),

      fix(r.royalty),
      fix(r.marketing),

      fix(r.payoutBeforeCodb),

      fix(r.dispatchCost),
      fix(r.returnCharge),
      fix(r.returnCost),

      fix(r.rtvPct),
      fix(r.rtvCodb),

      fix(r.payoutAfterCodb),

      fix(r.tp),
      fix(r.tpProfitRs),
      fix(r.tpProfitPct)
    ]);
  });

  downloadCsv(
    toCsv(data),
    fileName()
  );

  showToast("CSV exported");
}

/* ----------------------------------
   HELPERS
-----------------------------------*/
function fix(v) {
  return Number(v || 0)
    .toFixed(2);
}

function toCsv(rows) {
  return rows
    .map(row =>
      row.map(esc).join(",")
    )
    .join("\n");
}

function esc(value) {
  const text =
    String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCsv(
  content,
  file
) {
  const blob = new Blob(
    [content],
    {
      type:
        "text/csv;charset=utf-8;"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = file;
  a.click();

  URL.revokeObjectURL(url);
}

function fileName() {
  const d = new Date();

  const y =
    d.getFullYear();

  const m =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      d.getDate()
    ).padStart(2, "0");

  return `myntra_pricing_master_${y}${m}${day}.csv`;
}