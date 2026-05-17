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
  const secretKey = data.items?.[0]?.settings?.secret;
  if (!secretKey) throw new Error('Stripe secret key bulunamadı');
  return new Stripe(secretKey, { apiVersion: '2025-08-27.basil' as any });
}

async function grantPremium(email: string) {
  const stripe = await getStripeClient();

  // 1. Ürün ve aktif aylık fiyatı bul
  const products = await stripe.products.search({ query: "name:'OnkoPanel Premium' AND active:'true'" });
  const product = products.data[0];
  if (!product) throw new Error('OnkoPanel Premium ürünü bulunamadı');

  const prices = await stripe.prices.list({ product: product.id, active: true });
  const monthlyPrice = prices.data.find(p => (p.recurring as any)?.interval === 'month');
  if (!monthlyPrice) throw new Error('Aylık fiyat bulunamadı');

  console.log(`Ürün: ${product.name} | Fiyat: ${monthlyPrice.id}`);

  // 2. Müşteri bul veya oluştur
  const existing = await stripe.customers.list({ email, limit: 1 });
  let customer = existing.data[0];
  if (customer) {
    console.log(`Mevcut müşteri: ${customer.id}`);
  } else {
    customer = await stripe.customers.create({ email });
    console.log(`Yeni müşteri oluşturuldu: ${customer.id}`);
  }

  // 3. Zaten aktif aboneliği var mı kontrol et
  const activeSubs = await stripe.subscriptions.list({ customer: customer.id, status: 'active' });
  if (activeSubs.data.length > 0) {
    console.log(`✓ ${email} zaten aktif premium aboneliğe sahip: ${activeSubs.data[0].id}`);
    return;
  }

  // 4. Test modunda ödeme yöntemi oluştur ve abonelik başlat
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: { token: 'tok_visa' },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: monthlyPrice.id }],
    default_payment_method: paymentMethod.id,
  });

  console.log(`✓ Premium abonelik oluşturuldu!`);
  console.log(`  Abonelik ID : ${subscription.id}`);
  console.log(`  Durum       : ${subscription.status}`);
  console.log(`  E-posta     : ${email}`);
}

const email = process.argv[2] || 'eroglu.erdemilhan@gmail.com';
grantPremium(email)
  .then(() => process.exit(0))
  .catch(err => { console.error('Hata:', err.message); process.exit(1); });
