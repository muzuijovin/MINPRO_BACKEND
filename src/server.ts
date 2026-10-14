import express from "express";
import { BooksRoute } from "./features/books/books.route";
import cors from "cors";
import { corsOptions } from "./config/cors.config";
import { errorMiddleware } from "./middleware/error.middleware";

const PORT: number = parseInt(process.env.PORT!);
const API_PREFIX: string = process.env.API_PREFIX!;
const app = express();

//corsnya
app.use(cors(corsOptions));

// parser
app.use(express.json());

//menangani error middleware
app.use(errorMiddleware);

app.use(`${API_PREFIX}/books`, BooksRoute);

if (process.env.NODE_ENV === "DEVELOPMENT") {
  app.listen(PORT, () => {
    console.log(`Application Running On Port ${PORT}`);
  });
}

export default app