import { NextResponse } from "next/server";
import { getTwilioClient } from "@/lib/twilio";

export async function GET() {
  try {
    const client = getTwilioClient();
    const balance = await client.balance.fetch();
    return NextResponse.json({
      balance: balance.balance,
      currency: balance.currency
    });
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    return NextResponse.json({ error: "No se pudo obtener el saldo" }, { status: 500 });
  }
}
