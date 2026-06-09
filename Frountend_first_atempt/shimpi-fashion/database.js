/**
 * SHIMPI Fashion – Database Layer (SQLite via better-sqlite3)
 * To swap to PostgreSQL/MySQL, replace this file with the appropriate driver
 * and keep the same exported interface: { getDb, initializeDatabase }
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/shimpi_fashion.db');

// Ensure data directory exists
const dataDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

/** Returns (and lazily creates) the singleton DB connection. */
const getDb = () => {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');   // better concurrency
    db.pragma('foreign_keys = ON');    // enforce FK constraints
  }
  return db;
};

/** Creates all tables if they don't already exist. Call once at startup. */
const initializeDatabase = () => {
  const db = getDb();

  db.exec(`
    /* ── Users ───────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password      TEXT    NOT NULL,
      phone         TEXT,
      role          TEXT    DEFAULT 'customer'
                            CHECK(role IN ('customer','admin','tailor')),
      is_active     INTEGER DEFAULT 1,
      profile_image TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── User Addresses ──────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS user_addresses (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      label         TEXT    DEFAULT 'Home',
      address_line1 TEXT    NOT NULL,
      address_line2 TEXT,
      city          TEXT    NOT NULL,
      state         TEXT    NOT NULL,
      pincode       TEXT    NOT NULL,
      country       TEXT    DEFAULT 'India',
      is_default    INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    /* ── Fabrics ─────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS fabrics (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      description       TEXT,
      color             TEXT,
      pattern           TEXT,
      material          TEXT,
      weight            TEXT,
      care_instructions TEXT,
      price_per_meter   REAL    NOT NULL,
      stock_meters      REAL    DEFAULT 0,
      image_url         TEXT,
      is_active         INTEGER DEFAULT 1,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Clothing Types (Products) ───────────────────────────── */
    CREATE TABLE IF NOT EXISTS clothing_types (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      description     TEXT,
      category        TEXT,
      base_price      REAL    NOT NULL,
      estimated_days  INTEGER DEFAULT 7,
      image_url       TEXT,
      is_active       INTEGER DEFAULT 1,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Customer Measurement Profiles ──────────────────────── */
    CREATE TABLE IF NOT EXISTS measurements (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL,
      profile_name   TEXT    DEFAULT 'My Measurements',
      chest          REAL,
      waist          REAL,
      hips           REAL,
      shoulder       REAL,
      sleeve_length  REAL,
      trouser_length REAL,
      inseam         REAL,
      neck           REAL,
      wrist          REAL,
      back_length    REAL,
      unit           TEXT    DEFAULT 'inches' CHECK(unit IN ('inches','cm')),
      notes          TEXT,
      is_default     INTEGER DEFAULT 0,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    /* ── Cart Items ──────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS cart_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      clothing_type_id INTEGER NOT NULL,
      fabric_id        INTEGER NOT NULL,
      measurement_id   INTEGER,
      quantity         INTEGER DEFAULT 1,
      custom_notes     TEXT,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)          REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (clothing_type_id) REFERENCES clothing_types(id),
      FOREIGN KEY (fabric_id)        REFERENCES fabrics(id),
      FOREIGN KEY (measurement_id)   REFERENCES measurements(id)
    );

    /* ── Orders ──────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS orders (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number        TEXT    UNIQUE NOT NULL,
      user_id             INTEGER NOT NULL,
      subtotal            REAL    NOT NULL,
      discount_amount     REAL    DEFAULT 0,
      tax_amount          REAL    DEFAULT 0,
      final_amount        REAL    NOT NULL,
      coupon_code         TEXT,
      status              TEXT    DEFAULT 'pending'
                                  CHECK(status IN ('pending','confirmed','cutting',
                                                   'stitching','quality_check','ready',
                                                   'dispatched','delivered','cancelled')),
      delivery_address_id INTEGER,
      special_instructions TEXT,
      estimated_delivery  DATE,
      tailor_id           INTEGER,
      payment_status      TEXT    DEFAULT 'pending'
                                  CHECK(payment_status IN ('pending','partial','paid','refunded')),
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)             REFERENCES users(id),
      FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id),
      FOREIGN KEY (tailor_id)           REFERENCES users(id)
    );

    /* ── Order Items ─────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS order_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL,
      clothing_type_id INTEGER NOT NULL,
      fabric_id        INTEGER NOT NULL,
      measurement_id   INTEGER,
      quantity         INTEGER DEFAULT 1,
      unit_price       REAL    NOT NULL,
      total_price      REAL    NOT NULL,
      custom_notes     TEXT,
      FOREIGN KEY (order_id)           REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (clothing_type_id)   REFERENCES clothing_types(id),
      FOREIGN KEY (fabric_id)          REFERENCES fabrics(id),
      FOREIGN KEY (measurement_id)     REFERENCES measurements(id)
    );

    /* ── Order Status History ────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS order_status_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      status     TEXT    NOT NULL,
      note       TEXT,
      changed_by INTEGER,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    /* ── Appointments ────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS appointments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      tailor_id        INTEGER,
      order_id         INTEGER,
      appointment_type TEXT    NOT NULL
                               CHECK(appointment_type IN
                                     ('measurement','fitting','delivery','consultation')),
      scheduled_at     DATETIME NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      status           TEXT    DEFAULT 'scheduled'
                               CHECK(status IN ('scheduled','confirmed','completed',
                                                'cancelled','no_show')),
      location         TEXT,
      notes            TEXT,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tailor_id) REFERENCES users(id),
      FOREIGN KEY (order_id)  REFERENCES orders(id)
    );

    /* ── Reviews ─────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS reviews (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      order_id         INTEGER,
      clothing_type_id INTEGER,
      rating           INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      title            TEXT,
      comment          TEXT,
      is_verified      INTEGER DEFAULT 0,
      is_visible       INTEGER DEFAULT 1,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)          REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id)         REFERENCES orders(id),
      FOREIGN KEY (clothing_type_id) REFERENCES clothing_types(id)
    );

    /* ── Payments ────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS payments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL,
      amount           REAL    NOT NULL,
      payment_method   TEXT    CHECK(payment_method IN
                               ('cash','card','upi','netbanking','wallet')),
      status           TEXT    DEFAULT 'pending'
                               CHECK(status IN ('pending','success','failed','refunded')),
      transaction_id   TEXT,
      gateway_response TEXT,
      paid_at          DATETIME,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    /* ── Coupons ─────────────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS coupons (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      code           TEXT    UNIQUE NOT NULL,
      description    TEXT,
      discount_type  TEXT    CHECK(discount_type IN ('percentage','flat')),
      discount_value REAL    NOT NULL,
      min_order_value REAL   DEFAULT 0,
      max_discount   REAL,
      usage_limit    INTEGER,
      used_count     INTEGER DEFAULT 0,
      is_active      INTEGER DEFAULT 1,
      expires_at     DATETIME,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* ── Notifications ───────────────────────────────────────── */
    CREATE TABLE IF NOT EXISTS notifications (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL,
      title          TEXT    NOT NULL,
      message        TEXT    NOT NULL,
      type           TEXT    DEFAULT 'general',
      is_read        INTEGER DEFAULT 0,
      reference_id   INTEGER,
      reference_type TEXT,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('✅  Database schema ready');
  return db;
};

module.exports = { getDb, initializeDatabase };
