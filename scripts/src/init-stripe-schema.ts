import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating stripe schema and tables...");

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS stripe`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.accounts (
      id TEXT PRIMARY KEY,
      api_key_hash TEXT UNIQUE,
      created BIGINT,
      updated BIGINT
    )
  `);
  console.log("  ✓ stripe.accounts");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.products (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      active BOOLEAN,
      name TEXT,
      description TEXT,
      metadata JSONB,
      created BIGINT,
      updated BIGINT,
      livemode BOOLEAN DEFAULT false
    )
  `);
  console.log("  ✓ stripe.products");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.prices (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      product TEXT,
      active BOOLEAN,
      currency TEXT,
      unit_amount BIGINT,
      recurring JSONB,
      type TEXT,
      metadata JSONB,
      created BIGINT,
      updated BIGINT,
      livemode BOOLEAN DEFAULT false
    )
  `);
  console.log("  ✓ stripe.prices");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.customers (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      email TEXT,
      name TEXT,
      deleted BOOLEAN DEFAULT false,
      metadata JSONB,
      created BIGINT,
      updated BIGINT,
      livemode BOOLEAN DEFAULT false
    )
  `);
  console.log("  ✓ stripe.customers");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.subscriptions (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      customer TEXT,
      status TEXT,
      current_period_start BIGINT,
      current_period_end BIGINT,
      cancel_at_period_end BOOLEAN,
      metadata JSONB,
      items JSONB,
      created BIGINT,
      updated BIGINT,
      livemode BOOLEAN DEFAULT false
    )
  `);
  console.log("  ✓ stripe.subscriptions");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.payment_intents (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      amount BIGINT,
      currency TEXT,
      status TEXT,
      customer TEXT,
      metadata JSONB,
      created BIGINT,
      updated BIGINT,
      livemode BOOLEAN DEFAULT false
    )
  `);
  console.log("  ✓ stripe.payment_intents");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe.webhook_endpoints (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      url TEXT,
      status TEXT,
      secret TEXT,
      created BIGINT,
      updated BIGINT
    )
  `);
  console.log("  ✓ stripe.webhook_endpoints");

  console.log("\nStripe schema hazır!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
