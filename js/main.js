// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator } from "./calculator.js";
import { renderPricingTable } from "./table.js";
import { initExport } from "./export.js";
import { initBulk } from "./bulk-mrp.js";

import {
  STORE,
  CONFIG
} from "./config.js";

import {
  renderBrandSummary
} from "./brand-summary.js";

/* ----------------------------------
   STATE
-----------------------------------*/
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
  initBulk();

  await refreshApp();
}

/* ----------------------------------
   REFRESH (FAST LOAD)
-----------------------------------*/
async function refreshApp() {
  const ok =
    await loadAllData();

  if (!ok) return;

  normalizeAllData();

  fillBrands();
  fillTargets();
  syncPricingModeUi();

  STORE.ui.rowLimit = 50;

  pricingLoaded = false;
  summaryLoaded = false;

  setMasterMessage(
    "Click Generate Pricing"
  );

  setSummaryMessage(
    "Run pricing first"
  );
}

/* ----------------------------------
   CONTROLS
-----------------------------------*/
function bindControls() {
  const refresh =
    document.getElementById(
      "refreshBtn"
    );

  const brand =
    document.getElementById(
      "brandFilter"
    );

  const target =
    document.getElementById(
      "profitTarget"
    );

  const mode =
    document.getElementById(
      "pricingMode"
    );

  const loadMore =
    document.getElementById(
      "loadMoreBtn"
    );

  refresh?.addEventListener(
    "click",
    refreshApp
  );

  brand?.addEventListener(
    "change",
    rerenderPricingIfLoaded
  );

  target?.addEventListener(
    "change",
    rerenderPricingIfLoaded
  );

  mode?.addEventListener(
    "change",
    e => {
      const value =
        e.target.value || "INT";

      CONFIG.ROUNDING.MODE =
        value;

      STORE.ui.pricingMode =
        value;

      rerenderPricingIfLoaded();
    }
  );

  loadMore?.addEventListener(
    "click",
    () => {
      STORE.ui.rowLimit += 50;

      renderPricingTable();
    }
  );
}

/* ----------------------------------
   SAFE RERENDER
-----------------------------------*/
function rerenderPricingIfLoaded() {
  if (!pricingLoaded) return;

  STORE.ui.rowLimit = 50;

  renderPricingTable();

  summaryLoaded = false;
}

/* ----------------------------------
   TAB SYSTEM (LAZY LOAD)
-----------------------------------*/
function bindTabs() {
  const tabs =
    document.querySelectorAll(
      ".tab"
    );

  tabs.forEach(btn => {
    btn.addEventListener(
      "click",
      () => {
        const key =
          btn.dataset.tab;

        document
          .querySelectorAll(".tab")
          .forEach(x =>
            x.classList.remove("active")
          );

        document
          .querySelectorAll(".tab-panel")
          .forEach(x =>
            x.classList.remove("active")
          );

        btn.classList.add("active");

        document
          .getElementById(
            key + "Tab"
          )
          ?.classList.add("active");

        STORE.ui.activeTab = key;

        /* -------- MASTER TAB -------- */
        if (key === "master") {
          if (!pricingLoaded) {
            renderPricingTable();
            pricingLoaded = true;
          }
        }

        /* -------- SUMMARY TAB -------- */
        if (key === "summary") {
          if (!pricingLoaded) {
            setSummaryMessage(
              "Run pricing first"
            );
            return;
          }

          if (!summaryLoaded) {
            renderBrandSummary();
            summaryLoaded = true;
          }
        }

        /* -------- BULK TAB -------- */
        if (key === "bulk") {
          // no auto execution
          // user controls flow
        }
      }
    );
  });
}

/* ----------------------------------
   DROPDOWNS
-----------------------------------*/
function fillBrands() {
  const brands = [
    ...new Set(
      STORE.normalized.products.map(
        x => x.brand
      )
    )
  ].sort();

  const selects = [
    document.getElementById(
      "brandFilter"
    ),
    document.getElementById(
      "manualBrand"
    )
  ];

  selects.forEach(sel => {
    if (!sel) return;

    const first =
      sel.id === "brandFilter"
        ? `<option value="">All Brands</option>`
        : `<option value="">Select Brand</option>`;

    sel.innerHTML =
      first +
      brands
        .map(
          b =>
            `<option value="${b}">${b}</option>`
        )
        .join("");
  });
}

function fillTargets() {
  const el =
    document.getElementById(
      "profitTarget"
    );

  if (!el) return;

  el.innerHTML =
    CONFIG.TARGET_OPTIONS
      .map(opt => {
        const selected =
          String(opt.value) === "5"
            ? "selected"
            : "";

        return `
          <option value="${opt.value}" ${selected}>
            ${opt.label}
          </option>
        `;
      })
      .join("");
}

function syncPricingModeUi() {
  const mode =
    document.getElementById(
      "pricingMode"
    );

  if (!mode) return;

  const current =
    STORE.ui.pricingMode ||
    CONFIG.ROUNDING.MODE ||
    "INT";

  mode.value = current;

  CONFIG.ROUNDING.MODE =
    current;
}

/* ----------------------------------
   UI HELPERS
-----------------------------------*/
function setMasterMessage(msg) {
  const body =
    document.getElementById(
      "pricingBody"
    );

  if (!body) return;

  body.innerHTML = `
    <tr>
      <td colspan="30" class="center">
        ${msg}
      </td>
    </tr>
  `;
}

function setSummaryMessage(msg) {
  const body =
    document.getElementById(
      "summaryBody"
    );

  if (!body) return;

  body.innerHTML = `
    <tr>
      <td colspan="5" class="center">
        ${msg}
      </td>
    </tr>
  `;
}