import { connectDB } from "@/lib/db/mongodb";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Trade from "@/lib/models/Trade";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import Agent from "@/lib/models/Agent";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  await connectDB();
  const { id } = await ctx.params;

  const lot = await CreditLot.findById(id).lean();
  if (!lot) return errorResponse("Not found", "Lot not found", 404);

  const [seller, bidStats, recentTrade, messages] = await Promise.all([
    Agent.findById(lot.sellerAgentId).select("name role").lean(),
    Bid.aggregate([
      { $match: { lotId: lot._id } },
      {
        $group: {
          _id: "$lotId",
          bids_count: { $sum: 1 },
          highest_bid: { $max: "$bidPricePerTon" },
          lowest_bid: { $min: "$bidPricePerTon" },
        },
      },
    ]),
    Trade.findOne({ lotId: lot._id })
      .sort({ createdAt: -1 })
      .select("agreedPricePerTon status createdAt")
      .lean(),
    NegotiationMessage.find({ lotId: lot._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("message createdAt")
      .lean(),
  ]);

  const stats = bidStats[0] || { bids_count: 0, highest_bid: null, lowest_bid: null };

  return successResponse({
    lot: {
      id: String(lot._id),
      project_name: lot.projectName,
      standard: lot.standard,
      vintage_year: lot.vintageYear,
      geography: lot.geography,
      quantity_tons: lot.quantityTons,
      ask_price_per_ton: lot.askPricePerTon,
      status: lot.status,
      seller: {
        id: String(lot.sellerAgentId),
        name: seller?.name || "Unknown seller",
        role: seller?.role || "seller",
      },
      market_snapshot: {
        bids_count: stats.bids_count,
        highest_bid: stats.highest_bid,
        lowest_bid: stats.lowest_bid,
        latest_trade_price: recentTrade?.agreedPricePerTon ?? null,
        latest_trade_status: recentTrade?.status ?? null,
      },
      recent_chat: messages.reverse().map((m) => ({
        message: m.message,
        createdAt: m.createdAt,
      })),
    },
  });
}
