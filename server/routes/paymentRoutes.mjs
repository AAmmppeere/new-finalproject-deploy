// routes/paymentRoutes.mjs
import { Router } from "express";
import Stripe from "stripe";
import "dotenv/config";
import generatePayload from "promptpay-qr";
import _ from "lodash";
import QRcode from "qrcode";

const router = Router();

//---------------Stripe Payment---------------/////
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  // Validate amount and currency
  if (!amount || !currency) {
    return res.status(400).send({ error: "Amount and currency are required" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card", "promptpay"], // Ensure this matches your payment method
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("PaymentIntent creation error:", error); // Log error for debugging
    res.status(500).send({
      error: error.message,
    });
  }
});

router.get("/payment-status/:paymentIntentId", async (req, res) => {
  const { paymentIntentId } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.status(200).json({ status: paymentIntent.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//---------------Promptpay Payment---------------/////
// router.post("/generateQR", (req, res) => {
//   // const amount = parseFloat(_.get(req, ["body", "amount"]));
//   const amount = 0.01;
//   // const mobileNumber = "0805406357";
//   const mobileNumber = "0620120860";
//   const payload = generatePayload(mobileNumber, { amount });
//   const option = {
//     color: {
//       dark: "#000",
//       light: "#FFF",
//     },
//   };
//   QRcode.toDataURL(payload, option, (err, url) => {
//     if (err) {
//       return res.status(400).json({
//         message: "Error generating QR Code :",
//         err,
//       });
//     } else {
//       return res.status(200).json({
//         url,
//       });
//     }
//   });
// });
export default router;
