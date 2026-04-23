import { NextResponse } from "next/server";

// Twilio envía un POST cuando recibimos un SMS
export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  
  const from = params.get("From");
  const msgBody = params.get("Body");
  
  console.log(`📩 SMS recibido de ${from}: ${msgBody}`);

  // Respuesta TwiML vacía (no auto-responder)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
