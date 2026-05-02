// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator } from "./calculator.js";
import { renderPricingTable } from "./table.js";
import { initExport } from "./export.js";
import { renderBrandSummary } from "./brand-summary.js";
import { solvePrice } from "./pricing-engine.js";
import { STORE, CONFIG } from "./config.js";

/* ---------------------------------- */
let pricingLoaded = false;

/* MRP STATE */
let uploadedData = [];
let generatedOutput = [];

/* ---------------------------------- */
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  bindTabs();
  bindControls();
  initCalculator();
  initExport();

  await refreshApp();
}

/* ---------------------------------- */
async function refreshApp() {
  const ok = await loadAllData();
  if (!ok) return;

  normalizeAllData();

  fillBrands();
  fillTargets();
  syncPricingModeUi();

  STORE.ui.rowLimit = 50;

  pricingLoaded = false;

  setMasterMessage("Click Generate Pricing");
  setSummaryMessage("Run pricing first");
}

/* ---------------------------------- */
function bindControls() {

  document.getElementById("refreshBtn")
    ?.addEventListener("click", refreshApp);

  document.getElementById("generatePricingBtn")
    ?.addEventListener("click", () => {
      renderPricingTable();
      pricingLoaded = true;
    });

  document.getElementById("loadMoreBtn")
    ?.addEventListener("click", () => {
      STORE.ui.rowLimit += 50;
      renderPricingTable();
    });

  /* FILE UPLOAD → PREVIEW */
  document.getElementById("mrpFile")
    ?.addEventListener("change", handleFileUpload);

  /* GENERATE (VERIFY + GENERATE) */
  document.getElementById("generateMrpBtn")
    ?.addEventListener("click", generateMrp);

  /* DOWNLOAD */
  document.getElementById("downloadMrpBtn")
    ?.addEventListener("click", downloadMrp);
}

/* ---------------------------------- */
/* TABS */
function bindTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {

      const key = btn.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-panel")
        .forEach(x => x.classList.remove("active"));

      document.getElementById(key + "Tab")
        ?.classList.add("active");

      STORE.ui.activeTab = key;

      if (key === "summary" && pricingLoaded) {
        renderBrandSummary();
      }
    });
  });
}

/* ---------------------------------- */
/* PREVIEW */
function handleFileUpload(e) {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = ev => {

    const rows = ev.target.result.split("\n");

    uploadedData = rows.slice(1)
      .map(r => {
        const [sku, brand, tp] = r.split(",");
        return {
          sku: (sku || "").trim(),
          brand: (brand || "").trim(),
          tp: Number(tp || 0)
        };
      })
      .filter(x => x.sku && x.tp);

    renderPreview(uploadedData);

    /* reset states */
    generatedOutput = [];
    document.getElementById("downloadMrpBtn").disabled = true;
  };

  reader.readAsText(file);
}

/* ---------------------------------- */
function renderPreview(data) {

  const body = document.getElementById("mrpPreviewBody");
  if (!body) return;

  if (!data.length) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="center">
          No valid rows
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = data.map(r => `
    <tr>
      <td>${r.sku}</td>
      <td>${r.brand}</td>
      <td>${r.tp}</td>
    </tr>
  `).join("");
}

/* ---------------------------------- */
/* GENERATE */
function generateMrp() {

  if (!uploadedData.length) return;

  const target =
    Number(document.getElementById("mrpTarget")?.value || 5);

  const discount =
    Number(document.getElementById("mrpDiscount")?.value || 0.6);

  generatedOutput = [];

  uploadedData.forEach(r => {

    const product = {
      tp: r.tp,
      brand: r.brand,
      articleType: "Saree",
      styleId: "999999",
      status: "Manual",
      mrp: 0
    };

    const calc = solvePrice(product, target);
    if (!calc) return;

    const mrp = calc.sp / (1 - discount);

    generatedOutput.push({
      sku: r.sku,
      brand: r.brand,
      tp: r.tp,
      mrp: Math.round(mrp)
    });
  });

  document.getElementById("downloadMrpBtn").disabled = false;
}

/* ---------------------------------- */
/* DOWNLOAD */
function downloadMrp() {

  if (!generatedOutput.length) return;

  const csv =
    "sku,brand,tp,mrp\n" +
    generatedOutput.map(r =>
      `${r.sku},${r.brand},${r.tp},${r.mrp}`
    ).join("\n");

  const blob = new Blob([csv]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "mrp-output.csv";
  a.click();
}

/* ---------------------------------- */
function fillBrands() {
  const brands = [
    ...new Set(STORE.normalized.products.map(x => x.brand))
  ].sort();

  const el = document.getElementById("brandFilter");
  if (!el) return;

  el.innerHTML =
    `<option value="">All Brands</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");
}

function fillTargets() {
  const el = document.getElementById("profitTarget");
  if (!el) return;

  el.innerHTML =
    CONFIG.TARGET_OPTIONS
      .map(opt =>
        `<option value="${opt.value}" ${opt.value === 5 ? "selected" : ""}>
          ${opt.label}
        </option>`
      ).join("");
}

function syncPricingModeUi() {
  const el = document.getElementById("pricingMode");
  if (!el) return;

  el.value = CONFIG.ROUNDING.MODE || "INT";
}

function setMasterMessage(msg) {
  const body = document.getElementById("pricingBody");
  if (!body) return;

  body.innerHTML =
    `<tr><td colspan="30" class="center">${msg}</td></tr>`;
}

function setSummaryMessage(msg) {
  const body = document.getElementById("summaryBody");
  if (!body) return;

  body.innerHTML =
    `<tr><td colspan="5" class="center">${msg}</td></tr>`;
}