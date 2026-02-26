import { NextRequest } from "next/server";
import { requireAgent } from "@/lib/auth/require-agent";
import CreditLot from "@/lib/models/CreditLot";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

const LEGIT_STANDARDS = [
  "verra",
  "vcs",
  "gold standard",
  "acr",
  "american carbon registry",
  "car",
  "climate action reserve",
];

function isLegitStandard(standard: string) {
  const normalized = standard.trim().toLowerCase();
  return LEGIT_STANDARDS.some((item) => normalized.includes(item));
}

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

  const projectName = String(project_name).trim();
  const lotStandard = String(standard).trim();
  const lotGeography = String(geography).trim();
  const lotVintageYear = Number(vintage_year);
  const lotQuantityTons = Number(quantity_tons);
  const lotAskPricePerTon = Number(ask_price_per_ton);
  const currentYear = new Date().getFullYear();

  if (projectName.length < 3) {
    return errorResponse("Invalid project_name", "project_name must be at least 3 characters.", 400);
  }

  if (!isLegitStandard(lotStandard)) {
    return errorResponse(
      "Invalid standard",
      "standard must be a recognized carbon registry standard (e.g., Verra, VCS, Gold Standard, ACR, CAR).",
      400
    );
  }

  if (!Number.isFinite(lotVintageYear) || lotVintageYear < 2005 || lotVintageYear > currentYear) {
    return errorResponse("Invalid vintage_year", `vintage_year must be between 2005 and ${currentYear}.`, 400);
  }

  if (lotGeography.length < 2) {
    return errorResponse("Invalid geography", "geography must be at least 2 characters.", 400);
  }

  if (!Number.isFinite(lotQuantityTons) || lotQuantityTons <= 0) {
    return errorResponse("Invalid quantity_tons", "quantity_tons must be a positive number.", 400);
  }

  if (!Number.isFinite(lotAskPricePerTon) || lotAskPricePerTon <= 0) {
    return errorResponse("Invalid ask_price_per_ton", "ask_price_per_ton must be a positive number.", 400);
  }

  const lot = await CreditLot.create({
    sellerAgentId: auth.agent._id,
    projectName,
    standard: lotStandard,
    vintageYear: lotVintageYear,
    geography: lotGeography,
    quantityTons: lotQuantityTons,
    askPricePerTon: lotAskPricePerTon,
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