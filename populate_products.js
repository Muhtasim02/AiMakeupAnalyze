/**
 * AI MakeupMatch
 * Open Beauty Facts -> MySQL Product Importer
 *
 * Install:
 * npm install mysql2 dotenv
 *
 * Run:
 * node populate_products.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ai_makeupmatch",
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
};

const OBF_BASE_URL =
  "https://world.openbeautyfacts.org/api/v2/search";

const DELAY_MS = Number(process.env.OBF_DELAY_MS || 7000);
const PAGE_SIZE = Math.min(
  100,
  Math.max(1, Number(process.env.OBF_PAGE_SIZE || 100))
);
const PAGES_PER_QUERY = Math.max(
  1,
  Number(process.env.OBF_PAGES || 1)
);
const MAX_PRODUCTS = Math.max(
  1,
  Number(process.env.OBF_MAX_PRODUCTS || 500)
);

const SEARCH_TERMS = [
  "foundation",
  "concealer",
  "blush",
  "lipstick",
  "lip gloss",
  "mascara",
  "eyeliner",
  "eyeshadow",
  "bronzer",
  "highlighter",
  "setting powder",
  "face powder",
  "primer",
  "bb cream",
  "cc cream",
];

const FIELDS = [
  "code",
  "product_name",
  "generic_name",
  "brands",
  "categories",
  "categories_tags",
  "countries",
  "countries_tags",
  "image_front_url",
  "image_front_small_url",
  "url",
  "quantity",
  "ingredients_text",
  "labels",
  "data_completeness",
  "last_modified_t",
].join(",");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const v = clean(value);
    if (v) return v;
  }

  return "";
}

function normalizeBarcode(value) {
  const code = clean(value).replace(/\s+/g, "");

  if (!/^\d{8,14}$/.test(code)) {
    return null;
  }

  return code;
}

function normalizeBrand(value) {
  return clean(value)
    .split(",")[0]
    .replace(/\s+/g, " ")
    .trim();
}

function arrayToText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return firstNonEmpty(item.name, item.id);
        }

        return "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return clean(value);
}

function removeObfPrefix(value) {
  return clean(value)
    .replace(/^([a-z]{2}):/i, "")
    .replace(/-/g, " ");
}

/*
 * Convert Open Beauty Facts category information
 * into the categories used by AI MakeupMatch.
 */
function detectCategory(product, searchTerm) {
  const text = [
    clean(product.product_name),
    clean(product.generic_name),
    arrayToText(product.categories),
    arrayToText(product.categories_tags),
    searchTerm,
  ]
    .join(" ")
    .toLowerCase();

  const rules = [
    [
      "Setting Powder",
      ["setting powder", "loose powder", "setting powders"],
    ],

    [
      "Compact Powder",
      ["compact powder", "pressed powder", "face powder"],
    ],

    [
      "Foundation",
      ["foundation", "fond de teint"],
    ],

    [
      "Concealer",
      ["concealer", "corrector", "correcteur"],
    ],

    [
      "Blush",
      ["blush", "rouge", "cheek color"],
    ],

    [
      "Bronzer",
      ["bronzer", "bronzing"],
    ],

    [
      "Highlighter",
      ["highlighter", "illuminator", "illuminateur"],
    ],

    [
      "Primer",
      ["primer", "makeup base", "base de maquillage"],
    ],

    [
      "BB Cream",
      ["bb cream", "blemish balm"],
    ],

    [
      "CC Cream",
      ["cc cream", "color correcting cream"],
    ],

    [
      "Mascara",
      ["mascara"],
    ],

    [
      "Eyeliner",
      ["eyeliner", "eye liner", "kajal"],
    ],

    [
      "Eyeshadow",
      ["eyeshadow", "eye shadow", "eye colour"],
    ],

    [
      "Lipstick",
      ["lipstick", "lip stick", "rouge à lèvres"],
    ],

    [
      "Lip Gloss",
      ["lip gloss", "lipgloss", "gloss lèvres"],
    ],
  ];

  for (const [category, keywords] of rules) {
    if (
      keywords.some((keyword) =>
        text.includes(keyword)
      )
    ) {
      return category;
    }
  }

  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "AI-MakeupMatch/1.0 CSE299 Student Project",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Open Beauty Facts HTTP ${response.status}: ${body.slice(
        0,
        300
      )}`
    );
  }

  return response.json();
}

async function searchOBF(searchTerm, page) {
  const params = new URLSearchParams({
    search_terms: searchTerm,
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: FIELDS,
  });

  const url = `${OBF_BASE_URL}?${params.toString()}`;

  console.log("");
  console.log(
    `[OBF] Searching "${searchTerm}" - Page ${page}`
  );

  return fetchJson(url);
}

/*
 * Make sure products.barcode exists.
 */
async function ensureBarcodeColumn(connection) {
  const [rows] = await connection.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'barcode'
  `);

  if (Number(rows[0].count) === 0) {
    console.log(
      "[DB] Adding products.barcode column..."
    );

    await connection.query(`
      ALTER TABLE products
      ADD COLUMN barcode VARCHAR(32) NULL
      AFTER product_id
    `);
  }

  const [indexes] = await connection.query(`
    SHOW INDEX FROM products
    WHERE Key_name = 'idx_products_barcode'
  `);

  if (indexes.length === 0) {
    console.log(
      "[DB] Adding barcode index..."
    );

    await connection.query(`
      CREATE INDEX idx_products_barcode
      ON products (barcode)
    `);
  }
}

