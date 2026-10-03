import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// ?ready=1 also checks the database (readiness); without it this is a liveness check.
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("ready") !== "1") {
    return NextResponse.json({ ok: true });
  }
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
