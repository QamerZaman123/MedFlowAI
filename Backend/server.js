//Importing packages
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'

//Importing Files
import connectDB from './config/DBConfig.js'
import router from './Routes/Route.js'

dotenv.config()

const app = express();
const port = process.env.PORT || 3000;
connectDB()

app.use(cors({
    origin: "*",
    credentials:true,
  }));

app.use(express.json());
app.use(cookieParser())

app.use("/api", router);

// app.get("/", (req, res) => {
//   res.json({ status: "Backend is running!" });
// });

app.listen(port, () => {
  console.log(`Server running on port  http://localhost:${port}`);
});