/*
 * Create category if it does not already exist.
 */
async function ensureCategory(
  connection,
  categoryName
) {
  const [rows] = await connection.execute(
    `
    SELECT category_id
    FROM categories
    WHERE category_name = ?
    LIMIT 1
    `,
    [categoryName]
  );

  if (rows.length) {
    return rows[0].category_id;
  }

  const descriptions = {
    Foundation:
      "Makeup foundation products.",

    Concealer:
      "Products used to conceal blemishes and discoloration.",

    Blush:
      "Cheek color products.",

    Bronzer:
      "Products used to add warmth and bronzed color.",

    Highlighter:
      "Products used to add luminous highlights.",

    Primer:
      "Makeup primers and base products.",

    "BB Cream":
      "BB cream complexion products.",

    "CC Cream":
      "CC cream color-correcting complexion products.",

    Mascara:
      "Eye makeup mascara products.",

    Eyeliner:
      "Eye liner products.",

    Eyeshadow:
      "Eye shadow products.",

    Lipstick:
      "Lip color and lipstick products.",

    "Lip Gloss":
      "Lip gloss products.",

    "Setting Powder":
      "Loose or setting face powders.",

    "Compact Powder":
      "Pressed or compact face powders.",
  };

  const description =
    descriptions[categoryName] ||
    "Cosmetic makeup product.";

  const [result] = await connection.execute(
    `
    INSERT INTO categories
      (category_name, description)
    VALUES
      (?, ?)
    `,
    [categoryName, description]
  );

  return result.insertId;
}

/*
 * Create brand if it does not already exist.
 */
async function ensureBrand(
  connection,
  brandName
) {
  if (!brandName) {
    return null;
  }

  const [rows] = await connection.execute(
    `
    SELECT brand_id
    FROM brands
    WHERE brand_name = ?
    LIMIT 1
    `,
    [brandName]
  );

  if (rows.length) {
    return rows[0].brand_id;
  }

  /*
   * Open Beauty Facts does not always provide
   * reliable brand-origin information.
   *
   * Therefore we do not invent it.
   */
  const [result] = await connection.execute(
    `
    INSERT INTO brands
      (
        brand_name,
        country_origin,
        website
      )
    VALUES
      (?, ?, ?)
    `,
    [
      brandName,
      "Unknown",
      null,
    ]
  );

  return result.insertId;
}

