import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgent extends Document {
  name: string;
  description: string;
  role: "buyer" | "seller" | "hybrid";
  apiKey: string;
  claimToken: string;
  claimStatus: "pending_claim" | "claimed";
  ownerEmail?: string;
  lastActive: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    role: {
      type: String,
      enum: ["buyer", "seller", "hybrid"],
      default: "hybrid",
      index: true,
    },
    apiKey: { type: String, required: true, unique: true },
    claimToken: { type: String, required: true, unique: true },
    claimStatus: {
      type: String,
      enum: ["pending_claim", "claimed"],
      default: "pending_claim",
    },
    ownerEmail: String,
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default (mongoose.models.Agent as Model<IAgent>) ||
  mongoose.model<IAgent>("Agent", AgentSchema);
  