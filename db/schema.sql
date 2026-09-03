-- Kabab Kitchen. Run this once against your Neon database.
-- Neon console -> SQL Editor -> paste -> Run.

CREATE TABLE IF NOT EXISTS staff (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',   -- 'owner' | 'staff'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the hash of a session token is stored, so a database leak cannot be
-- replayed as a login.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,           -- short human reference, e.g. KK-4821
  status         TEXT NOT NULL DEFAULT 'new',    -- new|accepted|preparing|out|delivered|cancelled
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  address        TEXT NOT NULL,
  payment_method TEXT NOT NULL,                  -- 'cod' | 'upi'
  coupon_code    TEXT,
  subtotal       INTEGER NOT NULL DEFAULT 0,
  discount       INTEGER NOT NULL DEFAULT 0,
  tax            INTEGER NOT NULL DEFAULT 0,
  delivery_fee   INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  free_item      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id          INTEGER,
  name             TEXT NOT NULL,
  variant          TEXT,
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit_price       INTEGER NOT NULL DEFAULT 0,
  addons           JSONB NOT NULL DEFAULT '[]'::jsonb,
  cooking_request  TEXT
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