function buildDescription(product) {
  const parts = [];

  const generic = clean(
    product.generic_name
  );

  const quantity = clean(
    product.quantity
  );

  const ingredients = clean(
    product.ingredients_text
  );

  if (generic) {
    parts.push(generic);
  }

  if (quantity) {
    parts.push(`Size: ${quantity}`);
  }

  if (ingredients) {
    parts.push(
      "Ingredients available from Open Beauty Facts."
    );
  }

  return (
    parts.join(" | ") ||
    "Cosmetic product sourced from Open Beauty Facts."
  );
}

/*
 * Insert a new product or update an existing
 * product with the same real barcode.
 */
async function upsertProduct(
  connection,
  product,
  categoryId,
  brandId
) {
  const barcode = normalizeBarcode(
    product.code
  );

  const productName = clean(
    product.product_name
  );

  if (
    !barcode ||
    !productName ||
    !brandId ||
    !categoryId
  ) {
    return {
      status: "skipped",
      reason: "Missing required fields",
    };
  }

  const imageUrl = firstNonEmpty(
    product.image_front_url,
    product.image_front_small_url
  );

  const sourceUrl =
    firstNonEmpty(product.url) ||
    `https://world.openbeautyfacts.org/product/${barcode}`;

  const sourceName =
    "Open Beauty Facts";

  const description =
    buildDescription(product);

  /*
   * IMPORTANT:
   *
   * Do NOT invent skin tone or undertone.
   * Gemini can later analyze the user's selfie,
   * while product suitability can be enriched
   * separately.
   */
  const skinTone = null;
  const undertone = null;

  const [existing] =
    await connection.execute(
      `
      SELECT product_id
      FROM products
      WHERE barcode = ?
      ORDER BY product_id ASC
      LIMIT 1
      `,
      [barcode]
    );

  /*
   * Product already exists.
   */
  if (existing.length) {
    await connection.execute(
      `
      UPDATE products

      SET
        brand_id = ?,
        category_id = ?,
        product_name = ?,
        description = ?,

        image_url =
          CASE
            WHEN ? <> ''
            THEN ?
            ELSE image_url
          END,

        source_url = ?,
        source_name = ?,
        is_verified = 1,
        is_active = 1

      WHERE product_id = ?
      `,
      [
        brandId,
        categoryId,
        productName,
        description,

        imageUrl,
        imageUrl,

        sourceUrl,
        sourceName,

        existing[0].product_id,
      ]
    );

    return {
      status: "updated",
      productId: existing[0].product_id,
    };
  }

  /*
   * New product.
   */
  const [result] =
    await connection.execute(
      `
      INSERT INTO products
      (
        barcode,
        brand_id,
        category_id,
        product_name,
        description,
        price,
        currency,
        image_url,
        skin_tone,
        undertone,
        shade_name,
        source_url,
        source_name,
        is_verified,
        is_active
      )

      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        NULL,
        '৳',
        ?,
        ?,
        ?,
        NULL,
        ?,
        ?,
        1,
        1
      )
      `,
      [
        barcode,
        brandId,
        categoryId,
        productName,
        description,
        imageUrl || null,
        skinTone,
        undertone,
        sourceUrl,
        sourceName,
      ]
    );

  return {
    status: "inserted",
    productId: result.insertId,
  };
}

