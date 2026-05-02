// js/calculator.js

import {
  money,
  showToast
} from "./config.js";

import {
  getProductByStyle,
  getProductBySku,
  getBrandArticleType
} from "./normalizer.js";

import {
  solvePrice,
  evaluatePrice
} from "./pricing-engine.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initCalculator() {
  bindSearch();
  bindManual();
}

/* ----------------------------------
   SEARCH
-----------------------------------*/
function bindSearch() {
  const btn =
    document.getElementById(
      "calcBtn"
    );

  const clr =
    document.getElementById(
      "clearCalcBtn"
    );

  const input =
    document.getElementById(
      "calcStyleId"
    );

  btn?.addEventListener(
    "click",
    runCalculation
  );

  clr?.addEventListener(
    "click",
    clearSearch
  );

  input?.addEventListener(
    "keydown",
    e => {
      if (e.key === "Enter") {
        runCalculation();
      }
    }
  );
}

export function runCalculation() {
  const query =
    document.getElementById(
      "calcStyleId"
    )?.value.trim();

  const target =
    Number(
      document.getElementById(
        "profitTarget"
      )?.value || 5
    );

  if (!query) {
    renderSearch(
      "Enter Style ID or ERP SKU."
    );
    return;
  }

  let product = null;

  if (/^\d+$/.test(query)) {
    product =
      getProductByStyle(
        query
      );
  }

  if (!product) {
    product =
      getProductBySku(
        query
      );
  }

  if (!product) {
    renderSearch(
      "No style found."
    );
    return;
  }

  const r =
    solvePrice(
      product,
      target
    );

  if (!r) {
    renderSearch(
      "No result found."
    );
    return;
  }

  r.erpSku =
    product.erpSku || "";

  r.styleId =
    product.styleId || "";

  r.brand =
    product.brand || "";

  r.articleType =
    product.articleType ||
    "";

  renderSearchBlock(r);

  showToast(
    "Search done"
  );
}

function clearSearch() {
  const el =
    document.getElementById(
      "calcStyleId"
    );

  if (el) el.value = "";

  renderSearch(
    "Search style and view pricing."
  );
}

function renderSearch(msg) {
  const el =
    document.getElementById(
      "calcOutput"
    );

  if (!el) return;

  el.innerHTML =
    `<div class="empty-box">${msg}</div>`;
}

function renderSearchBlock(
  r
) {
  const el =
    document.getElementById(
      "calcOutput"
    );

  if (!el) return;

  el.innerHTML =
    fullResultHtml(
      r,
      true
    );
}

/* ----------------------------------
   MANUAL
-----------------------------------*/
function bindManual() {
  const mode =
    document.getElementById(
      "manualMode"
    );

  const btn =
    document.getElementById(
      "manualCalcBtn"
    );

  mode?.addEventListener(
    "change",
    updateLabel
  );

  btn?.addEventListener(
    "click",
    runManualCalc
  );

  updateLabel();
}

function updateLabel() {
  const mode =
    document.getElementById(
      "manualMode"
    )?.value;

  const label =
    document.getElementById(
      "manualInputLabel"
    );

  if (!label) return;

  label.textContent =
    mode === "tp"
      ? "TP Value"
      : "SP Value";
}

function runManualCalc() {
  const mode =
    document.getElementById(
      "manualMode"
    )?.value;

  const brand =
    document.getElementById(
      "manualBrand"
    )?.value;

  const value =
    Number(
      document.getElementById(
        "manualInput"
      )?.value || 0
    );

  if (!brand || !value) {
    renderManual(
      "Enter all inputs."
    );
    return;
  }

  const articleType =
    getBrandArticleType(
      brand
    );

  const product = {
    erpSku: "MANUAL",
    styleId: "999999999",
    brand,
    articleType,
    status: "Manual",
    mrp: value * 3,
    tp:
      mode === "tp"
        ? value
        : 0
  };

  let result = null;

  if (mode === "tp") {
    result =
      solvePrice(
        product,
        5
      );
  } else {
    result =
      evaluatePrice(
        product,
        value
      );

    result.tp =
      result.payoutAfterCodb;

    result.tpProfitRs = 0;
    result.tpProfitPct = 0;
  }

  if (!result) {
    renderManual(
      "No result found."
    );
    return;
  }

  renderManualBlock(
    result
  );

  showToast(
    "Calculated"
  );
}

function renderManual(msg) {
  const el =
    document.getElementById(
      "manualOutput"
    );

  if (!el) return;

  el.innerHTML =
    `<div class="empty-box">${msg}</div>`;
}

function renderManualBlock(
  r
) {
  const el =
    document.getElementById(
      "manualOutput"
    );

  if (!el) return;

  el.innerHTML =
    fullResultHtml(
      r,
      false
    );
}

/* ----------------------------------
   OLD PREMIUM TABLE FORMAT
-----------------------------------*/
function fullResultHtml(
  r,
  isSearch
) {
  const cls =
    r.tpProfitRs >= 0
      ? "success"
      : "danger";

  let meta = "";

  if (isSearch) {
    meta = `
      ${lineText("ERP SKU", r.erpSku)}
      ${lineText("Style ID", r.styleId)}
      ${lineText("Brand", r.brand)}
      ${lineText("Article", r.articleType)}
    `;
  }

  return `
    <div class="result-grid">

      <div class="result-box">
        <div class="result-label">SP</div>
        <div class="result-value">
          ₹${money(r.sp)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">TP</div>
        <div class="result-value">
          ₹${money(r.tp)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">Profit Rs</div>
        <div class="result-value ${cls}">
          ₹${money(r.tpProfitRs)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">Profit %</div>
        <div class="result-value ${cls}">
          ${money(r.tpProfitPct)}%
        </div>
      </div>

    </div>

    <div class="breakdown">

      ${meta}

      ${line("GT Charge", r.gta)}
      ${line("List Price", r.listPrice)}

      ${line("Commission %", r.commissionPct)}
      ${line("Commission Rs", r.commissionRs)}
      ${line("Fixed Fee", r.fixedFee)}
      ${line("Tax", r.taxOnComFixed)}

      ${line("Upload Settlement", r.uploadSettlement)}
      ${line("TDS + TCS", r.tdsTcs)}
      ${line("Bank Settlement", r.bankSettlement)}

      ${line("Royalty", r.royalty)}
      ${line("Marketing", r.marketing)}

      ${line("Payout Before CODB", r.payoutBeforeCodb)}

      ${line("Dispatch", r.dispatchCost)}
      ${line("Return Charge", r.returnCharge)}
      ${line("Return Cost", r.returnCost)}

      ${line("RTV %", r.rtvPct)}
      ${line("RTV CODB", r.rtvCodb)}

      ${line("Payout After CODB", r.payoutAfterCodb)}

    </div>
  `;
}

function line(
  label,
  value
) {
  return `
    <div class="break-row">
      <div>${label}</div>
      <div class="right">
        ${money(value)}
      </div>
    </div>
  `;
}

function lineText(
  label,
  value
) {
  return `
    <div class="break-row">
      <div>${label}</div>
      <div class="right">
        ${value || ""}
      </div>
    </div>
  `;
}