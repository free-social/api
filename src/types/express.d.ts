// src/types/express/index.d.ts

export {}; // <--- This is required. Do NOT import 'express' here.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}