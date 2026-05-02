// js/config.js

export const CONFIG = {

  APP_NAME: "Myntra Reverse Pricing",
  VERSION: "4.1",

  SHEETS: {
    PRODUCT_MASTER:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=205952585&single=true&output=csv",

    COMMERCIALS:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1485611666&single=true&output=csv",

    GTA:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1842744296&single=true&output=csv",

    ORDERS:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=215964507&single=true&output=csv",

    RETURNS:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=898354467&single=true&output=csv"
  },

  TAX: {
    GST_PERCENT: 18,
    TDS_PERCENT: 0.5,
    TCS_PERCENT: 0.1
  },

  COSTS: {
    COLLECTION_FEE: 0,
    RETURN_CHARGE: 233,
    DEFAULT_RTV_PERCENT: 35
  },

  DISPATCH: {
    LOW_LIMIT: 500,
    HIGH_LIMIT: 1000,
    LOW_COST: 25,
    MID_COST: 30,
    HIGH_COST: 35
  },

  TARGET_OPTIONS: [
    { label: "TP +10%", value: 10 },
    { label: "TP +5%", value: 5 },
    { label: "TP +0%", value: 0 },
    { label: "TP -5%", value: -5 },
    { label: "TP -10%", value: -10 },
    { label: "TP -15%", value: -15 },
    { label: "BIG EVENT", value: "BIG_EVENT" }
  ],

  LIMITS: {
    MAX_SP_SEARCH: 10000,
    DEFAULT_ROWS: 100
  },

  ROUNDING: {
    MODE: "INT",
    END_DIGIT: 9
  }

};

/* ------------------------------ */
export const STORE = {
  raw: {
    productMaster: [],
    commercials: [],
    gta: [],
    orders: [],
    returns: []
  },

  normalized: {
    products: [],
    commercials: [],
    gta: [],
    rtvMap: {}
  },

  ui: {
    currentTarget: 5,
    searchText: "",
    rowLimit: 100,
    activeTab: "calculator",
    pricingMode: "INT"
  },

  meta: {
    loaded: false,
    loadTime: null
  }
};

/* helpers */
export function money(value) {
  return Number(value || 0).toFixed(2);
}

export function num(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) return 0;

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function text(value) {
  return String(value || "").trim();
}

export function nowTime() {
  const d = new Date();

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function showToast(
  message = "Done"
) {
  const el =
    document.getElementById(
      "toast"
    );

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(
    window.__toastTimer
  );

  window.__toastTimer =
    setTimeout(() => {
      el.classList.remove("show");
    }, 1800);
}