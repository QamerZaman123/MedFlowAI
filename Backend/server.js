//Importing packages
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'

//Importing Files
import connectDB from './Config/DBConfig.js'
import router from './Routes/Route.js'
import { ensureCollectionExists } from './Config/QdrantConfig.js'

dotenv.config()

const app = express();
const port = process.env.PORT || 3000;

// Allowed frontend origins for CORS with credentials
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback allow in dev
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser())

app.use("/api", router);

// Initialize DB and Qdrant before starting server
const startServer = async () => {
  await connectDB();
  await ensureCollectionExists();

  app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
  });
};

startServer();