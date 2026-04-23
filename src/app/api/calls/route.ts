import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";

export async function GET() {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    const calls = await twilioClient.calls.list({ limit: 100 });

    const simplified = calls.map((c) => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      status: c.status,
      direction: c.direction,
      duration: c.duration,
      startTime: c.startTime,
      endTime: c.endTime,
      dateCreated: c.dateCreated,
    }));

    return NextResponse.json(simplified);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
