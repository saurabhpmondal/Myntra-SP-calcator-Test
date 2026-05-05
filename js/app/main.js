// js/app/main.js

import { loadAllData } from "../core/data-loader.js";
import { normalizeAllData } from "../core/normalizer.js";

import { initCalculator } from "../features/calculator/calculator.js";
import { renderPricingTable } from "../features/pricing/table.js";
import { initExport } from "../features/export/export.js";
import { renderBrandSummary } from "../features/summary/brand-summary.js";
import { initMrpEngine } from "../features/mrp/bulk-mrp.js";

import { STORE, CONFIG } from "../core/config.js";

/* ----------------------------------
   STATE
-----------------------------------*/
let lastRenderKey = "";
let summaryRenderKey = "";
let pricingLoaded = false;
let summaryLoaded = false;

/* ----------------------------------
   INIT
-----------------------------------*/
document.addEventListener(
  "DOMContentLoaded",
  initApp
);

async function initApp() {
  bindTabs();
  bindControls();

  initCalculator();
  initExport();

  /* ✅ CRITICAL FIX */
  initMrpEngine();

  await refreshApp();
}

/* ----------------------------------
   REFRESH
-----------------------------------*/
async function refreshApp() {
  const ok = await loadAllData();
  if (!ok) return;

  normalizeAllData();

  fillBrands();
  fillTargets();
  syncPricingModeUi();

  STORE.ui.rowLimit = 50;

  pricingLoaded = false;
  summaryLoaded = false;

  lastRenderKey = "";
  summaryRenderKey = "";
}

/* ----------------------------------
   CONTROLS
-----------------------------------*/
function bindControls() {

  document.getElementById("refreshBtn")
    ?.addEventListener("click", refreshApp);

  document.getElementById("brandFilter")
    ?.addEventListener("change", rerenderAll);

  document.getElementById("profitTarget")
    ?.addEventListener("change", rerenderAll);

  document.getElementById("pricingMode")
    ?.addEventListener("change", e => {
      const value = e.target.value || "INT";

      CONFIG.ROUNDING.MODE = value;
      STORE.ui.pricingMode = value;

      rerenderAll();
    });

  document.getElementById("loadMoreBtn")
    ?.addEventListener("click", () => {
      STORE.ui.rowLimit += 50;
      renderPricingTable();
    });

  /* ✅ GENERATE PRICING BUTTON */
  document.getElementById("generatePricingBtn")
    ?.addEventListener("click", () => {
      STORE.ui.rowLimit = 50;

      renderPricingTable();

      pricingLoaded = true;
      lastRenderKey = getRenderKey();
    });
}

/* ----------------------------------
   RERENDER
-----------------------------------*/
function rerenderAll() {
  STORE.ui.rowLimit = 50;

  lastRenderKey = "";
  summaryRenderKey = "";

  if (pricingLoaded) {
    renderPricingTable();
    lastRenderKey = getRenderKey();
  }

  if (
    summaryLoaded &&
    STORE.ui.activeTab === "summary"
  ) {
    renderBrandSummary();
    summaryRenderKey = getRenderKey();
  }
}

function getRenderKey() {
  const brand =
    document.getElementById("brandFilter")?.value || "";

  const target =
    document.getElementById("profitTarget")?.value || "5";

  const mode =
    CONFIG.ROUNDING.MODE || "INT";

  return [brand, target, mode].join("|");
}

/* ----------------------------------
   DROPDOWNS
-----------------------------------*/
function fillBrands() {
  const brands = [
    ...new Set(
      STORE.normalized.products.map(x => x.brand)
    )
  ]
    .filter(Boolean)
    .sort();

  const brandFilter =
    document.getElementById("brandFilter");

  const manualBrand =
    document.getElementById("manualBrand");

  if (brandFilter) {
    brandFilter.innerHTML =
      `<option value="">All Brands</option>` +
      brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  if (manualBrand) {
    manualBrand.innerHTML =
      `<option value="">Select Brand</option>` +
      brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }
}

function fillTargets() {
  const el = document.getElementById("profitTarget");
  if (!el) return;

  el.innerHTML =
    CONFIG.TARGET_OPTIONS.map(opt => {
      const selected =
        String(opt.value) === "5" ? "selected" : "";

      return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
    }).join("");
}

function syncPricingModeUi() {
  const mode =
    document.getElementById("pricingMode");

  if (!mode) return;

  const current =
    STORE.ui.pricingMode ||
    CONFIG.ROUNDING.MODE ||
    "INT";

  mode.value = current;
  CONFIG.ROUNDING.MODE = current;
}

/* ----------------------------------
   TABS
-----------------------------------*/
function bindTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.tab;

      document.querySelectorAll(".tab")
        .forEach(x => x.classList.remove("active"));

      document.querySelectorAll(".tab-panel")
        .forEach(x => x.classList.remove("active"));

      btn.classList.add("active");

      document.getElementById(key + "Tab")
        ?.classList.add("active");

      STORE.ui.activeTab = key;

      const renderKey = getRenderKey();

      if (key === "summary") {
        if (!summaryLoaded || summaryRenderKey !== renderKey) {
          renderBrandSummary();
          summaryLoaded = true;
          summaryRenderKey = renderKey;
        }
      }
    });
  });
}