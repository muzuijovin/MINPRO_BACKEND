import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// koneksi menganggur ditahan 5 menit (default pg cuma 10 detik), biar gak reconnect terus ke DB
const adapter = new PrismaPg({ connectionString, idleTimeoutMillis: 300_000 });
const prisma = new PrismaClient({ adapter });

export { prisma };
