import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Cuando alguien llama a tu número de Twilio, Twilio hace POST aquí
export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const dialCallStatus = params.get("DialCallStatus");

  const twiml = new VoiceResponse();
  
  let fallbackNumber = process.env.TWILIO_FALLBACK_NUMBER;
  try {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const settingsFile = path.join(os.tmpdir(), "twilio-settings.json");
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      if (settings.fallbackNumber) {
        fallbackNumber = settings.fallbackNumber;
      }
    }
  } catch (e) {
    // ignore
  }

  // Si ya intentamos llamar al cliente web y no contestó (o falló), desviamos
  if (dialCallStatus && dialCallStatus !== "completed") {
    if (fallbackNumber) {
      twiml.say({ language: "es-MX" }, "Desviando llamada, un momento por favor.");
      twiml.dial(fallbackNumber);
    } else {
      twiml.say({ language: "es-MX" }, "El cliente no está disponible en este momento. Por favor intente más tarde.");
    }
    return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } });
  }

  // Primera pasada: Enrutar la llamada al cliente web PWA
  // Establecemos timeout de 20s y enviamos la respuesta de vuelta a esta misma ruta
  const dial = twiml.dial({ 
    timeout: 20, 
    action: "/api/voice/incoming", // Vuelve a llamar a este endpoint cuando termine o falle
    method: "POST" 
  });
  dial.client("personal_client_01");
  
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
