import { Schema, model, Types, Document } from "mongoose";

export interface IWallet extends Document {
  user: Types.ObjectId;
  balance: number;      
  createdAt: Date;
  updatedAt: Date;      
}

const walletSchema = new Schema<IWallet>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true,
      index: true 
    },
    balance: { 
      type: Number, 
      required: true, 
      default: 0,
      min: 0
    }
  },
  { 
    timestamps: true,
    versionKey: false,
  }
);

const Wallet = model<IWallet>("Wallet", walletSchema);
export default Wallet;