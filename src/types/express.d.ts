import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      // 1. Define what 'user' looks like
      // We know from your token that it contains an 'id'
      user?: {
        id: string;
      };
    }
  }
}
