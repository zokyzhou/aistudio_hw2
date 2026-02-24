import { NextRequest } from "next/server";
import { requireAgent } from "@/lib/auth/require-agent";
import Bid from "@/lib/models/Bid";
import CreditLot from "@/lib/models/CreditLot";
import Trade from "@/lib/models/Trade";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const bid = await Bid.findById(params.id);
  if (!bid) return errorResponse("Not found", "Bid not found", 404);
  if (bid.status !== "active")
    return errorResponse("Not active", "Only active bids can be accepted", 409);

  const lot = await CreditLot.findById(bid.lotId);
  if (!lot) return errorResponse("Not found", "Lot not found", 404);

  if (String(lot.sellerAgentId) !== String(auth.agent._id)) {
    return errorResponse("Forbidden", "Only the seller can accept a bid", 403);
  }
  if (lot.status !== "open")
    return errorResponse("Lot closed", "Lot is not open", 409);

  bid.status = "accepted";
  await bid.save();

  // reject other bids
  await Bid.updateMany(
    { lotId: lot._id, _id: { $ne: bid._id }, status: "active" },
    { $set: { status: "rejected" } }
  );

  lot.status = "sold";
  await lot.save();

  const trade = await Trade.create({
    lotId: lot._id,
    buyerAgentId: bid.buyerAgentId,
    sellerAgentId: lot.sellerAgentId,
    agreedPricePerTon: bid.bidPricePerTon,
    quantityTons: bid.quantityTons,
    status: "pending_settlement",
  });

  return successResponse({ trade });
}
