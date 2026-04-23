import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";

export async function GET() {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list();
    
    const simplified = numbers.map(n => ({
      phone: n.phoneNumber,
      friendlyName: n.friendlyName
    }));

    return NextResponse.json(simplified);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
