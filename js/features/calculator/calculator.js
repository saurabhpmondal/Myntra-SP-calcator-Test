// js/features/calculator/calculator.js

import {
  money,
  showToast
} from "../../core/config.js";

import {
  getProductByStyle,
  getProductBySku,
  getBrandArticleType
} from "../../core/normalizer.js";

import {
  solvePrice,
  evaluatePrice
} from "../../engine/pricing-engine.js";

/* ---------------------------------- */
export function initCalculator() {
  bindSearch();
  bindManual();
}

/* ---------------------------------- */
function bindSearch() {
  const btn = document.getElementById("calcBtn");
  const clr = document.getElementById("clearCalcBtn");
  const input = document.getElementById("calcStyleId");

  btn?.addEventListener("click", runCalculation);
  clr?.addEventListener("click", clearSearch);

  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") runCalculation();
  });
}

function runCalculation() {
  const query =
    document.getElementById("calcStyleId")?.value.trim();

  const target =
    Number(document.getElementById("profitTarget")?.value || 5);

  if (!query) {
    renderSearch("Enter Style ID or ERP SKU.");
    return;
  }

  let product = null;

  if (/^\d+$/.test(query)) {
    product = getProductByStyle(query);
  }

  if (!product) {
    product = getProductBySku(query);
  }

  if (!product) {
    renderSearch("No style found.");
    return;
  }

  const r = solvePrice(product, target);

  if (!r) {
    renderSearch("No result found.");
    return;
  }

  renderSearchBlock(r);
  showToast("Search done");
}

function clearSearch() {
  const el = document.getElementById("calcStyleId");
  if (el) el.value = "";

  renderSearch("Search style and view pricing.");
}

function renderSearch(msg) {
  const el = document.getElementById("calcOutput");
  if (!el) return;

  el.innerHTML = `<div class="empty-box">${msg}</div>`;
}

function renderSearchBlock(r) {
  const el = document.getElementById("calcOutput");
  if (!el) return;

  el.innerHTML = `
    <div class="result-box">
      SP: ₹${money(r.sp)} |
      TP: ₹${money(r.tp)} |
      Profit: ₹${money(r.tpProfitRs)}
    </div>
  `;
}

/* ---------------------------------- */
function bindManual() {
  const btn = document.getElementById("manualCalcBtn");

  btn?.addEventListener("click", () => {
    showToast("Manual calc working");
  });
}