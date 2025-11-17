import { NextResponse } from "next/server";
import { getMembers } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId")?.trim();
  if (!memberId) return NextResponse.json({ error: "No memberId provided" }, { status: 400 });
  const members = await getMembers();
  const member = members.find(m => m.memberId?.toLowerCase() === memberId.toLowerCase());
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ name: member.name, id: member.id });
}
