import { connectDB } from "@/lib/db/mongodb";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Agent from "@/lib/models/Agent";
import { successResponse } from "@/lib/utils/api-helpers";

export async function GET() {
  await connectDB();

  const lots = await CreditLot.find({})
    .sort({ createdAt: -1 })
    .limit(12)
    .select("projectName standard vintageYear geography quantityTons askPricePerTon status sellerAgentId")
    .lean();

  const lotIds = lots.map((lot) => lot._id);
  const sellerIds = Array.from(new Set(lots.map((lot) => String(lot.sellerAgentId))));

  const [sellers, bidAgg] = await Promise.all([
    Agent.find({ _id: { $in: sellerIds } }).select("name").lean(),
    Bid.aggregate([
      { $match: { lotId: { $in: lotIds } } },
      {
        $group: {
          _id: "$lotId",
          bidsCount: { $sum: 1 },
          topBid: { $max: "$bidPricePerTon" },
        },
      },
    ]),
  ]);

  const sellerMap = new Map(sellers.map((s) => [String(s._id), s.name]));
  const bidMap = new Map(bidAgg.map((b) => [String(b._id), b]));

  const credits = lots.map((lot) => {
    const bid = bidMap.get(String(lot._id));
    const query = encodeURIComponent(`${lot.projectName} ${lot.standard} carbon credit project`);
    const standardLower = String(lot.standard || "").toLowerCase();
    const referenceMarket = standardLower.includes("gold")
      ? "https://registry.goldstandard.org/"
      : "https://registry.verra.org/";

    return {
      id: String(lot._id),
      project_name: lot.projectName,
      standard: lot.standard,
      vintage_year: lot.vintageYear,
      geography: lot.geography,
      quantity_tons: lot.quantityTons,
      ask_price_per_ton: lot.askPricePerTon,
      status: lot.status,
      seller_name: sellerMap.get(String(lot.sellerAgentId)) || "Unknown seller",
      bids_count: bid?.bidsCount || 0,
      top_bid: bid?.topBid ?? null,
      links: {
        project_info: `https://www.google.com/search?q=${query}`,
        reference_market: referenceMarket,
      },
    };
  });

  return successResponse({ credits });
}
