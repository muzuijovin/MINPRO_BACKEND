import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";
import { EventsRoute } from "./features/events/events.route";

const PORT: number = parseInt(process.env.PORT!);
const API_PREFIX: string = process.env.API_PREFIX!;
const app = express();

//corsnya
app.use(cors(corsOptions));

// parser
app.use(express.json());

//menangani error middleware
app.use(errorMiddleware);

app.use(`${API_PREFIX}/events`, EventsRoute);

//kalau udh pake supabase ya app listen hanya ketika development aja.. kalau ga ada ya ga diwajibin..
if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });
}

export default app