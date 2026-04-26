import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = 'force-dynamic';

const settingsFile = path.join(os.tmpdir(), "twilio-settings.json");

// SEC-04: Only these fields are allowed in settings
const ALLOWED_FIELDS = ["fallbackNumber"];

function readSettings(): Record<string, string> {
  // Start with env var defaults
  const defaults: Record<string, string> = {};
  if (process.env.TWILIO_FALLBACK_NUMBER) {
    defaults.fallbackNumber = process.env.TWILIO_FALLBACK_NUMBER;
  }

  // Overlay file-based settings
  try {
    if (fs.existsSync(settingsFile)) {
      const fileSettings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      return { ...defaults, ...fileSettings };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // SEC-04: Whitelist — only accept known fields
    const sanitized: Record<string, string> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body && typeof body[field] === "string") {
        sanitized[field] = body[field].trim();
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para guardar" }, { status: 400 });
    }

    // Read existing to merge
    const currentSettings = readSettings();
    const newSettings = { ...currentSettings, ...sanitized };
    fs.writeFileSync(settingsFile, JSON.stringify(newSettings, null, 2), "utf-8");
    
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error guardando ajustes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