async function main() {
  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    " AI MakeupMatch - Open Beauty Facts Importer"
  );
  console.log(
    "=============================================="
  );
  console.log("");

  console.log(
    `Database: ${DB_CONFIG.database}`
  );

  console.log(
    `Maximum products: ${MAX_PRODUCTS}`
  );

  console.log(
    `Page size: ${PAGE_SIZE}`
  );

  console.log(
    `Pages per search: ${PAGES_PER_QUERY}`
  );

  console.log(
    `Delay: ${DELAY_MS} ms`
  );

  console.log("");

  const connection =
    await mysql.createConnection(
      DB_CONFIG
    );

  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  /*
   * Prevent the same barcode from being
   * processed multiple times when it appears
   * under different search terms.
   */
  const seenBarcodes = new Set();

  try {
    await ensureBarcodeColumn(
      connection
    );

    for (
      const searchTerm of SEARCH_TERMS
    ) {
      if (
        inserted + updated >=
        MAX_PRODUCTS
      ) {
        break;
      }

      for (
        let page = 1;
        page <= PAGES_PER_QUERY;
        page++
      ) {
        if (
          inserted + updated >=
          MAX_PRODUCTS
        ) {
          break;
        }

        let data;

        try {
          data = await searchOBF(
            searchTerm,
            page
          );
        } catch (error) {
          console.error(
            `[OBF ERROR] ${error.message}`
          );

          console.log(
            "Waiting before continuing..."
          );

          await sleep(DELAY_MS);

          continue;
        }

        const products =
          Array.isArray(data.products)
            ? data.products
            : [];

        console.log(
          `[OBF] Found ${products.length} records`
        );

        for (
          const product of products
        ) {
          if (
            inserted + updated >=
            MAX_PRODUCTS
          ) {
            break;
          }

          const barcode =
            normalizeBarcode(
              product.code
            );

          /*
           * Product must have a real
           * numeric barcode.
           */
          if (!barcode) {
            skipped++;
            continue;
          }

          /*
           * Already processed during
           * another search.
           */
          if (
            seenBarcodes.has(barcode)
          ) {
            continue;
          }

          seenBarcodes.add(barcode);

          fetched++;

          const categoryName =
            detectCategory(
              product,
              searchTerm
            );

          if (!categoryName) {
            skipped++;
            continue;
          }

          const brandName =
            normalizeBrand(
              product.brands
            );

          if (!brandName) {
            skipped++;

            console.log(
              `[SKIP] ${barcode}: no brand`
            );

            continue;
          }

          try {
            const brandId =
              await ensureBrand(
                connection,
                brandName
              );

            const categoryId =
              await ensureCategory(
                connection,
                categoryName
              );

            const result =
              await upsertProduct(
                connection,
                product,
                categoryId,
                brandId
              );

            if (
              result.status ===
              "inserted"
            ) {
              inserted++;

              console.log(
                `[INSERT] ${barcode} | ${brandName} | ${categoryName} | ${clean(
                  product.product_name
                )}`
              );
            }

            else if (
              result.status ===
              "updated"
            ) {
              updated++;

              console.log(
                `[UPDATE] ${barcode} | ${brandName} | ${clean(
                  product.product_name
                )}`
              );
            }

            else {
              skipped++;
            }
          } catch (error) {
            skipped++;

            console.error(
              `[DB ERROR] ${barcode}: ${error.message}`
            );
          }
        }

        /*
         * Respect Open Beauty Facts
         * API rate limits.
         */
        if (
          page < PAGES_PER_QUERY
        ) {
          await sleep(DELAY_MS);
        }
      }

      /*
       * Wait between search terms.
       */
      await sleep(DELAY_MS);
    }

    /*
     * Save import information in
     * your existing ingestion_jobs table.
     */
    try {
      await connection.execute(
        `
        INSERT INTO ingestion_jobs
        (
          source_type,
          source_url,
          status,
          items_fetched,
          items_inserted,
          items_skipped,
          log_output,
          completed_at
        )

        VALUES
        (
          'Open Beauty Facts',
          ?,
          'completed',
          ?,
          ?,
          ?,
          ?,
          CURRENT_TIMESTAMP
        )
        `,
        [
          OBF_BASE_URL,
          fetched,
          inserted + updated,
          skipped,
          `Inserted: ${inserted}; Updated: ${updated}; Skipped: ${skipped}`,
        ]
      );
    } catch (error) {
      console.warn(
        `[WARN] Could not save ingestion job: ${error.message}`
      );
    }

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      " IMPORT COMPLETE"
    );
    console.log(
      "=============================================="
    );

    console.log(
      `Records processed : ${fetched}`
    );

    console.log(
      `New products      : ${inserted}`
    );

    console.log(
      `Updated products  : ${updated}`
    );

    console.log(
      `Skipped           : ${skipped}`
    );

    console.log(
      "=============================================="
    );
    console.log("");
  }

  finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "========== FATAL ERROR =========="
  );
  console.error(error);
  console.error(
    "================================="
  );

  process.exit(1);
});
