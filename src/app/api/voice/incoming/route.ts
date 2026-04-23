import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Cuando alguien llama a tu número de Twilio, Twilio hace POST aquí
export async function POST() {
  const twiml = new VoiceResponse();
  
  // Enrutar la llamada al cliente web
  const dial = twiml.dial();
  dial.client("personal_client_01");
  
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
