// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { renderPricingTable } from "./table.js";
import { renderBrandSummary } from "./brand-summary.js";
import { solvePrice } from "./pricing-engine.js";

import { STORE } from "./config.js";

let pricingLoaded = false;

/* INIT */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindTabs();
  bindControls();
  await refresh();
}

/* LOAD */
async function refresh() {
  const ok = await loadAllData();
  if (!ok) return;

  normalizeAllData();
  pricingLoaded = false;
}

/* CONTROLS */
function bindControls() {

  document.getElementById("generatePricingBtn")
    ?.addEventListener("click", () => {
      renderPricingTable();
      pricingLoaded = true;
    });

  document.getElementById("generateMrpBtn")
    ?.addEventListener("click", generateMrp);

  document.getElementById("verifyBtn")
    ?.addEventListener("click", verifyFile);
}

/* TABS */
function bindTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.tab;

      document.querySelectorAll(".tab-panel")
        .forEach(x => x.classList.remove("active"));

      document.getElementById(key + "Tab")
        ?.classList.add("active");

      if (key === "summary" && pricingLoaded) {
        renderBrandSummary();
      }
    };
  });
}

/* =========================
   MRP GENERATOR
========================= */

let uploadedData = [];

function verifyFile() {
  const file =
    document.getElementById("mrpFile").files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const rows = e.target.result.split("\n");

    uploadedData = rows.slice(1).map(r => {
      const [sku, brand, tp] = r.split(",");
      return { sku, brand, tp: Number(tp) };
    });

    document.getElementById("mrpPreview").innerHTML =
      `Loaded ${uploadedData.length} rows`;

    document.getElementById("generateMrpBtn").disabled = false;
  };

  reader.readAsText(file);
}

function generateMrp() {

  const target =
    Number(document.getElementById("mrpTarget").value);

  const discount =
    Number(document.getElementById("mrpDiscount").value);

  const output = [];

  uploadedData.forEach(r => {

    const product = {
      tp: r.tp,
      brand: r.brand,
      articleType: "Saree",
      styleId: "999",
      status: "Manual",
      mrp: 0
    };

    const calc = solvePrice(product, target);

    if (!calc) return;

    const mrp = calc.sp / (1 - discount);

    output.push({
      sku: r.sku,
      brand: r.brand,
      tp: r.tp,
      mrp: Math.round(mrp)
    });
  });

  downloadCsv(output);
}

function downloadCsv(rows) {
  const csv =
    "sku,brand,tp,mrp\n" +
    rows.map(r =>
      `${r.sku},${r.brand},${r.tp},${r.mrp}`
    ).join("\n");

  const blob = new Blob([csv]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "mrp-output.csv";
  a.click();
}