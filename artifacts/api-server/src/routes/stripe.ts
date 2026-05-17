import { Router } from "express";
import { stripeStorage } from "../stripeStorage";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";

const router = Router();

router.get("/stripe/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stripe/products", async (_req, res) => {
  try {
    const products = await stripeStorage.listProductsWithPrices();
    res.json({ data: products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stripe/subscription", async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.email) { res.json({ subscription: null }); return; }
    const customer = await stripeStorage.getCustomerByEmail(req.user.email);
    if (!customer) { res.json({ subscription: null }); return; }
    const subscription = await stripeStorage.getSubscriptionByCustomerId(customer.id as string);
    res.json({ subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/checkout", async (req: any, res): Promise<void> => {
  try {
    const { priceId } = req.body;
    if (!priceId) { res.status(400).json({ error: "priceId required" }); return; }

    const stripe = await getUncachableStripeClient();
    const userEmail = req.user?.email;

    let customerId: string | undefined;
    if (userEmail) {
      const existing = await stripeStorage.getCustomerByEmail(userEmail);
      if (existing) {
        customerId = existing.id as string;
      } else {
        const customer = await stripe.customers.create({ email: userEmail });
        customerId = customer.id;
      }
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?premium=success`,
      cancel_url: `${baseUrl}/?premium=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/portal", async (req: any, res): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) { res.status(401).json({ error: "Not authenticated" }); return; }

    const customer = await stripeStorage.getCustomerByEmail(userEmail);
    if (!customer) { res.status(404).json({ error: "No subscription found" }); return; }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id as string,
      return_url: `${baseUrl}/`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
