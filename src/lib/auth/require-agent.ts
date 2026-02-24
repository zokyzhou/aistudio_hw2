import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import { errorResponse, extractApiKey } from "@/lib/utils/api-helpers";

export async function requireAgent(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get("authorization"));
  if (!apiKey) {
    return {
      ok: false as const,
      res: errorResponse(
        "Missing API key",
        "Include Authorization: Bearer YOUR_API_KEY",
        401
      ),
    };
  }

  const agent = await Agent.findOne({ apiKey });
  if (!agent) {
    return {
      ok: false as const,
      res: errorResponse("Invalid API key", "Agent not found", 401),
    };
  }

  agent.lastActive = new Date();
  await agent.save();

  return { ok: true as const, agent };
}
