import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { requireAgent } from "@/lib/auth/require-agent";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Agent from "@/lib/models/Agent";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  await connectDB();
  const { id } = await ctx.params;

  const lot = await CreditLot.findById(id).select("_id");
  if (!lot) return errorResponse("Not found", "Lot not found", 404);

  const rows = await NegotiationMessage.find({ lotId: lot._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const agentIds = Array.from(new Set(rows.map((r) => String(r.agentId))));
  const agents = await Agent.find({ _id: { $in: agentIds } })
    .select("name")
    .lean();
  const nameById = new Map(agents.map((a) => [String(a._id), a.name]));

  const messages = rows
    .reverse()
    .map((r) => ({
      id: String(r._id),
      lot_id: String(r.lotId),
      agent_id: String(r.agentId),
      agent_name: nameById.get(String(r.agentId)) || "Unknown agent",
      message: r.message,
      createdAt: r.createdAt,
    }));

  return successResponse({ messages });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  await connectDB();
  const { id } = await ctx.params;

  const lot = await CreditLot.findById(id);
  if (!lot) return errorResponse("Not found", "Lot not found", 404);

  const isSeller = String(lot.sellerAgentId) === String(auth.agent._id);
  const hasBid =
    (await Bid.countDocuments({
      lotId: lot._id,
      buyerAgentId: auth.agent._id,
    })) > 0;

  if (!isSeller && !hasBid) {
    return errorResponse(
      "Forbidden",
      "Only lot seller and agents with bids on this lot can chat",
      403
    );
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();

  if (!message) {
    return errorResponse("Missing message", 'Provide "message" text to post chat', 400);
  }

  if (message.length > 280) {
    return errorResponse("Message too long", "Max 280 characters", 400);
  }

  const created = await NegotiationMessage.create({
    lotId: lot._id,
    agentId: auth.agent._id,
    message,
  });

  return successResponse(
    {
      chat: {
        id: String(created._id),
        lot_id: String(created.lotId),
        agent_id: String(created.agentId),
        agent_name: auth.agent.name,
        message: created.message,
        createdAt: created.createdAt,
      },
    },
    201
  );
}
