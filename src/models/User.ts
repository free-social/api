import mongoose, { Schema, Document, model } from "mongoose";
import { z } from "zod";

// 1. Zod schema for validation
export const UserZodSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/,
      "Password must be at least 6 chars and include uppercase, lowercase, number, and special character",
    )
    .optional(),
  googleId: z.string().optional(),
  avatar: z.string().optional(),
  currentToken: z.string().optional(),
});

// 2. Infer the Type from Zod
export type UserInput = z.infer<typeof UserZodSchema>;

// 3. Mongoose interface
export interface IUser extends UserInput, Document {
  createdAt: Date;
  updatedAt: Date;
}

// 4. Mongoose schema
const userSchema = new Schema<IUser>(
  {
    username: { type: String, sparse: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      // Only required if googleId doesn't exist
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, unique: true, sparse: true }, 
    avatar: { type: String },
    currentToken: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// 5. Mongoose model
const User = model<IUser>("User", userSchema);

export default User;
