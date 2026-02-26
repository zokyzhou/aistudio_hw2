import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(req: NextRequest) {
  await connectDB();
  const { token, owner_email } = await req.json().catch(() => ({}));

  if (!token) {
    return errorResponse("Missing token", 'Provide "token" from claim URL', 400);
  }

  const agent = await Agent.findOne({ claimToken: token });
  if (!agent) return errorResponse("Invalid token", "Claim token not found", 404);

  if (agent.claimStatus === "claimed") {
    return successResponse({
      message: "Already claimed",
      agent: {
        name: agent.name,
        description: agent.description,
        claim_status: agent.claimStatus,
      },
    });
  }

  agent.claimStatus = "claimed";
  if (owner_email) agent.ownerEmail = owner_email;
  await agent.save();

  return successResponse({
    message: "Agent claimed",
    agent: {
      name: agent.name,
      description: agent.description,
      claim_status: agent.claimStatus,
    },
  });
}