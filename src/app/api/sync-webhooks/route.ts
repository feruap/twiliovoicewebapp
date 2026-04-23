import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";

export async function POST(req: Request) {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    // Determine the base URL of the current application
    // Using x-forwarded-host and x-forwarded-proto because this app is behind Traefik on Coolify
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    
    if (!host) {
      return NextResponse.json({ error: "No se pudo determinar el host de la aplicación" }, { status: 400 });
    }

    const domain = `${protocol}://${host}`;
    const voiceUrl = `${domain}/api/voice/incoming`;
    const smsUrl = `${domain}/api/sms/incoming`;

    const numbers = await twilioClient.incomingPhoneNumbers.list();
    
    for (const num of numbers) {
      await twilioClient.incomingPhoneNumbers(num.sid).update({
        voiceUrl: voiceUrl,
        voiceMethod: "POST",
        smsUrl: smsUrl,
        smsMethod: "POST",
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se sincronizaron ${numbers.length} líneas apuntando a ${domain}` 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
