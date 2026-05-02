// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator } from "./calculator.js";
import { renderPricingTable } from "./table.js";
import { initExport } from "./export.js";

import {
  STORE,
  CONFIG
} from "./config.js";

import {
  renderBrandSummary
} from "./brand-summary.js";

/* ----------------------------------
   CACHE
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

  await refreshApp();
}

/* ----------------------------------
   REFRESH
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

  lastRenderKey = "";
  summaryRenderKey = "";

  /* fast first load:
     do not render heavy tabs now */
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
    rerenderAll
  );

  target?.addEventListener(
    "change",
    rerenderAll
  );

  mode?.addEventListener(
    "change",
    e => {
      const value =
        e.target.value ||
        "INT";

      CONFIG.ROUNDING.MODE =
        value;

      STORE.ui.pricingMode =
        value;

      rerenderAll();
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
   SMART RENDER
-----------------------------------*/
function rerenderAll() {
  STORE.ui.rowLimit = 50;

  lastRenderKey = "";
  summaryRenderKey = "";

  if (pricingLoaded) {
    renderPricingTable();
    lastRenderKey =
      getRenderKey();
  }

  if (
    summaryLoaded &&
    STORE.ui.activeTab ===
      "summary"
  ) {
    renderBrandSummary();
    summaryRenderKey =
      getRenderKey();
  }
}

function getRenderKey() {
  const brand =
    document.getElementById(
      "brandFilter"
    )?.value || "";

  const target =
    document.getElementById(
      "profitTarget"
    )?.value || "5";

  const mode =
    CONFIG.ROUNDING.MODE ||
    "INT";

  return [
    brand,
    target,
    mode
  ].join("|");
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
      sel.id ===
      "brandFilter"
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
          String(
            opt.value
          ) === "5"
            ? "selected"
            : "";

        return `
          <option
            value="${opt.value}"
            ${selected}
          >
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
   TABS
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
          .querySelectorAll(
            ".tab"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        document
          .querySelectorAll(
            ".tab-panel"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        btn.classList.add(
          "active"
        );

        document
          .getElementById(
            key + "Tab"
          )
          ?.classList.add(
            "active"
          );

        STORE.ui.activeTab =
          key;

        const renderKey =
          getRenderKey();

        /* Lazy pricing */
        if (
          key === "master"
        ) {
          if (
            !pricingLoaded ||
            lastRenderKey !==
              renderKey
          ) {
            renderPricingTable();

            pricingLoaded = true;
            lastRenderKey =
              renderKey;
          }
        }

        /* Lazy summary */
        if (
          key === "summary"
        ) {
          if (
            !summaryLoaded ||
            summaryRenderKey !==
              renderKey
          ) {
            renderBrandSummary();

            summaryLoaded = true;
            summaryRenderKey =
              renderKey;
          }
        }
      }
    );
  });
}