import { Request, Response } from "express";
import { db } from "../db";
import { emailHistory } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export async function handleResendWebhook(req: Request, res: Response) {
  const signature = req.headers["resend-signature"] as string;
  const timestamp = req.headers["resend-timestamp"] as string;
  const body = JSON.stringify(req.body);
  
  // Verify webhook signature
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    return res.status(500).send("Webhook secret not configured");
  }
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
    
  if (signature !== expectedSignature) {
    return res.status(401).send("Invalid signature");
  }
  
  const { type, data } = req.body;
  
  try {
    switch (type) {
      case "email.sent":
      case "email.delivered":
        await db.update(emailHistory)
          .set({ deliveryStatus: "sent" })
          .where(eq(emailHistory.resendId, data.email_id));
        break;
        
      case "email.opened":
        await db.update(emailHistory)
          .set({ openedAt: new Date() })
          .where(eq(emailHistory.resendId, data.email_id));
        break;
        
      case "email.clicked":
        await db.update(emailHistory)
          .set({ clickCount: sql`COALESCE(click_count, 0) + 1` })
          .where(eq(emailHistory.resendId, data.email_id));
        break;
        
      case "email.bounced":
        await db.update(emailHistory)
          .set({ deliveryStatus: "failed" })
          .where(eq(emailHistory.resendId, data.email_id));
        break;
    }
    
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal error");
  }
}