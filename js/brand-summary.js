// js/brand-summary.js

import { STORE, money } from "./config.js";
import { solvePrice } from "./pricing-engine.js";

/* ----------------------------------
   PUBLIC
-----------------------------------*/
export function renderBrandSummary() {
  const body =
    document.getElementById(
      "summaryBody"
    );

  if (!body) return;

  const rows =
    STORE.normalized.products || [];

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5" class="center">
          No data found
        </td>
      </tr>
    `;
    return;
  }

  const target =
    Number(
      document.getElementById(
        "profitTarget"
      )?.value || 5
    );

  const map = {};

  rows.forEach(product => {
    const r =
      solvePrice(
        product,
        target
      );

    if (!r) return;

    const brand =
      product.brand ||
      "Unknown";

    if (!map[brand]) {
      map[brand] = {
        brand,
        styles: 0,
        td: 0,
        profitRs: 0,
        profitPct: 0
      };
    }

    const td =
      r.mrp > 0
        ? (
            (r.mrp - r.sp) /
            r.mrp
          ) * 100
        : 0;

    map[brand].styles += 1;
    map[brand].td += td;
    map[brand].profitRs +=
      r.tpProfitRs;

    map[brand].profitPct +=
      r.tpProfitPct;
  });

  const finalRows =
    Object.values(map)
      .map(x => ({
        brand: x.brand,
        styles: x.styles,
        td:
          x.td / x.styles,
        profitRs:
          x.profitRs /
          x.styles,
        profitPct:
          x.profitPct /
          x.styles
      }))
      .sort(
        (a, b) =>
          b.styles -
          a.styles
      );

  body.innerHTML =
    finalRows
      .map(
        row => `
      <tr>
        <td>${row.brand}</td>
        <td>${row.styles}</td>
        <td>${money(row.td)}%</td>
        <td>₹${money(row.profitRs)}</td>
        <td>${money(row.profitPct)}%</td>
      </tr>
    `
      )
      .join("");
}