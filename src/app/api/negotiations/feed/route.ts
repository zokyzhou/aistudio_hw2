import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import CreditLot from "@/lib/models/CreditLot";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import { successResponse } from "@/lib/utils/api-helpers";

type ConversationTag = "quality" | "project" | "price" | "general";

function inferTag(text: string): ConversationTag {
  const lower = text.toLowerCase();
  if (/(quality|additionality|verification|methodology|vintage|standard)/.test(lower)) {
    return "quality";
  }
  if (/(project|developer|location|geography|co-benefit|registry)/.test(lower)) {
    return "project";
  }
  if (/(price|\$|offer|discount|counter|ton)/.test(lower)) {
    return "price";
  }
  return "general";
}

export async function GET() {
  await connectDB();

  const rows = await NegotiationMessage.find({})
    .sort({ createdAt: -1 })
    .limit(120)
    .lean();

  const lotIds = Array.from(new Set(rows.map((row) => String(row.lotId))));
  const agentIds = Array.from(new Set(rows.map((row) => String(row.agentId))));

  const [lots, agents] = await Promise.all([
    CreditLot.find({ _id: { $in: lotIds } })
      .select("projectName askPricePerTon quantityTons")
      .lean(),
    Agent.find({ _id: { $in: agentIds } }).select("name").lean(),
  ]);

  const lotMap = new Map(lots.map((lot) => [String(lot._id), lot]));
  const agentMap = new Map(agents.map((agent) => [String(agent._id), agent.name]));

  const messages = rows
    .reverse()
    .map((row) => {
      const lot = lotMap.get(String(row.lotId));
      return {
        id: String(row._id),
        lot_id: String(row.lotId),
        lot_name: lot?.projectName || "Unknown lot",
        lot_ask_price_per_ton: lot?.askPricePerTon ?? null,
        lot_quantity_tons: lot?.quantityTons ?? null,
        agent_id: String(row.agentId),
        agent_name: agentMap.get(String(row.agentId)) || "Unknown agent",
        message: row.message,
        tag: inferTag(row.message),
        createdAt: row.createdAt,
      };
    })
    .slice(-80);

  return successResponse({ messages });
}
