// js/normalizer.js

import {
  STORE,
  CONFIG,
  num,
  text
} from "./config.js";

/* ----------------------------------
   PUBLIC
-----------------------------------*/
export function normalizeAllData() {
  normalizeProducts();
  normalizeCommercials();
  normalizeGta();
  buildRtvMap();
}

/* ----------------------------------
   PRODUCTS
-----------------------------------*/
function normalizeProducts() {
  const rows =
    STORE.raw.productMaster ||
    [];

  STORE.normalized.products =
    rows
      .map(row => ({
        styleId:
          cleanStyleId(
            row.style_id ||
              row.styleid
          ),

        launchDate:
          text(
            row.launch_date
          ),

        liveDate:
          text(
            row.live_date
          ),

        erpSku: text(
          row.erp_sku ||
            row.sku
        ),

        brand: text(
          row.brand
        ),

        articleType:
          text(
            row.article_type ||
              row.article
          ),

        status: text(
          row.status
        ),

        mrp: num(
          row.mrp
        ),

        tp: num(
          row.tp
        )
      }))
      .filter(
        item =>
          item.styleId &&
          item.styleId !==
            "0"
      );
}

/* ----------------------------------
   COMMERCIALS
-----------------------------------*/
function normalizeCommercials() {
  const rows =
    STORE.raw.commercials ||
    [];

  STORE.normalized.commercials =
    rows.map(row => ({
      brand: norm(
        row.brand
      ),

      articleType:
        norm(
          row.article_type
        ),

      lower: num(
        row.lower_limit
      ),

      upper: num(
        row.upper_limit
      ),

      commission:
        num(
          row.commission
        ),

      level: text(
        row.level
      ),

      royalty:
        num(
          row.royalty
        ),

      marketing:
        num(
          row.marketing
        ),

      pickPack:
        num(
          row.pick_and_pack
        ),

      returnFee:
        num(
          row.return_fee
        ),

      fixedFee:
        num(
          row.fixed_fee
        )
    }));
}

/* ----------------------------------
   GTA
-----------------------------------*/
function normalizeGta() {
  const rows =
    STORE.raw.gta || [];

  STORE.normalized.gta =
    rows.map(row => ({
      brand: norm(
        row.brand
      ),

      articleType:
        norm(
          row.article_type
        ),

      level: text(
        row.level
      ).toLowerCase(),

      lower: num(
        row.lower_limit
      ),

      upper: num(
        row.upper_limit
      ),

      range: text(
        row.range
      ),

      gtaCharges:
        num(
          row.gta_charges
        )
    }));
}

/* ----------------------------------
   RTV MAP
   STYLE BASED

   Orders file style_id
   Returns file style_id

   Rules:
   sales < 20 => 35%
   no sales => 35%
   else actual %
-----------------------------------*/
function buildRtvMap() {
  const orders =
    STORE.raw.orders || [];

  const returnsData =
    STORE.raw.returns ||
    [];

  const orderCount =
    {};

  const returnCount =
    {};

  /* sales count by style */
  orders.forEach(row => {
    const styleId =
      cleanStyleId(
        row.style_id ||
          row.styleid
      );

    if (
      !styleId ||
      styleId === "0"
    ) {
      return;
    }

    orderCount[
      styleId
    ] =
      (orderCount[
        styleId
      ] || 0) + 1;
  });

  /* return count by style */
  returnsData.forEach(
    row => {
      const styleId =
        cleanStyleId(
          row.style_id ||
            row.styleid
        );

      if (
        !styleId ||
        styleId === "0"
      ) {
        return;
      }

      returnCount[
        styleId
      ] =
        (returnCount[
          styleId
        ] || 0) + 1;
    }
  );

  const rtvMap = {};

  /* all styles from both files */
  const allIds =
    new Set([
      ...Object.keys(
        orderCount
      ),
      ...Object.keys(
        returnCount
      )
    ]);

  allIds.forEach(id => {
    const ord =
      orderCount[id] ||
      0;

    const ret =
      returnCount[id] ||
      0;

    let pct =
      CONFIG.COSTS
        .DEFAULT_RTV_PERCENT;

    if (ord < 20) {
      pct =
        CONFIG.COSTS
          .DEFAULT_RTV_PERCENT;
    } else {
      pct =
        (ret / ord) *
        100;
    }

    rtvMap[id] =
      round2(pct);
  });

  STORE.normalized.rtvMap =
    rtvMap;
}

/* ----------------------------------
   LOOKUPS
-----------------------------------*/
export function getProductByStyle(
  styleId
) {
  const key =
    cleanStyleId(
      styleId
    );

  return (
    STORE.normalized.products.find(
      x =>
        x.styleId ===
        key
    ) || null
  );
}

export function getProductBySku(
  sku
) {
  const key =
    text(sku)
      .toLowerCase();

  return (
    STORE.normalized.products.find(
      x =>
        x.erpSku.toLowerCase() ===
        key
    ) || null
  );
}

export function getRtv(
  styleId
) {
  const key =
    cleanStyleId(
      styleId
    );

  return (
    STORE.normalized.rtvMap[
      key
    ] ??
    CONFIG.COSTS
      .DEFAULT_RTV_PERCENT
  );
}

export function getBrandArticleType(
  brand
) {
  const b =
    norm(brand);

  const row =
    STORE.normalized.products.find(
      x =>
        norm(
          x.brand
        ) === b
    );

  return row
    ? row.articleType
    : "SAREES";
}

export function findCommercial(
  brand,
  articleType,
  sellerPrice
) {
  const b =
    norm(brand);

  const a =
    norm(
      articleType
    );

  const sp =
    num(
      sellerPrice
    );

  let row =
    STORE.normalized.commercials.find(
      x =>
        x.brand === b &&
        x.articleType ===
          a &&
        sp >= x.lower &&
        sp <= x.upper
    );

  if (!row) {
    row =
      STORE.normalized.commercials.find(
        x =>
          x.brand === b &&
          sp >= x.lower &&
          sp <= x.upper
      );
  }

  return row || null;
}

export function findGta(
  brand,
  articleType,
  level,
  customerSp
) {
  const b =
    norm(brand);

  const a =
    norm(
      articleType
    );

  const l =
    text(level)
      .toLowerCase();

  const sp =
    num(
      customerSp
    );

  let row =
    STORE.normalized.gta.find(
      x =>
        x.brand === b &&
        x.articleType ===
          a &&
        x.level === l &&
        sp >= x.lower &&
        sp <= x.upper
    );

  if (!row) {
    row =
      STORE.normalized.gta.find(
        x =>
          x.brand === b &&
          x.level === l &&
          sp >= x.lower &&
          sp <= x.upper
      );
  }

  return row || null;
}

/* ----------------------------------
   HELPERS
-----------------------------------*/
function cleanStyleId(v) {
  return String(
    v || ""
  )
    .replace(
      /\.0$/,
      ""
    )
    .trim();
}

function norm(v) {
  return text(v)
    .toLowerCase()
    .replace(
      /sarees/g,
      "saree"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function round2(v) {
  return Math.round(
    (Number(v) +
      Number.EPSILON) *
      100
  ) / 100;
}