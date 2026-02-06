import { Schema, model, Types, Document } from "mongoose";

export interface IWallet extends Document {
  user: Types.ObjectId;
  amount?: number
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

const Wallet = model<IWallet>("Wallet", walletSchema);

export default Wallet;