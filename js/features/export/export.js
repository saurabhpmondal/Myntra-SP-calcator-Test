// js/features/export/export.js

import { showToast } from "../../core/config.js";
import { getVisibleRows } from "../pricing/table.js";

export function initExport() {
  const btn = document.getElementById("exportBtn");

  btn?.addEventListener("click", exportVisibleTable);
}

function exportVisibleTable() {
  const rows = getVisibleRows();

  if (!rows.length) {
    showToast("No data to export");
    return;
  }

  const data = [];

  data.push([
    "ERP SKU","Style ID","Brand","Article","Status",
    "MRP","SP","GT Charge","List Price",
    "Com %","Com Rs","Fixed Fee","Tax",
    "Upload Settlement","TDS+TCS","Bank Settlement",
    "Royalty","Marketing","Payout Before CODB",
    "Dispatch","Return Charge","Return Cost",
    "RTV %","RTV CODB","Payout After CODB",
    "TP","Profit Rs","Profit %"
  ]);

  rows.forEach(r => {
    data.push([
      r.erpSku,r.styleId,r.brand,r.articleType,r.status,
      r.mrp,r.sp,r.gta,r.listPrice,
      r.commissionPct,r.commissionRs,r.fixedFee,r.taxOnComFixed,
      r.uploadSettlement,r.tdsTcs,r.bankSettlement,
      r.royalty,r.marketing,r.payoutBeforeCodb,
      r.dispatchCost,r.returnCharge,r.returnCost,
      r.rtvPct,r.rtvCodb,r.payoutAfterCodb,
      r.tp,r.tpProfitRs,r.tpProfitPct
    ]);
  });

  const csv = data.map(r => r.join(",")).join("\n");

  const blob = new Blob([csv]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "pricing.csv";
  a.click();

  showToast("CSV exported");
}