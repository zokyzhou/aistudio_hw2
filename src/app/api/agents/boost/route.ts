import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Bid from "@/lib/models/Bid";
import CreditLot from "@/lib/models/CreditLot";
import HumanDisclosure from "@/lib/models/HumanDisclosure";
import NegotiationMessage from "@/lib/models/NegotiationMessage";
import Trade from "@/lib/models/Trade";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";
import { CANONICAL_CARBON_PROJECTS } from "@/lib/utils/carbon-projects";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const qualityQuestions = [
  "Can you confirm the latest issuance and verification status?",
  "Any quality concerns around additionality or reversal buffer?",
  "Is this lot currently clear on methodology and registry records?",
];

const qualityAnswers = [
  "Verification is current and registry records are up to date.",
  "No unresolved quality flags; docs and registry details are available.",
  "Methodology and issuance records look clean on the registry side.",
];

const projectQuestions = [
  "Can you share quick project context and co-benefits?",
  "Before we settle, any project delivery notes we should know?",
  "Can you confirm geography and current project operating status?",
];

const projectAnswers = [
  "Project details and geography are consistent with listing disclosures.",
  "Delivery and project context are unchanged from the listed information.",
  "Geography, standard, and project scope are all aligned with the lot info.",
];

const buyerPushbacks = [
  "We can move quickly if you can come down a bit on price.",
  "We're close, but need a slightly tighter number to close today.",
  "If we can narrow the spread, we can settle this round now.",
];

const sellerPushbacks = [
  "Understood — we can improve terms a little, but not all the way to that level.",
  "We can meet in the middle if you keep full volume.",
  "That offer is close; a small step up and we can lock this.",
];

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
    const canonicalProject = pick(CANONICAL_CARBON_PROJECTS);
    const vintageYear = Math.max(
      canonicalProject.minVintageYear,
      Math.min(canonicalProject.maxVintageYear, new Date().getFullYear() - 1)
    );

    lot = await CreditLot.create({
      sellerAgentId: seller._id,
      projectName: canonicalProject.projectName,
      standard: canonicalProject.standard,
      vintageYear,
      geography: canonicalProject.geography,
      quantityTons: 100,
      askPricePerTon: 12,
      status: "open",
    });
  }

  const sellerBenchmark = await HumanDisclosure.findOne({ agentId: seller._id, postType: "sold_disclosure" })
    .sort({ createdAt: -1 })
    .lean();
  const buyerBenchmark = await HumanDisclosure.findOne({ agentId: buyer._id, postType: "buy_criteria" })
    .sort({ createdAt: -1 })
    .lean();

  const roundMessages = await NegotiationMessage.find({ lotId: lot._id })
    .sort({ createdAt: 1 })
    .select("agentId")
    .lean();
  const step = roundMessages.length % 6;

  let activeBid = await Bid.findOne({
    lotId: lot._id,
    buyerAgentId: buyer._id,
    status: "active",
  }).sort({ createdAt: -1 });

  let createdTrade: any = null;
  let createdBid: any = null;
  let generatedMessage = "";

  if (step === 0) {
    generatedMessage = `${pick(qualityQuestions)} Lot references ${lot.standard} ${lot.vintageYear} in ${lot.geography}.`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: buyer._id, message: generatedMessage });
  } else if (step === 1) {
    generatedMessage = `${pick(qualityAnswers)} Project ${lot.projectName} is listed for ${lot.quantityTons} tons.`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: seller._id, message: generatedMessage });
  } else if (step === 2) {
    const firstBidPrice = Number((lot.askPricePerTon - 0.9).toFixed(2));
    activeBid = await Bid.create({
      lotId: lot._id,
      buyerAgentId: buyer._id,
      bidPricePerTon: firstBidPrice,
      quantityTons: lot.quantityTons,
      status: "active",
    });
    createdBid = activeBid;
    generatedMessage = `${pick(projectQuestions)} We can open at $${firstBidPrice}/ton for ${lot.quantityTons} tons.${
      buyerBenchmark?.benchmarkPricePerTon
        ? ` Our latest benchmark is near $${buyerBenchmark.benchmarkPricePerTon}/ton.`
        : ""
    }`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: buyer._id, message: generatedMessage });
  } else if (step === 3) {
    const counterPrice = Number((lot.askPricePerTon - 0.4).toFixed(2));
    generatedMessage = `${pick(sellerPushbacks)} We can consider $${counterPrice}/ton as a workable level.`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: seller._id, message: generatedMessage });
  } else if (step === 4) {
    const improvedBidPrice = Number((lot.askPricePerTon - 0.25).toFixed(2));
    if (activeBid) {
      activeBid.bidPricePerTon = improvedBidPrice;
      await activeBid.save();
      createdBid = activeBid;
    } else {
      activeBid = await Bid.create({
        lotId: lot._id,
        buyerAgentId: buyer._id,
        bidPricePerTon: improvedBidPrice,
        quantityTons: lot.quantityTons,
        status: "active",
      });
      createdBid = activeBid;
    }
    generatedMessage = `${pick(buyerPushbacks)} Updated bid: $${improvedBidPrice}/ton for full ${lot.quantityTons} tons.`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: buyer._id, message: generatedMessage });
  } else {
    const finalBid =
      activeBid ||
      (await Bid.create({
        lotId: lot._id,
        buyerAgentId: buyer._id,
        bidPricePerTon: Number((lot.askPricePerTon - 0.2).toFixed(2)),
        quantityTons: lot.quantityTons,
        status: "active",
      }));

    finalBid.status = "accepted";
    await finalBid.save();
    createdBid = finalBid;

    await Bid.updateMany(
      { lotId: lot._id, _id: { $ne: finalBid._id }, status: "active" },
      { $set: { status: "rejected" } }
    );

    lot.status = "sold";
    await lot.save();

    createdTrade = await Trade.create({
      lotId: lot._id,
      buyerAgentId: buyer._id,
      sellerAgentId: seller._id,
      agreedPricePerTon: finalBid.bidPricePerTon,
      quantityTons: lot.quantityTons,
      status: "completed",
    });

    generatedMessage = `Deal confirmed at $${finalBid.bidPricePerTon}/ton for ${lot.quantityTons} tons.${
      sellerBenchmark?.benchmarkPricePerTon
        ? ` Seller benchmark reference was $${sellerBenchmark.benchmarkPricePerTon}/ton on ${sellerBenchmark.benchmarkMarketplace}.`
        : ""
    }`;
    await NegotiationMessage.create({ lotId: lot._id, agentId: seller._id, message: generatedMessage });
  }

  seller.lastActive = new Date();
  buyer.lastActive = new Date();
  await Promise.all([seller.save(), buyer.save()]);

  return successResponse({
    round: {
      seller: seller.name,
      buyer: buyer.name,
      lot_id: String(lot._id),
      bid_id: createdBid ? String(createdBid._id) : null,
      trade_id: createdTrade ? String(createdTrade._id) : null,
      message: generatedMessage,
      step,
    },
  });
}
