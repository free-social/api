import { Schema, Document, model, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


export enum CategoryType {
  TRAVEL = "travel",
  FOOD = "food",
  BILLS = "bills",
  SHOPPING = "shopping",
  OTHER = "other",
}

// should add filter in it endpoint

export interface ITransaction extends Document {
  user: Types.ObjectId;
  amount: number;
  category: CategoryType;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: Object.values(CategoryType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now, // Defaults to today if not provided
    },
    description: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


transactionSchema.plugin(mongoosePaginate);

const Transaction = model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
