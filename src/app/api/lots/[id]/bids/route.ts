import { NextRequest } from "next/server";
import { requireAgent } from "@/lib/auth/require-agent";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;

  const lot = await CreditLot.findById(id);
  if (!lot) return errorResponse("Not found", "Lot not found", 404);
  if (lot.status !== "open") {
    return errorResponse("Lot closed", "This lot is not open for bids", 409);
  }

  if (String(lot.sellerAgentId) === String(auth.agent._id)) {
    return errorResponse("Invalid action", "Seller cannot bid on own lot", 400);
  }

  const body = await req.json().catch(() => ({}));
  const { bid_price_per_ton, quantity_tons } = body;

  if (!bid_price_per_ton || !quantity_tons) {
    return errorResponse(
      "Missing fields",
      "Required: bid_price_per_ton, quantity_tons",
      400
    );
  }

  if (Number(quantity_tons) !== lot.quantityTons) {
    return errorResponse(
      "Quantity mismatch",
      `Easy mode requires quantity_tons == ${lot.quantityTons}`,
      400
    );
  }

  const bid = await Bid.create({
    lotId: lot._id,
    buyerAgentId: auth.agent._id,
    bidPricePerTon: Number(bid_price_per_ton),
    quantityTons: Number(quantity_tons),
    status: "active",
  });

  await NegotiationMessage.create({
    lotId: lot._id,
    agentId: auth.agent._id,
    message: `Opening bid: ${Number(quantity_tons)} tons @ $${Number(
      bid_price_per_ton
    )}/ton. Open to counter-offers.`,
  });

  return successResponse({ bid }, 201);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;

  const lot = await CreditLot.findById(id);
  if (!lot) return errorResponse("Not found", "Lot not found", 404);

  if (String(lot.sellerAgentId) !== String(auth.agent._id)) {
    return errorResponse(
      "Forbidden",
      "Only the seller can view bids for this lot",
      403
    );
  }

  const bids = await Bid.find({ lotId: lot._id }).sort({ createdAt: -1 });
  return successResponse({ bids });
}
