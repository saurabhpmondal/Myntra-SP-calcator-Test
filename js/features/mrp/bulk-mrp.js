// js/features/mrp/bulk-mrp.js

import { solvePrice } from "../../engine/pricing-engine.js";

let uploadedData = [];
let generatedOutput = [];

export function initMrpEngine() {

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
    const rows = ev.target.result
      .split("\n")
      .map(r => r.replace(/\r/g, "").trim())
      .filter(Boolean);

    uploadedData = rows.slice(1).map(r => {
      const [sku, brand, tp] = r.split(",");

      return {
        sku: (sku || "").trim(),
        brand: (brand || "").trim(),
        tp: Number(tp || 0)
      };
    }).filter(x => x.sku && x.tp);

    renderPreview(uploadedData);

    /* RESET OUTPUT UI */
    clearOutput();

    generatedOutput = [];
    document.getElementById("downloadMrpBtn").disabled = true;
  };

  reader.readAsText(file);
}

/* ---------------- PREVIEW TABLE ---------------- */
function renderPreview(data) {
  const body = document.getElementById("mrpPreviewBody");
  if (!body) return;

  if (!data.length) {
    body.innerHTML =
      `<tr><td colspan="3" class="center">No data</td></tr>`;
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
    Number(document.getElementById("mrpTarget")?.value || 5);

  const discount =
    Number(document.getElementById("mrpDiscount")?.value || 0.6);

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

  renderOutputTable(generatedOutput);

  document.getElementById("downloadMrpBtn").disabled = false;
}

/* ---------------- OUTPUT TABLE (NEW) ---------------- */
function renderOutputTable(data) {

  let container =
    document.getElementById("mrpOutputWrap");

  /* Create if not exists */
  if (!container) {
    container = document.createElement("div");
    container.id = "mrpOutputWrap";
    container.className = "card";

    container.innerHTML = `
      <div class="card-title">Generated MRP</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Brand</th>
              <th>TP</th>
              <th>MRP</th>
            </tr>
          </thead>
          <tbody id="mrpOutputBody"></tbody>
        </table>
      </div>
    `;

    document
      .getElementById("mrpTab")
      ?.appendChild(container);
  }

  const body =
    document.getElementById("mrpOutputBody");

  if (!body) return;

  body.innerHTML = data.map(r => `
    <tr>
      <td>${r.sku}</td>
      <td>${r.brand}</td>
      <td>${r.tp}</td>
      <td><b>${r.mrp}</b></td>
    </tr>
  `).join("");
}

/* ---------------- CLEAR OUTPUT ---------------- */
function clearOutput() {
  const el =
    document.getElementById("mrpOutputWrap");

  if (el) el.remove();
}

/* ---------------- DOWNLOAD ---------------- */
function downloadCsv() {

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