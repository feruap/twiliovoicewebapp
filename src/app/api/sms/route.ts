import { NextResponse } from "next/server";
import { twilioClient, myTwilioNumber } from "@/lib/twilio";

export async function GET() {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
  }

  try {
    const messages = await twilioClient.messages.list({ limit: 200 });

    // Agrupar mensajes por conversación (número remoto + número local)
    const conversations: Record<string, {
      phone: string;
      localPhone: string;
      messages: typeof messages;
      lastMessage: string;
      lastDate: Date;
    }> = {};

    for (const msg of messages) {
      const isOutbound = msg.direction === "outbound-api" || msg.direction === "outbound-call" || msg.direction === "outbound-reply";
      const remoteNumber = isOutbound ? msg.to : msg.from;
      const localNumber = isOutbound ? msg.from : msg.to;
      const convoKey = `${localNumber}_${remoteNumber}`;

      if (!conversations[convoKey]) {
        conversations[convoKey] = {
          phone: remoteNumber,
          localPhone: localNumber,
          messages: [],
          lastMessage: msg.body || "",
          lastDate: msg.dateCreated || new Date(),
        };
      }
      conversations[convoKey].messages.push(msg);
      const msgDate = msg.dateCreated || new Date();
      if (msgDate > conversations[convoKey].lastDate) {
        conversations[convoKey].lastDate = msgDate;
        conversations[convoKey].lastMessage = msg.body || "";
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
    const { to, body, from } = await req.json();
    
    if (!to || !body) {
      return NextResponse.json({ error: "Faltan parámetros (to, body)" }, { status: 400 });
    }

    const message = await twilioClient.messages.create({
      body: body,
      from: from || myTwilioNumber,
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
