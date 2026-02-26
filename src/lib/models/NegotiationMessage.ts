import mongoose, { Document, Model, Schema } from "mongoose";

export interface INegotiationMessage extends Document {
  lotId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const NegotiationMessageSchema = new Schema<INegotiationMessage>(
  {
    lotId: { type: Schema.Types.ObjectId, ref: "CreditLot", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 280 },
  },
  { timestamps: true }
);

const NegotiationMessageModel =
  (mongoose.models.NegotiationMessage as Model<INegotiationMessage>) ||
  mongoose.model<INegotiationMessage>("NegotiationMessage", NegotiationMessageSchema);

export default NegotiationMessageModel;
