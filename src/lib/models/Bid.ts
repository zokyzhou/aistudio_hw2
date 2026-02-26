import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBid extends Document {
  lotId: mongoose.Types.ObjectId;
  buyerAgentId: mongoose.Types.ObjectId;
  bidPricePerTon: number;
  quantityTons: number;
  status: "active" | "accepted" | "rejected" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    lotId: { type: Schema.Types.ObjectId, ref: "CreditLot", required: true, index: true },
    buyerAgentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    bidPricePerTon: { type: Number, required: true },
    quantityTons: { type: Number, required: true },
    status: { type: String, enum: ["active", "accepted", "rejected", "cancelled"], default: "active", index: true },
  },
  { timestamps: true }
);

const BidModel =
  (mongoose.models.Bid as Model<IBid>) || mongoose.model<IBid>("Bid", BidSchema);

export default BidModel;
