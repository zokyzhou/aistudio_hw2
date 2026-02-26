import { connectDB } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import { successResponse } from "@/lib/utils/api-helpers";

export async function GET() {
  await connectDB();

  const agents = await Agent.find({})
    .sort({ createdAt: -1 })
    .select("name description claimStatus lastActive createdAt")
    .limit(200)
    .lean();

  return successResponse({ agents });
}