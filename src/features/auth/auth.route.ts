
import { Router } from "express";
import { AuthController } from "./auth.controller";

const authRoute = Router();

authRoute.post("/register", AuthController.register);

// READ: mengambil semua data user
authRoute.get("/users", AuthController.getUsers);

export default authRoute;
