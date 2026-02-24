import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrade extends Document {
  lotId: mongoose.Types.ObjectId;
  buyerAgentId: mongoose.Types.ObjectId;
  sellerAgentId: mongoose.Types.ObjectId;
  agreedPricePerTon: number;
  quantityTons: number;
  status: "pending_settlement" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
  {
    lotId: { type: Schema.Types.ObjectId, ref: "CreditLot", required: true, index: true },
    buyerAgentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    sellerAgentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    agreedPricePerTon: { type: Number, required: true },
    quantityTons: { type: Number, required: true },
    status: { type: String, enum: ["pending_settlement", "completed", "cancelled"], default: "pending_settlement" },
  },
  { timestamps: true }
);

const TradeModel =
  (mongoose.models.Trade as Model<ITrade>) ||
  mongoose.model<ITrade>("Trade", TradeSchema);

export default TradeModel;
