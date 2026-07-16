import "dotenv/config";
import express from "express";
import cors from "cors";
import { placesRouter } from "./routes/places.js";

const app = express();
const port = process.env.PORT ?? 3001;

const allowedOrigins = ["http://localhost:5173", process.env.CORS_ORIGIN].filter(
  (origin): origin is string => Boolean(origin),
);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use("/api/places", placesRouter);

app.listen(port, () => {
  console.log(`Server körs på http://localhost:${port}`);
});
