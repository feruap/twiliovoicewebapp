import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = 'force-dynamic';

const settingsFile = path.join(os.tmpdir(), "twilio-settings.json");

export async function GET() {
  try {
    if (!fs.existsSync(settingsFile)) {
      return NextResponse.json({ fallbackNumber: "" });
    }
    const data = fs.readFileSync(settingsFile, "utf-8");
    const settings = JSON.parse(data);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ fallbackNumber: "" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Read existing to merge
    let currentSettings = {};
    if (fs.existsSync(settingsFile)) {
      try {
        currentSettings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      } catch (e) {
        // ignore
      }
    }

    const newSettings = { ...currentSettings, ...body };
    fs.writeFileSync(settingsFile, JSON.stringify(newSettings, null, 2), "utf-8");
    
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error guardando ajustes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
