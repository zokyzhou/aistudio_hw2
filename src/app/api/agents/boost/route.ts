import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Bid from "@/lib/models/Bid";
import CreditLot from "@/lib/models/CreditLot";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import Trade from "@/lib/models/Trade";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const qualityPrompts = [
  "Can you confirm verification quality and latest registry issuance?",
  "Any notes on additionality risk or reversal buffer coverage?",
  "What is the monitoring/reporting cadence for this project?",
];

const projectPrompts = [
  "Can you share project geography and local co-benefit highlights?",
  "Who is the project developer and which registry entry should we review?",
  "Please clarify methodology version and project boundary details.",
];

const pricePrompts = [
  "If we close today, can you move 5% on price?",
  "Our target is slightly below ask; open to counter-offer?",
  "We can commit full volume if pricing is adjusted by $0.5/ton.",
];

export async function POST() {
  await connectDB();

  const agents = await Agent.find({}).sort({ lastActive: -1 }).limit(8);
  if (agents.length < 2) {
    return errorResponse("Not enough agents", "Create at least two agents first", 400);
  }

  const seller = agents[0];
  const buyerPool = agents.filter((a) => String(a._id) !== String(seller._id));
  const buyer = pick(buyerPool);

  let lot = await CreditLot.findOne({ sellerAgentId: seller._id, status: "open" }).sort({ createdAt: -1 });
  if (!lot) {
    lot = await CreditLot.create({
      sellerAgentId: seller._id,
      projectName: pick(["Blue Carbon Mangrove", "Amazon Reforestation", "Cookstove Efficiency"]),
      standard: pick(["Verra", "Gold Standard"]),
      vintageYear: 2022,
      geography: pick(["Indonesia", "Brazil", "Kenya"]),
      quantityTons: 100,
      askPricePerTon: 12,
      status: "open",
    });
  }

  const bidPrice = Number((lot.askPricePerTon - 0.3).toFixed(2));

  const bid = await Bid.create({
    lotId: lot._id,
    buyerAgentId: buyer._id,
    bidPricePerTon: bidPrice,
    quantityTons: lot.quantityTons,
    status: "active",
  });

  await NegotiationMessage.insertMany([
    {
      lotId: lot._id,
      agentId: buyer._id,
      message: pick(qualityPrompts),
    },
    {
      lotId: lot._id,
      agentId: seller._id,
      message: pick(projectPrompts),
    },
    {
      lotId: lot._id,
      agentId: buyer._id,
      message: `${pick(pricePrompts)} Current indication: $${bidPrice}/ton for ${lot.quantityTons} tons.`,
    },
    {
      lotId: lot._id,
      agentId: seller._id,
      message: `Accepted. Final terms: $${bidPrice}/ton for ${lot.quantityTons} tons. Proceeding to settlement.`,
    },
  ]);

  bid.status = "accepted";
  await bid.save();

  await Bid.updateMany(
    { lotId: lot._id, _id: { $ne: bid._id }, status: "active" },
    { $set: { status: "rejected" } }
  );

  lot.status = "sold";
  await lot.save();

  const trade = await Trade.create({
    lotId: lot._id,
    buyerAgentId: buyer._id,
    sellerAgentId: seller._id,
    agreedPricePerTon: bidPrice,
    quantityTons: lot.quantityTons,
    status: "completed",
  });

  seller.lastActive = new Date();
  buyer.lastActive = new Date();
  await Promise.all([seller.save(), buyer.save()]);

  return successResponse({
    round: {
      seller: seller.name,
      buyer: buyer.name,
      lot_id: String(lot._id),
      bid_id: String(bid._id),
      trade_id: String(trade._id),
      agreed_price_per_ton: bidPrice,
      quantity_tons: lot.quantityTons,
    },
  });
}
