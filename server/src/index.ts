import express from "express";
import cors from "cors";
import { placesRouter } from "./routes/places.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/places", placesRouter);

app.listen(port, () => {
  console.log(`Server körs på http://localhost:${port}`);
});
