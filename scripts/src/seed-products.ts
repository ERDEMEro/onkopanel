import Stripe from 'stripe';

async function getStripeClient(): Promise<Stripe> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error('Missing Replit env vars. Ensure Stripe integration is connected.');
  }

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', 'development');

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken },
  });

  const data = await response.json();
  const secretKey = data.items?.[0]?.settings?.secret;
  if (!secretKey) throw new Error('Stripe secret key not found in connection');

  return new Stripe(secretKey, { apiVersion: '2025-08-27.basil' as any });
}

async function seedProducts() {
  const stripe = await getStripeClient();
  console.log('Stripe bağlantısı kuruldu.');

  const existing = await stripe.products.search({
    query: "name:'OnkoPanel Premium' AND active:'true'",
  });

  if (existing.data.length > 0) {
    console.log('OnkoPanel Premium zaten mevcut:', existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    for (const p of prices.data) {
      console.log(`  Fiyat: ${p.id}  ${p.unit_amount}${p.currency}/${(p.recurring as any)?.interval}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'OnkoPanel Premium',
    description: 'YZ Asistan, Beslenme Danışmanı AI planı, Yaşam Kalitesi AI planı, Psikolojik Destek AI planı ve Gelişmiş Analitik özelliklerine tam erişim.',
    metadata: { tier: 'premium' },
  });
  console.log('Ürün oluşturuldu:', product.id);

  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: 'try',
    recurring: { interval: 'month' },
  });
  console.log('Aylık fiyat:', monthly.id, '— 99 TRY/ay');

  const yearly = await stripe.prices.create({
    product: product.id,
    unit_amount: 89900,
    currency: 'try',
    recurring: { interval: 'year' },
  });
  console.log('Yıllık fiyat:', yearly.id, '— 899 TRY/yıl');

  console.log('\nUrunler basariyla olusturuldu!');
}

seedProducts().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});
