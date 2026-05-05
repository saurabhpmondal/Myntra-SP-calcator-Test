// js/features/summary/brand-summary.js

import { STORE, money } from "../../core/config.js";
import { solvePrice } from "../../engine/pricing-engine.js";

export function renderBrandSummary() {
  const body = document.getElementById("summaryBody");
  if (!body) return;

  const rows = STORE.normalized.products || [];

  const target =
    Number(document.getElementById("profitTarget")?.value || 5);

  const map = {};

  rows.forEach(product => {
    const r = solvePrice(product, target);
    if (!r) return;

    const brand = product.brand || "Unknown";

    if (!map[brand]) {
      map[brand] = {
        brand,
        styles: 0,
        profitRs: 0,
        profitPct: 0
      };
    }

    map[brand].styles += 1;
    map[brand].profitRs += r.tpProfitRs;
    map[brand].profitPct += r.tpProfitPct;
  });

  body.innerHTML = Object.values(map)
    .map(x => `
      <tr>
        <td>${x.brand}</td>
        <td>${x.styles}</td>
        <td>₹${money(x.profitRs / x.styles)}</td>
        <td>${money(x.profitPct / x.styles)}%</td>
      </tr>
    `).join("");
}