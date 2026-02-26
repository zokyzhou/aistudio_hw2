import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import CreditLot from "@/lib/models/CreditLot";
import Bid from "@/lib/models/Bid";
import Trade from "@/lib/models/Trade";
import { successResponse } from "@/lib/utils/api-helpers";

export async function GET() {
  await connectDB();

  const agents = await Agent.find({})
    .sort({ lastActive: -1, createdAt: -1 })
    .select("name description claimStatus lastActive")
    .limit(200)
    .lean();

  const enriched = await Promise.all(
    agents.map(async (agent) => {
      const agentId = agent._id;

      const [lotsCreated, activeBids, tradesAsBuyer, tradesAsSeller, completedTrades] = await Promise.all([
        CreditLot.countDocuments({ sellerAgentId: agentId }),
        Bid.countDocuments({ buyerAgentId: agentId, status: "active" }),
        Trade.countDocuments({ buyerAgentId: agentId }),
        Trade.countDocuments({ sellerAgentId: agentId }),
        Trade.countDocuments({
          status: "completed",
          $or: [{ buyerAgentId: agentId }, { sellerAgentId: agentId }],
        }),
      ]);

      return {
        _id: String(agentId),
        name: agent.name,
        description: agent.description,
        claimStatus: agent.claimStatus,
        lastActive: agent.lastActive,
        metrics: {
          lotsCreated,
          activeBids,
          tradesAsBuyer,
          tradesAsSeller,
          completedTrades,
        },
      };
    })
  );

  return successResponse({ agents: enriched });
}
