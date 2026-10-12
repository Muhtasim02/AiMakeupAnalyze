import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'ai_makeupmatch.sqlite');
const db = new DatabaseSync(dbPath);

console.log('Exporting SQLite data to seed.sql...');

const brands = db.prepare('SELECT * FROM brands ORDER BY brand_id').all();
const categories = db.prepare('SELECT * FROM categories ORDER BY category_id').all();
const products = db.prepare('SELECT * FROM products ORDER BY product_id').all();
const availabilities = db.prepare('SELECT * FROM product_availability ORDER BY availability_id').all();
const users = db.prepare('SELECT * FROM users ORDER BY user_id').all();

let sql = `-- =======================================================
-- AI MakeupMatch Production Schema & Seed
-- Full multi-category complexion database
-- =======================================================

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  country VARCHAR(100) DEFAULT 'Bangladesh',
  budget DECIMAL(10,2) DEFAULT 3000.00,
  skin_tone VARCHAR(50) DEFAULT 'Medium',
  undertone VARCHAR(50) DEFAULT 'Warm',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS brands (
  brand_id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(150) NOT NULL UNIQUE,
  country_origin VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(32) NULL,
  brand_id INT NOT NULL,
  category_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NULL,
  currency VARCHAR(10) DEFAULT '৳',
  image_url VARCHAR(500) NULL,
  skin_tone VARCHAR(50) NULL,
  undertone VARCHAR(50) NULL,
  shade_name VARCHAR(100) NULL,
  source_url VARCHAR(500) NULL,
  source_name VARCHAR(100) NULL,
  is_verified BOOLEAN DEFAULT TRUE,
  verified_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_availability (
  availability_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  purchase_link VARCHAR(500) NULL,
  local_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT '৳',
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(100) NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT '৳',
  status VARCHAR(50) DEFAULT 'Delivered',
  items_count INT DEFAULT 1,
  items_summary TEXT NULL,
  shipping_address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  favorite_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skin_analysis (
  analysis_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_path VARCHAR(500) NULL,
  skin_tone VARCHAR(50) NOT NULL,
  undertone VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(5,2) DEFAULT 87.00,
  explanation TEXT NULL,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  source_url VARCHAR(500) NULL,
  status VARCHAR(50) NOT NULL,
  items_fetched INT DEFAULT 0,
  items_inserted INT DEFAULT 0,
  items_skipped INT DEFAULT 0,
  log_output TEXT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recommendations (
  recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  analysis_id INT NULL,
  product_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

`;

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Users
sql += '\n-- Users\nINSERT INTO users (user_id, name, email, password_hash, role, country, budget, skin_tone, undertone) VALUES\n';
sql += users.map(u => `(${u.user_id}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.password_hash)}, ${esc(u.role)}, ${esc(u.country)}, ${u.budget || 3000}, ${esc(u.skin_tone)}, ${esc(u.undertone)})`).join(',\n') + ';\n';

// Brands
sql += '\n-- Brands\nINSERT INTO brands (brand_id, brand_name, country_origin, website) VALUES\n';
sql += brands.map(b => `(${b.brand_id}, ${esc(b.brand_name)}, ${esc(b.country_origin)}, ${esc(b.website)})`).join(',\n') + ';\n';

// Categories
sql += '\n-- Categories\nINSERT INTO categories (category_id, category_name, description) VALUES\n';
sql += categories.map(c => `(${c.category_id}, ${esc(c.category_name)}, ${esc(c.description)})`).join(',\n') + ';\n';

// Products in batches of 100
sql += '\n-- Products\n';
for (let i = 0; i < products.length; i += 100) {
  const chunk = products.slice(i, i + 100);
  sql += 'INSERT INTO products (product_id, barcode, brand_id, category_id, product_name, description, price, currency, image_url, skin_tone, undertone, shade_name, source_url, source_name, is_verified, is_active) VALUES\n';
  sql += chunk.map(p => `(${p.product_id}, ${esc(p.barcode)}, ${p.brand_id}, ${p.category_id}, ${esc(p.product_name)}, ${esc(p.description)}, ${p.price || 'NULL'}, ${esc(p.currency)}, ${esc(p.image_url)}, ${esc(p.skin_tone)}, ${esc(p.undertone)}, ${esc(p.shade_name)}, ${esc(p.source_url)}, ${esc(p.source_name)}, 1, 1)`).join(',\n') + ';\n\n';
}

// Availability in batches of 200
sql += '\n-- Product Availability\n';
for (let i = 0; i < availabilities.length; i += 200) {
  const chunk = availabilities.slice(i, i + 200);
  sql += 'INSERT INTO product_availability (availability_id, product_id, country, is_available, purchase_link, local_price, currency) VALUES\n';
  sql += chunk.map(a => `(${a.availability_id}, ${a.product_id}, ${esc(a.country)}, ${a.is_available ? 1 : 0}, ${esc(a.purchase_link)}, ${a.local_price}, ${esc(a.currency)})`).join(',\n') + ';\n\n';
}

fs.writeFileSync(path.resolve(process.cwd(), 'seed.sql'), sql, 'utf-8');
console.log(`Exported ${products.length} products across ${categories.length} categories to seed.sql successfully!`);
