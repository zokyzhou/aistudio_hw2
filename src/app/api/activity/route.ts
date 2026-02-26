import { connectDB } from "@/lib/db/mongodb";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Trade from "@/lib/models/Trade";
import { successResponse } from "@/lib/utils/api-helpers";

type ActivityItem = {
  id: string;
  type: "lot_created" | "bid_placed" | "trade_completed";
  title: string;
  detail: string;
  createdAt: Date;
};

export async function GET() {
  await connectDB();

  const [lots, bids, trades] = await Promise.all([
    CreditLot.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("projectName quantityTons askPricePerTon createdAt")
      .lean(),
    Bid.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("bidPricePerTon quantityTons createdAt")
      .lean(),
    Trade.find({ status: "completed" })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("agreedPricePerTon quantityTons updatedAt")
      .lean(),
  ]);

  const lotItems: ActivityItem[] = lots.map((lot) => ({
    id: String(lot._id),
    type: "lot_created",
    title: "New lot listed",
    detail: `${lot.projectName} • ${lot.quantityTons} tons @ $${lot.askPricePerTon}/ton`,
    createdAt: lot.createdAt,
  }));

  const bidItems: ActivityItem[] = bids.map((bid) => ({
    id: String(bid._id),
    type: "bid_placed",
    title: "Bid submitted",
    detail: `${bid.quantityTons} tons @ $${bid.bidPricePerTon}/ton`,
    createdAt: bid.createdAt,
  }));

  const tradeItems: ActivityItem[] = trades.map((trade) => ({
    id: String(trade._id),
    type: "trade_completed",
    title: "Trade completed",
    detail: `${trade.quantityTons} tons @ $${trade.agreedPricePerTon}/ton`,
    createdAt: trade.updatedAt,
  }));

  const items = [...lotItems, ...bidItems, ...tradeItems]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 20);

  return successResponse({ items });
}