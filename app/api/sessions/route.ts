import { NextResponse } from "next/server";
import { listSessions } from "../../../db/sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      sessions: await listSessions(),
    });
  } catch {
    return NextResponse.json(
      { error: "Session history is temporarily unavailable." },
      { status: 503 },
    );
  }
}
