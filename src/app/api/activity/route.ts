import { connectDB } from "@/lib/db/mongodb";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Trade from "@/lib/models/Trade";
import Agent from "@/lib/models/Agent";
import HumanDisclosure from "@/lib/models/HumanDisclosure";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import { successResponse } from "@/lib/utils/api-helpers";

type ActivityItem = {
  id: string;
  type:
    | "lot_created"
    | "bid_placed"
    | "trade_completed"
    | "negotiation_message"
    | "human_disclosure";
  title: string;
  detail: string;
  createdAt: Date;
};

export async function GET() {
  await connectDB();

  const [lots, bids, trades, messages, disclosures] = await Promise.all([
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
    NegotiationMessage.find({})
      .sort({ createdAt: -1 })
      .limit(14)
      .select("lotId agentId message createdAt")
      .lean(),
    HumanDisclosure.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .select("agentId postType summary benchmarkMarketplace benchmarkPricePerTon createdAt")
      .lean(),
  ]);

  const messageAgentIds = Array.from(new Set(messages.map((m) => String(m.agentId))));
  const messageLotIds = Array.from(new Set(messages.map((m) => String(m.lotId))));

  const disclosureAgentIds = Array.from(new Set(disclosures.map((d) => String(d.agentId))));

  const [messageAgents, messageLots, disclosureAgents] = await Promise.all([
    Agent.find({ _id: { $in: messageAgentIds } }).select("name").lean(),
    CreditLot.find({ _id: { $in: messageLotIds } }).select("projectName").lean(),
    Agent.find({ _id: { $in: disclosureAgentIds } }).select("name").lean(),
  ]);

  const messageAgentMap = new Map(messageAgents.map((a) => [String(a._id), a.name]));
  const messageLotMap = new Map(messageLots.map((lot) => [String(lot._id), lot.projectName]));
  const disclosureAgentMap = new Map(disclosureAgents.map((a) => [String(a._id), a.name]));

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

  const messageItems: ActivityItem[] = messages.map((msg) => {
    const agentName = messageAgentMap.get(String(msg.agentId)) || "Unknown agent";
    const lotName = messageLotMap.get(String(msg.lotId)) || "Unknown lot";
    return {
      id: String(msg._id),
      type: "negotiation_message",
      title: "Negotiation chat",
      detail: `${agentName} on ${lotName}: ${msg.message}`,
      createdAt: msg.createdAt,
    };
  });

  const disclosureItems: ActivityItem[] = disclosures.map((d) => {
    const agentName = disclosureAgentMap.get(String(d.agentId)) || "Unknown agent";
    const label = d.postType === "buy_criteria" ? "Buyer criteria posted" : "Sold disclosure posted";
    const benchmarkPrice =
      d.benchmarkPricePerTon === undefined || d.benchmarkPricePerTon === null
        ? ""
        : ` @ $${d.benchmarkPricePerTon}/ton`;

    return {
      id: String(d._id),
      type: "human_disclosure",
      title: label,
      detail: `${agentName} • ${d.summary} • Benchmark: ${d.benchmarkMarketplace}${benchmarkPrice}`,
      createdAt: d.createdAt,
    };
  });

  const items = [...lotItems, ...bidItems, ...tradeItems, ...messageItems, ...disclosureItems]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 20);

  return successResponse({ items });
}