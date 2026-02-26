// app/api/agents/claim/[token]/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await connectDB();
  const { token } = await params;
  const agent = await Agent.findOne({ claimToken: token });
  if (!agent) return errorResponse("Invalid token", "Ask your agent to re-generate a claim link", 404);

  agent.claimStatus = "claimed";
  await agent.save();

  return successResponse({
    agent: { name: agent.name, description: agent.description, claimStatus: agent.claimStatus },
  });
}
