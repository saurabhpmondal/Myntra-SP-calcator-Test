// js/pricing-engine.js

import { CONFIG, num } from "./config.js";
import {
  findCommercial,
  findGta,
  getRtv
} from "./normalizer.js";

/* ----------------------------------
   PUBLIC
-----------------------------------*/

/* TP -> derive SP */
export function solvePrice(
  product,
  targetPct = 5
) {
  const tp = num(product.tp);

  const targetValue =
    tp * (1 + targetPct / 100);

  for (
    let seed = Math.max(
      99,
      Math.ceil(tp)
    );
    seed <=
    CONFIG.LIMITS.MAX_SP_SEARCH;
    seed++
  ) {
    const sp =
      applyRounding(seed);

    const calc =
      evaluatePrice(
        product,
        sp
      );

    if (
      calc.payoutAfterCodb >=
      targetValue
    ) {
      calc.targetPct =
        targetPct;

      calc.targetValue =
        targetValue;

      return calc;
    }

    seed = sp;
  }

  return null;
}

/* SP -> full breakup */
export function evaluatePrice(
  product,
  sp
) {
  const tp =
    num(product.tp);

  const rtvPct =
    getRtv(
      product.styleId
    );

  /* STEP 1 */
  let comm =
    findCommercial(
      product.brand,
      product.articleType,
      sp
    ) || defaultCommercial();

  let level =
    comm.level ||
    "default";

  /* STEP 2 */
  const gtaRow =
    findGta(
      product.brand,
      product.articleType,
      level,
      sp
    );

  const gta =
    gtaRow
      ? num(
          gtaRow.gtaCharges
        )
      : 0;

  const sellerPrice =
    sp - gta;

  /* STEP 3 */
  comm =
    findCommercial(
      product.brand,
      product.articleType,
      sellerPrice
    ) || comm;

  const commissionPct =
    num(comm.commission);

  const fixedFee =
    num(comm.fixedFee);

  const royaltyPct =
    num(comm.royalty);

  const marketingPct =
    num(comm.marketing);

  const collectionFee =
    CONFIG.COSTS.COLLECTION_FEE;

  /* SELLER SIDE */
  const commissionRs =
    sellerPrice *
    commissionPct /
    100;

  const gstBase =
    commissionRs +
    fixedFee +
    collectionFee;

  const taxOnComFixed =
    gstBase *
    CONFIG.TAX
      .GST_PERCENT /
    100;

  const uploadSettlement =
    sellerPrice -
    commissionRs -
    fixedFee -
    collectionFee -
    taxOnComFixed;

  /* FIXED:
     TDS/TCS ON SELLER PRICE */
  const tds =
    sellerPrice *
    CONFIG.TAX
      .TDS_PERCENT /
    100;

  const tcs =
    sellerPrice *
    CONFIG.TAX
      .TCS_PERCENT /
    100;

  const tdsTcs =
    tds + tcs;

  const bankSettlement =
    uploadSettlement -
    tdsTcs;

  /* CUSTOMER SIDE */

  /* FIXED:
     GST ON ROYALTY */
  const royaltyBase =
    sp *
    royaltyPct /
    100;

  const royalty =
    royaltyBase *
    (1 +
      CONFIG.TAX
        .GST_PERCENT /
        100);

  /* FIXED:
     GST ON MARKETING */
  const marketingBase =
    sp *
    marketingPct /
    100;

  const marketing =
    marketingBase *
    (1 +
      CONFIG.TAX
        .GST_PERCENT /
        100);

  const rebate = 0;

  const payoutBeforeCodb =
    bankSettlement -
    royalty -
    marketing -
    rebate;

  /* CODB */
  const dispatchCost =
    getDispatchCost(sp);

  const returnCharge =
    CONFIG.COSTS
      .RETURN_CHARGE;

  const returnCost =
    (fixedFee +
      returnCharge) *
    (1 +
      CONFIG.TAX
        .GST_PERCENT /
        100);

  const rawRtv =
    (
      returnCost *
      rtvPct
    ) /
    (100 - rtvPct);

  const rtvCodb =
    Math.min(
      rawRtv,
      returnCost
    );

  const payoutAfterCodb =
    payoutBeforeCodb -
    dispatchCost -
    rtvCodb;

  const tpProfitRs =
    payoutAfterCodb -
    tp;

  const tpProfitPct =
    tp > 0
      ? (
          tpProfitRs /
          tp
        ) * 100
      : 0;

  return {
    erpSku:
      product.erpSku,
    styleId:
      product.styleId,
    brand:
      product.brand,
    articleType:
      product.articleType,
    status:
      product.status,

    mrp:
      num(product.mrp),
    tp,

    sp,
    gta,
    listPrice:
      sellerPrice,

    commissionPct,
    commissionRs,
    fixedFee,
    taxOnComFixed,

    uploadSettlement,
    tdsTcs,
    bankSettlement,

    royalty,
    marketing,
    rebate,

    payoutBeforeCodb,

    dispatchCost,
    returnCharge,
    returnCost,

    rtvPct,
    rtvCodb,

    payoutAfterCodb,

    tpProfitRs,
    tpProfitPct
  };
}

/* ----------------------------------
   HELPERS
-----------------------------------*/
function getDispatchCost(sp) {
  if (sp < 500) return 25;
  if (sp <= 1000) return 30;
  return 35;
}

function applyRounding(v) {
  const mode =
    CONFIG.ROUNDING
      ?.MODE || "INT";

  if (mode === "9") {
    return roundToNext9(v);
  }

  return Math.round(
    num(v)
  );
}

function roundToNext9(v) {
  const n =
    Math.ceil(
      num(v)
    );

  const base =
    Math.floor(
      n / 10
    ) *
      10 +
    9;

  if (base >= n)
    return base;

  return base + 10;
}

function defaultCommercial() {
  return {
    commission: 0,
    level: "default",
    royalty: 0,
    marketing: 0,
    fixedFee: 0
  };
}