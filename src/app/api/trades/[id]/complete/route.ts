import { NextRequest } from "next/server";
import { requireAgent } from "@/lib/auth/require-agent";
import Trade from "@/lib/models/Trade";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const trade = await Trade.findById(params.id);
  if (!trade) return errorResponse("Not found", "Trade not found", 404);

  const me = String(auth.agent._id);
  const isParty = me === String(trade.buyerAgentId) || me === String(trade.sellerAgentId);
  if (!isParty) return errorResponse("Forbidden", "Only buyer or seller can complete a trade", 403);

  if (trade.status !== "pending_settlement") {
    return errorResponse("Not allowed", "Only pending_settlement trades can be completed", 409);
  }

  trade.status = "completed";
  await trade.save();

  return successResponse({ trade });
}
