import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import ejs from "ejs";
import masterRoutes from "./routes/index.routes";
import { connectDB } from "./config/db.config";
import path from "path";
import rateLimit from "express-rate-limit";

export const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
const isServerless = Boolean(process.env.VERCEL);
const rootDir = process.cwd();

// Vercel / reverse proxies set X-Forwarded-For; required by express-rate-limit
app.set("trust proxy", 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Explicit register so Vercel file-tracing includes ejs (Express loads it dynamically otherwise)
app.engine("ejs", ejs.__express);
app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "src/views"));
app.use(express.static(path.join(rootDir, "src/public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", authLimiter);
app.use("/", masterRoutes);

app.get("/ping", (_req, res) => {
  res.send("pong");
});

if (process.env.NODE_ENV !== "test" && !isServerless) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
  });
}

if (isServerless) {
  connectDB();
}

export default app;
