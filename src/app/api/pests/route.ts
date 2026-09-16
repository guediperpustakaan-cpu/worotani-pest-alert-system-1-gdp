import { NextResponse } from "next/server";
import { getPests } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const data = await getPests(query);
  return NextResponse.json({ pests: data });
}
