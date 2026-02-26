import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Bid from "@/lib/models/Bid";
import CreditLot from "@/lib/models/CreditLot";
import HumanDisclosure from "@/lib/models/HumanDisclosure";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import Trade from "@/lib/models/Trade";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function ensureNamedDemoAgents() {
  const buyerCandidate = await Agent.findOne({
    name: { $in: ["Zack", "Buyer Zack", "BuyerAgent1"] },
  });
  const sellerCandidate = await Agent.findOne({
    name: { $in: ["Nilson", "Seller Nilson", "TestAgent2"] },
  });

  if (buyerCandidate) {
    buyerCandidate.name = "Zack";
    buyerCandidate.role = "buyer";
    await buyerCandidate.save();
  }

  if (sellerCandidate) {
    sellerCandidate.name = "Nilson";
    sellerCandidate.role = "seller";
    await sellerCandidate.save();
  }

  return { buyerCandidate, sellerCandidate };
}

export async function POST() {
  await connectDB();

  const { buyerCandidate, sellerCandidate } = await ensureNamedDemoAgents();

  const agents = await Agent.find({}).sort({ lastActive: -1 }).limit(12);
  if (agents.length < 2) {
    return errorResponse("Not enough agents", "Create at least two agents first", 400);
  }

  const seller =
    sellerCandidate || agents.find((a) => a.role === "seller") || agents[0];

  const buyer =
    buyerCandidate ||
    agents.find((a) => a.role === "buyer" && String(a._id) !== String(seller._id)) ||
    agents.find((a) => String(a._id) !== String(seller._id)) ||
    agents[0];

  if (String(seller._id) === String(buyer._id)) {
    return errorResponse("Role conflict", "Need distinct buyer and seller agents", 409);
  }

  seller.role = "seller";
  buyer.role = "buyer";
  await Promise.all([seller.save(), buyer.save()]);

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

  const sellerBenchmark = await HumanDisclosure.findOne({
    agentId: seller._id,
    postType: "sold_disclosure",
  })
    .sort({ createdAt: -1 })
    .lean();

  const buyerBenchmark = await HumanDisclosure.findOne({
    agentId: buyer._id,
    postType: "buy_criteria",
  })
    .sort({ createdAt: -1 })
    .lean();

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
      message: `As buyer, I need quality confirmation: standard ${lot.standard}, vintage ${lot.vintageYear}, geography ${lot.geography}.`,
    },
    {
      lotId: lot._id,
      agentId: seller._id,
      message: `As seller, project info: ${lot.projectName} (${lot.standard} ${lot.vintageYear}) in ${lot.geography}, quantity ${lot.quantityTons} tons.`,
    },
    {
      lotId: lot._id,
      agentId: buyer._id,
      message: `Price inquiry from buyer: ask is $${lot.askPricePerTon}/ton. My bid is $${bidPrice}/ton for ${lot.quantityTons} tons.${
        buyerBenchmark?.benchmarkPricePerTon
          ? ` Buyer benchmark: $${buyerBenchmark.benchmarkPricePerTon}/ton on ${buyerBenchmark.benchmarkMarketplace}.`
          : ""
      }`,
    },
    {
      lotId: lot._id,
      agentId: seller._id,
      message: `Seller response: accepted at $${bidPrice}/ton for ${lot.quantityTons} tons. ${
        sellerBenchmark?.benchmarkPricePerTon
          ? `Seller benchmark was $${sellerBenchmark.benchmarkPricePerTon}/ton on ${sellerBenchmark.benchmarkMarketplace}.`
          : "Proceeding with current project valuation context."
      }`,
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
