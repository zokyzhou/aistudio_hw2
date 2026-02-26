import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import HumanDisclosure from "@/lib/models/HumanDisclosure";
import { errorResponse, successResponse } from "@/lib/utils/api-helpers";

export async function GET() {
  await connectDB();

  const posts = await HumanDisclosure.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const agentIds = Array.from(new Set(posts.map((p) => String(p.agentId))));
  const agents = await Agent.find({ _id: { $in: agentIds } }).select("name").lean();
  const agentNameById = new Map(agents.map((a) => [String(a._id), a.name]));

  return successResponse({
    posts: posts.map((p) => ({
      id: String(p._id),
      agent_id: String(p.agentId),
      agent_name: agentNameById.get(String(p.agentId)) || "Unknown agent",
      post_type: p.postType,
      summary: p.summary,
      benchmark_marketplace: p.benchmarkMarketplace,
      benchmark_url: p.benchmarkUrl || null,
      benchmark_price_per_ton: p.benchmarkPricePerTon ?? null,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || "").trim();
  const postType = String(body?.post_type || "").trim();
  const summary = String(body?.summary || "").trim();
  const benchmarkMarketplace = String(body?.benchmark_marketplace || "").trim();
  const benchmarkUrl = String(body?.benchmark_url || "").trim();
  const benchmarkPrice = body?.benchmark_price_per_ton;

  if (!token) return errorResponse("Missing token", "Claim token is required", 400);

  if (postType !== "buy_criteria" && postType !== "sold_disclosure") {
    return errorResponse(
      "Invalid post_type",
      'Use "buy_criteria" or "sold_disclosure"',
      400
    );
  }

  if (!summary) return errorResponse("Missing summary", "Provide post summary", 400);
  if (!benchmarkMarketplace) {
    return errorResponse("Missing benchmark_marketplace", "Provide marketplace reference", 400);
  }

  const agent = await Agent.findOne({ claimToken: token });
  if (!agent) return errorResponse("Invalid token", "Claim token not found", 404);
  if (agent.claimStatus !== "claimed") {
    return errorResponse("Not claimed", "Claim your agent first", 409);
  }

  const benchmarkPricePerTon =
    benchmarkPrice === undefined || benchmarkPrice === null || benchmarkPrice === ""
      ? undefined
      : Number(benchmarkPrice);

  if (benchmarkPricePerTon !== undefined && Number.isNaN(benchmarkPricePerTon)) {
    return errorResponse(
      "Invalid benchmark_price_per_ton",
      "Must be a valid number",
      400
    );
  }

  const created = await HumanDisclosure.create({
    agentId: agent._id,
    postType,
    summary,
    benchmarkMarketplace,
    benchmarkUrl: benchmarkUrl || undefined,
    benchmarkPricePerTon,
  });

  return successResponse(
    {
      post: {
        id: String(created._id),
        agent_id: String(agent._id),
        agent_name: agent.name,
        post_type: created.postType,
        summary: created.summary,
        benchmark_marketplace: created.benchmarkMarketplace,
        benchmark_url: created.benchmarkUrl || null,
        benchmark_price_per_ton: created.benchmarkPricePerTon ?? null,
        createdAt: created.createdAt,
      },
    },
    201
  );
}
