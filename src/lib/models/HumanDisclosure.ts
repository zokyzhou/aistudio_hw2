import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHumanDisclosure extends Document {
  agentId: mongoose.Types.ObjectId;
  postType: "buy_criteria" | "sold_disclosure";
  summary: string;
  benchmarkMarketplace: string;
  benchmarkUrl?: string;
  benchmarkPricePerTon?: number;
  createdAt: Date;
  updatedAt: Date;
}

const HumanDisclosureSchema = new Schema<IHumanDisclosure>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    postType: {
      type: String,
      enum: ["buy_criteria", "sold_disclosure"],
      required: true,
      index: true,
    },
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    benchmarkMarketplace: { type: String, required: true, trim: true, maxlength: 120 },
    benchmarkUrl: { type: String, trim: true, maxlength: 500 },
    benchmarkPricePerTon: { type: Number },
  },
  { timestamps: true }
);

const HumanDisclosureModel =
  (mongoose.models.HumanDisclosure as Model<IHumanDisclosure>) ||
  mongoose.model<IHumanDisclosure>("HumanDisclosure", HumanDisclosureSchema);

export default HumanDisclosureModel;
