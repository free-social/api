// import express, {type Request, type Response } from 'express';
import express from "express";
import dotenv from 'dotenv';
import cors from 'cors'; // <--- 1. Import it
import connectDB from './config/db';
import AuthRoutes from './routes/AuthRoutes';
import TransactionRoutes from './routes/TransactionRoutes';
import { setupSwagger } from './config/swagger';
import WalletRoutes from './routes/WalletRoutes';
import rateLimit from "express-rate-limit";


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(cors({ origin: "*" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests please try again"
})

// Apply to all API routes
app.use('/api/', apiLimiter);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.use('/api/v1/auth', AuthRoutes)
app.use('/api/v1/transactions', TransactionRoutes)
app.use('/api/v1/wallet', WalletRoutes)


setupSwagger(app)


connectDB()


app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
