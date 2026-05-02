// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator } from "./calculator.js";
import { renderPricingTable } from "./table.js";
import { initExport } from "./export.js";

import { STORE, CONFIG } from "./config.js";
import { renderBrandSummary } from "./brand-summary.js";

let pricingLoaded = false;
let summaryLoaded = false;

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  bindTabs();
  bindControls();
  initCalculator();
  initExport();

  await refreshApp();
}

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

  setMasterMessage("Click Generate Pricing");
  setSummaryMessage("Run pricing first");
}

/* ---------------- CONTROLS ---------------- */
function bindControls() {
  document
    .getElementById("refreshBtn")
    ?.addEventListener("click", refreshApp);

  document
    .getElementById("brandFilter")
    ?.addEventListener("change", rerender);

  document
    .getElementById("profitTarget")
    ?.addEventListener("change", rerender);

  document
    .getElementById("pricingMode")
    ?.addEventListener("change", e => {
      CONFIG.ROUNDING.MODE = e.target.value;
      rerender();
    });

  document
    .getElementById("generatePricingBtn")
    ?.addEventListener("click", () => {
      STORE.ui.rowLimit = 50;
      renderPricingTable();
      pricingLoaded = true;
      summaryLoaded = false;
    });

  document
    .getElementById("loadMoreBtn")
    ?.addEventListener("click", () => {
      STORE.ui.rowLimit += 50;
      renderPricingTable();
    });
}

function rerender() {
  if (!pricingLoaded) return;

  STORE.ui.rowLimit = 50;
  renderPricingTable();
  summaryLoaded = false;
}

/* ---------------- TABS ---------------- */
function bindTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
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

      if (key === "summary") {
        if (!pricingLoaded) {
          setSummaryMessage("Run pricing first");
          return;
        }

        if (!summaryLoaded) {
          renderBrandSummary();
          summaryLoaded = true;
        }
      }
    });
  });
}

/* ---------------- DROPDOWNS ---------------- */
function fillBrands() {
  const brands = [
    ...new Set(
      STORE.normalized.products.map(x => x.brand)
    )
  ].sort();

  const el = document.getElementById("brandFilter");

  if (el) {
    el.innerHTML =
      `<option value="">All Brands</option>` +
      brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  const manual = document.getElementById("manualBrand");

  if (manual) {
    manual.innerHTML =
      `<option value="">Select Brand</option>` +
      brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }
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
      )
      .join("");
}

function syncPricingModeUi() {
  const el = document.getElementById("pricingMode");
  if (!el) return;

  el.value = CONFIG.ROUNDING.MODE || "INT";
}

/* ---------------- UI ---------------- */
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