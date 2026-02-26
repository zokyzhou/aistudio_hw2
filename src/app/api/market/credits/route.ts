import { connectDB } from "@/lib/db/mongodb";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Agent from "@/lib/models/Agent";
import { successResponse } from "@/lib/utils/api-helpers";
import { isProjectMetadataConsistent } from "@/lib/utils/carbon-projects";

const LEGIT_STANDARDS = [
  "verra",
  "vcs",
  "gold standard",
  "acr",
  "american carbon registry",
  "car",
  "climate action reserve",
];

function isLegitLot(input: {
  projectName: unknown;
  standard: unknown;
  vintageYear: unknown;
  geography: unknown;
  quantityTons: unknown;
  askPricePerTon: unknown;
  sellerName: unknown;
}) {
  const projectName = String(input.projectName || "").trim();
  const standard = String(input.standard || "").trim().toLowerCase();
  const geography = String(input.geography || "").trim();
  const sellerName = String(input.sellerName || "").trim();
  const vintageYear = Number(input.vintageYear);
  const quantityTons = Number(input.quantityTons);
  const askPricePerTon = Number(input.askPricePerTon);
  const currentYear = new Date().getFullYear();

  const standardAllowed = LEGIT_STANDARDS.some((item) => standard.includes(item));

  if (!projectName || projectName.length < 3) return false;
  if (!standardAllowed) return false;
  if (!Number.isFinite(vintageYear) || vintageYear < 2005 || vintageYear > currentYear) return false;
  if (!geography || geography.length < 2) return false;
  if (!Number.isFinite(quantityTons) || quantityTons <= 0) return false;
  if (!Number.isFinite(askPricePerTon) || askPricePerTon <= 0) return false;
  if (!sellerName || sellerName.toLowerCase() === "unknown seller") return false;
  if (
    !isProjectMetadataConsistent({
      projectName,
      standard: String(input.standard || ""),
      geography,
      vintageYear,
    })
  ) {
    return false;
  }

  return true;
}

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

  const credits = lots
    .map((lot) => {
    const bid = bidMap.get(String(lot._id));
    const query = encodeURIComponent(`${lot.projectName} ${lot.standard} carbon credit project`);
    const standardLower = String(lot.standard || "").toLowerCase();
    const referenceMarket = standardLower.includes("gold")
      ? "https://registry.goldstandard.org/"
      : "https://registry.verra.org/";

    const sellerName = sellerMap.get(String(lot.sellerAgentId)) || "Unknown seller";

    return {
      id: String(lot._id),
      project_name: lot.projectName,
      standard: lot.standard,
      vintage_year: lot.vintageYear,
      geography: lot.geography,
      quantity_tons: lot.quantityTons,
      ask_price_per_ton: lot.askPricePerTon,
      status: lot.status,
      seller_name: sellerName,
      bids_count: bid?.bidsCount || 0,
      top_bid: bid?.topBid ?? null,
      links: {
        project_info: `https://www.google.com/search?q=${query}`,
        reference_market: referenceMarket,
      },
    };
  })
    .filter((credit) =>
      isLegitLot({
        projectName: credit.project_name,
        standard: credit.standard,
        vintageYear: credit.vintage_year,
        geography: credit.geography,
        quantityTons: credit.quantity_tons,
        askPricePerTon: credit.ask_price_per_ton,
        sellerName: credit.seller_name,
      })
    );

  return successResponse({ credits });
}
