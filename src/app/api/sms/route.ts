import { NextResponse } from "next/server";
import { twilioClient, myTwilioNumber } from "@/lib/twilio";

export async function GET() {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    const messages = await twilioClient.messages.list({ limit: 200 });

    // Agrupar mensajes por conversación (número remoto)
    const conversations: Record<string, {
      phone: string;
      messages: typeof messages;
      lastMessage: string;
      lastDate: Date;
    }> = {};

    for (const msg of messages) {
      const remoteNumber = msg.direction === "inbound" ? msg.from : msg.to;
      if (!conversations[remoteNumber]) {
        conversations[remoteNumber] = {
          phone: remoteNumber,
          messages: [],
          lastMessage: msg.body || "",
          lastDate: msg.dateCreated || new Date(),
        };
      }
      conversations[remoteNumber].messages.push(msg);
      const msgDate = msg.dateCreated || new Date();
      if (msgDate > conversations[remoteNumber].lastDate) {
        conversations[remoteNumber].lastDate = msgDate;
        conversations[remoteNumber].lastMessage = msg.body || "";
      }
    }

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    const { to, body } = await req.json();
    
    if (!to || !body) {
      return NextResponse.json({ error: "Faltan parámetros (to, body)" }, { status: 400 });
    }

    const message = await twilioClient.messages.create({
      body: body,
      from: myTwilioNumber,
      to: to,
    });

    return NextResponse.json({
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
