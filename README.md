# AI MakeupMatch — Personalized Makeup Finder

> **North South University · CSE299 Junior Design Project**  
> Complete Implementation: Stage 1 (Frontend Architecture) + Stage 2 (Backend & Database) + Stage 3 (Gemini AI Vision Analysis) + Stage 4 (Deterministic Recommendation Engine & Final Integration).

---

## 1. System Architecture

AI MakeupMatch is an end-to-end full-stack web application engineered to solve foundation, concealer, and makeup shade mismatching for diverse South Asian and global complexions.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)                       │
│  • Tailwind CSS Editorial Design System (Zero-Pill Aesthetic)          │
│  • Web Camera Capture & Drag-and-Drop Image Uploader                   │
│  • Complexion Diagnostic Dashboard & Interactive Swatch Inspector     │
│  • Side-by-Side Product Comparison Matrix (2–3 items)                  │
│  • Real-Time Catalog Filters & Favorites Synchronizer                  │
│  • Role-Gated Admin Management Console (Passcode: admin123)            │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / JSON API (port 3000)
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Express.js REST API)                       │
│  • Authentication Controller (JWT & bcryptjs password hashing)         │
│  • Gemini Multimodal Vision Service (@google/genai SDK)                │
│  • Deterministic 100-Point Recommendation Scoring Engine               │
│  • Product CRUD & Country-Specific Stock Availability Tracker          │
│  • Open Beauty Facts Data Ingestion & Audit Pipeline                   │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
┌──────────────────▼───────────────┐ ┌────────────────▼──────────────────┐
│     MYSQL / EMBEDDED SQL DB      │ │          GOOGLE GEMINI AI         │
│  Database: ai_makeupmatch        │ │  Model: gemini-3.8-flash          │
│  Tables:                         │ │  Fallback: gemini-3.1-flash-lite  │
│  • users                         │ │  Task: Cosmetic Complexion Depth  │
│  • brands                        │ │        and Undertone Temperature  │
│  • categories                    │ │        Multimodal Classification  │
│  • products                      │ └───────────────────────────────────┘
│  • product_availability          │
│  • skin_analysis                 │
│  • recommendations               │
│  • favorites                     │
│  • ingestion_jobs                │
└──────────────────────────────────┘
```

---

## 2. Deterministic Recommendation Algorithm (Stage 4)

The recommendation engine strictly calculates match compatibility out of **100 points maximum**. It is **100% deterministic**; no random numbers or speculative guesses are ever produced.

### Scoring Criteria:

| Matching Factor | Maximum Points | Scoring Logic |
| :--- | :---: | :--- |
| **Skin Tone Depth** | **40 pts** | • **40 pts**: Exact tone match (`Very Fair`, `Fair`, `Light`, `Medium`, `Tan`, `Deep`).<br>• **25 pts**: Compatible adjacent tone (distance = 1).<br>• **0 pts**: Incompatible tone distance (distance ≥ 2). |
| **Undertone Harmony** | **25 pts** | • **25 pts**: Exact undertone match (`Warm`, `Cool`, `Neutral`).<br>• **15 pts**: Compatible neutral formulation or Olive/Warm harmony.<br>• **0 pts**: Direct undertone clash (e.g. Cool on Warm). |
| **Budget Compatibility** | **15 pts** | • **15 pts**: Within user budget (`price <= budget`).<br>• **7 pts**: Slightly above budget (`budget < price <= budget * 1.25`).<br>• **0 pts**: Significantly above budget (`price > budget * 1.25`). |
| **Country Availability** | **10 pts** | • **10 pts**: Product verified available in user's country (`is_available = true` in `product_availability`).<br>• **0 pts**: Currently out of stock or unavailable in user's country. |
| **Category Preference** | **10 pts** | • **10 pts**: Matches selected category preference (or browse mode is set to "All").<br>• **0 pts**: Different category. |
| **TOTAL** | **100 pts** | Displayed as percentage match (e.g. `95% Match`, `87% Match`). |

### Deterministic Ranking Order:
1. **Highest Recommendation Score** (Descending)
2. **Country Availability** (`is_available = true` in country first)
3. **Lowest Retail Price** (Ascending)

### Dynamic Natural Language Explanation:
The algorithm dynamically generates an evidence-based explanation reflecting the exact matching criteria:
> *"Recommended because this foundation matches your medium skin tone, harmonizes with your warm undertone, is available in Bangladesh, and fits your ৳3,000 budget."*

### Budget Tiers:
- **Best Matches**: Formulations strictly within the user's budget with top match scores.
- **Slightly Above Budget**: Formulations within 25% above the budget offering superior shade fidelity.
- **Similar Alternatives**: Premium formulas or adjacent tone alternatives offering complexion balance.

---

## 3. Country Availability Policy

A product is **only** marked as available in a specific country if the `product_availability` database table has an active record with `is_available = 1` for that country.
- When available: displayed with a green verified badge: `"Available in Bangladesh"`.
- When unavailable: displayed with an amber indicator: `"Not currently available in Bangladesh"`.
- The system prevents false availability claims.

---

## 4. Setup Instructions

### Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher

### Environment Setup
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=makeup_user
DB_PASSWORD=makeup_pass123
DB_NAME=ai_makeupmatch
JWT_SECRET=makeupmatch_jwt_secret_key_2026
ADMIN_SECRET=admin123
```

### Installation
```bash
npm install
```

### Running in Development
```bash
npm run dev
```
The server boots on `http://localhost:3000`.

### Production Build & Launch
```bash
npm run build
npm run start
```

---

## 5. Database Setup (MySQL & Embedded Fallback)

