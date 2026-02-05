import { Request, Response } from "express";
import { UserService } from "../service/UserService";
import { UserZodSchema } from "../models/User";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../config/cloudinary";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UserController {
  static async getMe(req: Request, res: Response) {
    try {
      const user = await UserService.getMe(req.params.id as string);
      res.status(200).json({
        message: "User retrieved successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Avatar file is required" });
      }

      // Wrap Cloudinary upload in a Promise
      const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "avatars" },
            (error, result) => {
              if (error || !result) return reject(new Error("Upload failed"));
              resolve(result.secure_url); // return URL
            },
          );

          stream.end(fileBuffer);
        });
      };

      // Upload the file
      const avatarUrl = await uploadToCloudinary(req.file.buffer);

      // Update user in DB
      const user = await UserService.createAvatar(
        req.params.id as string,
        avatarUrl,
      );

      res.status(200).json({
        message: "Avatar uploaded successfully",
        user: { id: user._id, avatar: user.avatar },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateUsername(req: Request, res: Response) {
    try {
      const user = await UserService.updateUsername(
        req.params.id as string,
        req.body.username,
      );
      res.status(200).json({
        message: "Username updated successfully",
        user: { id: user._id, username: user.username },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async register(req: Request, res: Response) {
    const validation = UserZodSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({ error: validation.error.issues[0].message });
    try {
      const user = await UserService.register(req.body);
      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const user = await UserService.login(req.body.email, req.body.password);
      res.status(200).json({
        message: "User logged in successfully",
        user: {
          id: user.user._id,
          username: user.user.username,
          email: user.user.email,
        },
        token: user.token,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    const redirectUrl = process.env.GOOGLE_REDIRECT_URL!;

    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUrl,
    );
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
    res.redirect(authorizeUrl);
  }

  static async googleCallback(req: Request, res: Response) {
    const code = req.query.code as string;
    const redirectUrl = process.env.GOOGLE_REDIRECT_URL!;


    try {
      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl,
      );

      // 1. Get Google Token
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      // 2. Get User Info
      const ticket = await oAuth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) throw new Error("Invalid Google Account");

      // 3. CALL YOUR SERVICE
      // ✅ Destructure 'user' here too, not just 'token'
      const { user, token } = await UserService.upsertGoogleUser({
        googleId: payload.sub,
        email: payload.email,
        username: payload.name || payload.email.split("@")[0],
      });

      res.redirect(`spendwise://?token=${token}&userId=${user._id}`);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.redirect(`spendwise://?error=AuthFailed`);
    }
  }
}
