import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const toParam = params.get("customTo") || params.get("To");
  const fromParam = params.get("customFrom") || params.get("From");
  const to = toParam ? toParam.replace(/ /g, "+") : null;
  const from = fromParam ? fromParam.replace(/ /g, "+") : null;

  const twiml = new VoiceResponse();
  const myTwilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

  if (to === myTwilioNumber) {
    // Llamada entrante al número Twilio principal → enrutar al cliente web
    const dial = twiml.dial();
    dial.client("personal_client_01");
  } else if (to) {
    // Llamada saliente desde la app → marcar el número destino
    const dial = twiml.dial({ callerId: from || myTwilioNumber });
    dial.number(to);
  } else {
    twiml.say("Gracias por llamar. Adiós.");
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
