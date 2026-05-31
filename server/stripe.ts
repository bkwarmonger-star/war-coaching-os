import Stripe from "stripe";
import { Express, Request, Response } from "express";
import { getDb } from "./db";
import { payments } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export function registerStripeRoutes(app: Express) {
  // Stripe webhook endpoint - MUST use raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express_raw(),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      // Process events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;
          const db = await getDb();
          if (db && userId) {
            await db.insert(payments).values({
              trainerId: 1, // Default trainer
              clientId: parseInt(userId),
              stripePaymentIntentId: session.payment_intent as string || session.id,
              stripeCustomerId: session.customer as string || null,
              amount: ((session.amount_total || 0) / 100).toFixed(2),
              status: "succeeded",
              paymentType: session.metadata?.service_id ? "service" : "package",
            });
          }
          console.log(`[Stripe] Payment completed for user ${userId}: $${(session.amount_total || 0) / 100}`);
          break;
        }
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe] PaymentIntent succeeded: ${paymentIntent.id}`);
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe] PaymentIntent failed: ${paymentIntent.id}`);
          break;
        }
        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    }
  );
}

// Helper to create raw body parser for webhook
function express_raw() {
  return (req: Request, res: Response, next: Function) => {
    if (req.headers["content-type"] === "application/json") {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        (req as any).body = data;
        next();
      });
    } else {
      next();
    }
  };
}

// Create a checkout session for a service or package
export async function createCheckoutSession(options: {
  serviceId?: number;
  packageId?: number;
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
  description: string;
  amount: number; // in cents
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: options.description,
          },
          unit_amount: options.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${options.origin}/consultations?success=true`,
    cancel_url: `${options.origin}/consultations?canceled=true`,
    customer_email: options.userEmail,
    client_reference_id: options.userId.toString(),
    metadata: {
      user_id: options.userId.toString(),
      customer_email: options.userEmail,
      customer_name: options.userName,
      service_id: options.serviceId?.toString() || "",
      package_id: options.packageId?.toString() || "",
      description: options.description,
    },
    allow_promotion_codes: true,
  });

  return session;
}

export { stripe };
