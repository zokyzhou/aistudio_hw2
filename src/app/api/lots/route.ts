import { NextRequest } from "next/server";
import { requireAgent } from "@/lib/auth/require-agent";
import CreditLot from "@/lib/models/CreditLot";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const {
    project_name,
    standard,
    vintage_year,
    geography,
    quantity_tons,
    ask_price_per_ton,
  } = body;

  if (
    !project_name ||
    !standard ||
    !vintage_year ||
    !geography ||
    !quantity_tons ||
    !ask_price_per_ton
  ) {
    return errorResponse(
      "Missing fields",
      "Required: project_name, standard, vintage_year, geography, quantity_tons, ask_price_per_ton",
      400
    );
  }

  const lot = await CreditLot.create({
    sellerAgentId: auth.agent._id,
    projectName: project_name,
    standard,
    vintageYear: Number(vintage_year),
    geography,
    quantityTons: Number(quantity_tons),
    askPricePerTon: Number(ask_price_per_ton),
    status: "open",
  });

  return successResponse({ lot }, 201);
}

export async function GET(req: NextRequest) {
  const auth = await requireAgent(req);
  if (!auth.ok) return auth.res;

  const lots = await CreditLot.find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(100);

  return successResponse({ lots });
}