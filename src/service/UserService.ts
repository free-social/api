import bcrypt from "bcryptjs";
import User, { IUser, UserInput } from "../models/User";
import * as jwt from "jsonwebtoken";

export class UserService {
  static async getMe(userId: string) {
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");
    return user;
  }

  static async createAvatar(userId: string, avatarUrl: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true },
    );
    if (!user) throw new Error("User not found");
    return user;
  }

  static async updateUsername(userId: string, newUsername: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true },
    );
    if (!user) throw new Error("User not found");
    return user;
  }

  static async upsertGoogleUser({
    googleId,
    email,
    username,
  }: {
    googleId: string;
    email: string;
    username: string;
  }) {
    // 1. Check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // 2. Create new user if doesn't exist
      user = new User({
        googleId,
        email,
        username,
      });
      await user.save();
    } else {
      // 3. Link Google ID if user exists but hasn't linked Google yet
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" },
    );

    // ✅ 5. WHITELIST LOGIC: Update the active token in the database
    // This makes sure the Google login kills any previous manual login tokens.
    user.currentToken = token;
    await user.save();

    const { password: _, ...userData } = user.toObject();
    return { user: userData, token };
  }

  static async register(userData: UserInput): Promise<IUser> {
    const { email, username, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("Email already exists");

    const salt = await bcrypt.genSalt(10);
    // Add '!' because Zod makes it optional now, but it's required for this method
    const hashedPassword = await bcrypt.hash(password!, salt);

    const newUser = new User({ email, username, password: hashedPassword });
    return newUser.save();
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });

    // 1. Safety check
    if (!user || !user.password) throw new Error("Invalid email or password");

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid email or password");

    // 3. Generate the new token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" },
    );

    // ✅ 4. WHITELIST LOGIC: Update the user's currentToken in the database
    // This action invalidates any previous tokens immediately.
    user.currentToken = token;
    await user.save();

    // 5. Prepare data for response
    const { password: _, ...userData } = user.toObject();
    return { user: userData, token };
  }
}
