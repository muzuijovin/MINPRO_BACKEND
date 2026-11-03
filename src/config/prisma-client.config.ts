import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";


const connectionString = `${process.env.DATABASE_URL}`;

// di Vercel tiap request bisa jalan di instance serverless berbeda dan tiap instance punya pool sendiri.
// pool dibatasi kecil supaya total koneksi ke pooler Supabase tidak melewati batas (penyebab error 500 saat ramai).
// DATABASE_URL production pakai pooler mode transaction (port 6543)
const adapter = new PrismaPg({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 2),
});
const prisma = new PrismaClient({ adapter });

export { prisma };
