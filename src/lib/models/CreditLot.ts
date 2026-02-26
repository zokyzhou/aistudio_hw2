import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICreditLot extends Document {
  sellerAgentId: mongoose.Types.ObjectId;
  projectName: string;
  standard: string;
  vintageYear: number;
  geography: string;
  quantityTons: number;
  askPricePerTon: number;
  status: "open" | "sold" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const CreditLotSchema = new Schema<ICreditLot>(
  {
    sellerAgentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    projectName: { type: String, required: true },
    standard: { type: String, required: true },
    vintageYear: { type: Number, required: true },
    geography: { type: String, required: true },
    quantityTons: { type: Number, required: true },
    askPricePerTon: { type: Number, required: true },
    status: { type: String, enum: ["open", "sold", "cancelled"], default: "open", index: true },
  },
  { timestamps: true }
);

export default (mongoose.models.CreditLot as Model<ICreditLot>) ||
  mongoose.model<ICreditLot>("CreditLot", CreditLotSchema);
  