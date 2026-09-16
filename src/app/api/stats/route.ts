import { NextResponse } from "next/server";
import { getAnalytics, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("include") === "analytics") {
    const [stats, analytics] = await Promise.all([getStats(), getAnalytics()]);
    return NextResponse.json({ stats, analytics });
  }
  const stats = await getStats();
  return NextResponse.json({ stats });
}
