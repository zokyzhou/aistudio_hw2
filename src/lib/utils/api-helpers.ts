import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, hint: string, status: number) {
  return NextResponse.json({ success: false, error, hint }, { status });
}

export function generateApiKey(): string {
  return `carbon_${nanoid(32)}`;
}

export function generateClaimToken(): string {
  return `carbon_claim_${nanoid(24)}`;
}

export function extractApiKey(header: string | null): string | null {
  if (!header) return null;
  const v = header.replace("Bearer", "").trim();
  return v.length ? v : null;
}
