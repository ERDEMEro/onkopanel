import { getUncachableStripeClient } from './stripeClient';

export class StripeStorage {
  async listProductsWithPrices() {
    const stripe = await getUncachableStripeClient();

    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 20 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);

    return products.data.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      prices: prices.data
        .filter((p) => p.product === product.id)
        .map((p) => ({
          id: p.id,
          unit_amount: p.unit_amount,
          currency: p.currency,
          recurring: p.recurring,
        })),
    }));
  }

  async getCustomerByEmail(email: string) {
    const stripe = await getUncachableStripeClient();
    const customers = await stripe.customers.list({ email, limit: 1 });
    return customers.data[0] || null;
  }

  async getSubscriptionByCustomerId(customerId: string) {
    const stripe = await getUncachableStripeClient();

    const active = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    if (active.data.length > 0) return active.data[0];

    const trialing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'trialing',
      limit: 1,
    });
    return trialing.data[0] || null;
  }
}

export const stripeStorage = new StripeStorage();
