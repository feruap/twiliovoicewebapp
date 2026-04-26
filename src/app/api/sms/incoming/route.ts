import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";
import fs from "fs";
import path from "path";
import os from "os";

const SETTINGS_FILE = path.join(os.tmpdir(), "twilio-settings.json");

function getFallbackNumber(): string | undefined {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      if (settings.fallbackNumber) {
        return settings.fallbackNumber;
      }
    }
  } catch {
    // ignore
  }
  return process.env.TWILIO_FALLBACK_NUMBER;
}

// Twilio envía un POST cuando recibimos un SMS
export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  
  const from = params.get("From");
  const to = params.get("To");
  const msgBody = params.get("Body");
  
  console.log(`📩 SMS recibido de ${from}: ${msgBody}`);

  // Reenviar el SMS al número personal (fallback) para notificación offline
  // Prevenir loop: no reenviar si el remitente es el mismo fallback
  const fallbackNumber = getFallbackNumber();
  if (fallbackNumber && twilioClient && from && from !== fallbackNumber) {
    try {
      await twilioClient.messages.create({
        body: `[SMS de ${from}]: ${msgBody}`,
        from: to || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "",
        to: fallbackNumber,
      });
      console.log(`📤 SMS reenviado a ${fallbackNumber}`);
    } catch (err) {
      console.error("Error reenviando SMS:", err);
    }
  }

  // Respuesta TwiML vacía (no auto-responder)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
