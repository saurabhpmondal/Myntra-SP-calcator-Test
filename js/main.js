import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { renderPricingTable } from "./table.js";
import { renderBrandSummary } from "./brand-summary.js";
import { solvePrice } from "./pricing-engine.js";
import { STORE, CONFIG } from "./config.js";

let pricingLoaded = false;

let uploadedData = [];
let generatedOutput = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindTabs();
  bindControls();

  await loadAllData();
  normalizeAllData();
}

/* ---------------- TABS FIX ---------------- */
function bindTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {

      tabs.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-panel")
        .forEach(p => p.classList.remove("active"));

      document.getElementById(btn.dataset.tab + "Tab")
        ?.classList.add("active");

      if (btn.dataset.tab === "summary" && pricingLoaded) {
        renderBrandSummary();
      }
    });
  });
}

/* ---------------- CONTROLS ---------------- */
function bindControls() {

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

  document.getElementById("mrpFile")
    ?.addEventListener("change", handleUpload);

  document.getElementById("generateMrpBtn")
    ?.addEventListener("click", generateMrp);

  document.getElementById("downloadMrpBtn")
    ?.addEventListener("click", downloadCsv);
}

/* ---------------- UPLOAD ---------------- */
function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = ev => {
    const rows = ev.target.result.split("\n");

    uploadedData = rows.slice(1).map(r => {
      const [sku, brand, tp] = r.split(",");
      return {
        sku: (sku || "").trim(),
        brand: (brand || "").trim(),
        tp: Number(tp || 0)
      };
    }).filter(x => x.sku && x.tp);

    renderPreview(uploadedData);

    generatedOutput = [];
    document.getElementById("downloadMrpBtn").disabled = true;
  };

  reader.readAsText(file);
}

/* ---------------- PREVIEW ---------------- */
function renderPreview(data) {
  const body = document.getElementById("mrpPreviewBody");

  if (!data.length) {
    body.innerHTML = `<tr><td colspan="3">No data</td></tr>`;
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

/* ---------------- GENERATE ---------------- */
function generateMrp() {

  const target =
    Number(document.getElementById("mrpTarget").value);

  const discount =
    Number(document.getElementById("mrpDiscount").value);

  generatedOutput = [];

  uploadedData.forEach(r => {

    const product = {
      tp: r.tp,
      brand: r.brand,
      articleType: "Saree",
      styleId: "999",
      status: "Manual"
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

/* ---------------- DOWNLOAD ---------------- */
function downloadCsv() {

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