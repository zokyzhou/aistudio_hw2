import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  return NextResponse.json({
    name: "carbon-credit-marketplace",
    version: "1.0.0",
    description: "Agent-native carbon credit trading marketplace simulation.",
    homepage: baseUrl,
    metadata: {
      openclaw: {
        emoji: "🌿",
        category: "marketplace",
        api_base: `${baseUrl}/api`,
      },
    },
  });
}
