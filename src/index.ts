import express, {type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <--- 1. Import it
import connectDB from './config/db';
import AuthRoutes from './routes/AuthRoutes';
import TransactionRoutes from './routes/TransactionRoutes';
import { setupSwagger } from './config/swagger';



// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(cors({ origin: "*" })); // This is fine for the emulator

app.use('/api/v1/auth', AuthRoutes)
app.use('/api/v1/transactions', TransactionRoutes)

setupSwagger(app)


connectDB()

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({message:'Hello API of Typescript Express Work properly with Docker...'});
});

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