### Initializing MySQL Database:
Run `seed.sql` on your MySQL server:
```bash
mysql -u root -p < seed.sql
```
This sets up:
1. `users` table with bcrypt password hashing and default profile.
2. `brands` table with 8 local and international cosmetics brands.
3. `categories` table with 10 makeup categories.
4. `products` table seeded with 32 authentic formulas across diverse skin tones and undertones.
5. `product_availability` table tracking country-specific prices, stock flags, and direct retailer purchase links.
6. `skin_analysis` table persisting user AI diagnostic records.
7. `recommendations` table storing algorithmic scores and reasons.
8. `favorites` table linking users to bookmarked formulas.
9. `ingestion_jobs` table auditing automated catalog ingestion runs.

### Embedded SQLite Fallback Engine:
To ensure zero deployment failure in containerized preview environments (such as Cloud Run or sandbox instances without a separate mysqld service), `src/server/config/db.ts` automatically boots an in-memory SQL database from `seed.sql` if an external MySQL daemon is unreachable. All queries, transactions, and REST APIs function identically.

---

## 6. Gemini Multimodal AI Setup (Stage 3)

The application utilizes `@google/genai` TypeScript SDK:
- **Server-Side API**: `POST /api/analysis/gemini-analyze`
- **Vision Models**: Primary `gemini-3.8-flash` with resilient automatic fallback to `gemini-flash-latest` and `gemini-3.1-flash-lite`.
- **System Instruction**: Enforces cosmetic shade matching only; does not provide medical or dermatological claims.
- **Structured Schema**:
  - `skinTone`: `"Very Fair"`, `"Fair"`, `"Light"`, `"Medium"`, `"Tan"`, `"Deep"`, or `"Unknown"`
  - `undertone`: `"Cool"`, `"Warm"`, `"Neutral"`, or `"Unknown"`
  - `confidence`: Decimal score (`0.0` to `1.0`)
  - `explanation`: Clinical reasoning regarding facial skin depth and undertone nuances.
- **Anti-Hallucination Policy**: If the image is blurred, underexposed, heavily filtered, or obstructed, the model returns `"Unknown"` with `0` confidence and advises the user to retake the photo.

---

## 7. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Backend and database status health check |
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | Authenticate user and receive JWT token |
| **GET** | `/api/user/profile` | Retrieve active user profile, budget, and latest skin analysis |
| **PUT** | `/api/user/profile` | Update profile information, country, and budget |
| **POST** | `/api/analysis/gemini-analyze` | Multimodal selfie skin tone and undertone detection |
| **POST** | `/api/analysis/confirm` | Confirm or manually edit analysis; save into `skin_analysis` |
| **GET** | `/api/recommendations` | Deterministic 100-point recommendations filtered by tone, undertone, budget, country, and category |
| **GET** | `/api/products` | Retrieve catalog products with filters (`category`, `brand`, `skinTone`, `undertone`, `country`, `maxPrice`, `availability`, `search`, `sort`) |
| **GET** | `/api/products/:id` | Fetch product specifications and country availability |
| **POST** | `/api/products` | *(Admin)* Add new product to MySQL |
| **PUT** | `/api/products/:id` | *(Admin)* Edit existing product details |
| **DELETE** | `/api/products/:id` | *(Admin)* Deactivate product |
| **PUT** | `/api/products/:id/availability` | *(Admin)* Update price, country stock, and purchase link |
| **GET** | `/api/brands` | Fetch all brands |
| **POST** | `/api/brands` | *(Admin)* Add new brand |
| **GET** | `/api/categories` | Fetch all categories |
| **POST** | `/api/categories` | *(Admin)* Add new category |
| **GET** | `/api/favorites` | View user saved favorites from database |
| **POST** | `/api/favorites` | Save a product to favorites |
| **DELETE** | `/api/favorites/:id` | Remove a product from favorites |
| **POST** | `/api/ingest/preview` | Preview product data from permitted URL |
| **POST** | `/api/ingest/run` | Trigger automated ingestion job into MySQL |
| **GET** | `/api/ingest/jobs` | Retrieve audit log of ingestion jobs |

---

## 8. Complete User Flow Verification

1. **User Sign Up / Login**: User enters credentials; profile loads with country, budget, and default preferences.
2. **Selfie Capture or Upload**: User takes a live photo with webcam or uploads a natural-light selfie.
3. **Gemini AI Vision Analysis**: Backend inspects facial skin depth and undertone temperature with structured JSON validation.
4. **Result Confirmation / Editing**: User reviews skin tone, undertone, and AI reasoning. The user can manually override any field.
5. **Preference Selection**: User specifies target country market, budget slider, and desired category.
6. **Recommendation Generation**: Backend executes the deterministic scoring algorithm, ranking products by score, country availability, and price.
7. **Personalized Recommendations View**: User inspects matching products categorized by Best Matches, Slightly Above Budget, and Alternatives.
8. **Product Details & Sourcing**: User reviews formulation specifications, authentic shade swatches, and verified availability.
9. **Bookmarking & Comparison**: User can add products to Favorites (persisted in database) or compare up to 3 products side-by-side.
10. **Purchase Link Following**: User clicks the external verified retailer link or reserves in-app.
11. **Admin Control Console**: Authorized administrator enters passcode (`admin123`) to perform product CRUD, price calibration, and catalog management.

---

## 9. CSE299 Student & Faculty Notes

- All keys and credentials are kept server-side to prevent exposure in client bundles.
- Code conforms to functional TypeScript style with zero UI pills and typographic elegance.
- Academic project completed for **CSE299: Junior Design Project, Department of Electrical & Computer Engineering, North South University**.
