import Stripe from 'stripe';

async function getStripeClient(): Promise<Stripe> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;
  if (!hostname || !xReplitToken) throw new Error('Replit env eksik');
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', 'development');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'X-Replit-Token': xReplitToken },
  });
  const data = await res.json() as any;
  return new Stripe(data.items[0].settings.secret, { apiVersion: '2025-08-27.basil' as any });
}

async function main() {
  const stripe = await getStripeClient();
  const updated = await stripe.customers.update('cus_UWwu4tk5b6Mc2r', { name: 'Erdem' });
  console.log(`✓ Müşteri güncellendi`);
  console.log(`  ID    : ${updated.id}`);
  console.log(`  Ad    : ${updated.name}`);
  console.log(`  Email : ${updated.email}`);
  process.exit(0);
}

main().catch(err => { console.error('Hata:', err.message); process.exit(1); });
