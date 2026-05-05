// js/bulk-mrp.js

import { solvePrice } from "./pricing-engine.js";
import { money, showToast } from "./config.js";

let rawData = [];
let verified = false;
let outputData = [];

export function initBulk() {
  bindEvents();
}

/* EVENTS */
function bindEvents() {
  document
    .getElementById("bulkFile")
    ?.addEventListener("change", handleFile);

  document
    .getElementById("verifyBtn")
    ?.addEventListener("click", verifyData);

  document
    .getElementById("generateBulkBtn")
    ?.addEventListener("click", generateMRP);

  document
    .getElementById("downloadBulkBtn")
    ?.addEventListener("click", downloadCSV);
}

/* FILE READ */
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = evt => {
    const text = evt.target.result;
    parseCSV(text);
  };

  reader.readAsText(file);
}

/* PARSE */
function parseCSV(text) {
  const rows = text.split("\n").map(r => r.trim()).filter(Boolean);

  const headers = rows[0].toLowerCase().split(",");

  const skuIdx = headers.indexOf("sku");
  const brandIdx = headers.indexOf("brand");
  const tpIdx = headers.indexOf("tp");

  if (skuIdx === -1 || brandIdx === -1 || tpIdx === -1) {
    alert("CSV must have: sku, brand, tp");
    return;
  }

  rawData = rows.slice(1).map(row => {
    const cols = row.split(",");

    return {
      sku: cols[skuIdx]?.trim(),
      brand: cols[brandIdx]?.trim(),
      tp: Number(cols[tpIdx])
    };
  });

  renderPreview();
  resetState();
}

/* PREVIEW */
function renderPreview() {
  const body = document.getElementById("bulkBody");

  if (!rawData.length) {
    body.innerHTML = `
      <tr><td colspan="3" class="center">No data</td></tr>
    `;
    return;
  }

  body.innerHTML = rawData.slice(0, 50).map(r => `
    <tr>
      <td>${r.sku}</td>
      <td>${r.brand}</td>
      <td>${r.tp}</td>
    </tr>
  `).join("");
}

/* VERIFY */
function verifyData() {
  let valid = true;

  rawData.forEach(r => {
    if (!r.sku || !r.brand || isNaN(r.tp)) {
      valid = false;
    }
  });

  if (!valid) {
    alert("Invalid data found. Fix CSV.");
    return;
  }

  verified = true;

  document.getElementById("generateBulkBtn").disabled = false;

  showToast("Data verified");
}

/* GENERATE */
async function generateMRP() {
  if (!verified) return;

  const margin = Number(
    document.getElementById("bulkMargin").value
  );

  const discount = Number(
    document.getElementById("bulkDiscount").value
  );

  const factor = 1 - discount / 100;

  outputData = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    const product = {
      brand: row.brand,
      articleType: "Saree",
      tp: row.tp,
      mrp: row.tp * 3,
      styleId: "BULK",
      status: "bulk"
    };

    const calc = solvePrice(product, margin);

    if (!calc) continue;

    const sp = calc.sp;

    const mrp = Math.round(sp / factor);

    outputData.push({
      sku: row.sku,
      brand: row.brand,
      tp: row.tp,
      mrp
    });

    if (i % 100 === 0) {
      await pause();
    }
  }

  document.getElementById("downloadBulkBtn").disabled = false;

  showToast("MRP Generated");
}

/* DOWNLOAD */
function downloadCSV() {
  let csv = "sku,brand,tp,mrp\n";

  outputData.forEach(r => {
    csv += `${r.sku},${r.brand},${r.tp},${r.mrp}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mrp_output.csv";
  a.click();
}

/* RESET */
function resetState() {
  verified = false;
  outputData = [];

  document.getElementById("generateBulkBtn").disabled = true;
  document.getElementById("downloadBulkBtn").disabled = true;
}

/* NON BLOCKING */
function pause() {
  return new Promise(res => setTimeout(res, 0));
}
