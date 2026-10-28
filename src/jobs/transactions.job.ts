import cron from "node-cron";
import { TransactionsServices } from "../features/transactions/transactions.services";

// hanya dipakai saat development (npm run dev), karena server nyala terus
// di Vercel (serverless) server mati kalau tidak ada request, jadi cron ini tidak jalan.
// untuk production pakai endpoint POST /transactions/jobs/expire yang dipanggil cron-job.org tiap menit
export function startTransactionsJob() {
  // "* * * * *" = jalan tiap 1 menit
  cron.schedule("* * * * *", async () => {
    try {
      const { expired, cancelled } = await TransactionsServices.expireOverdueTransactions();

      if (expired || cancelled)
        console.log(`[transactions job] ${expired} expired, ${cancelled} cancelled`);
    } catch (error) {
      // error tidak di throw biar scheduler tetap jalan di menit berikutnya
      console.error("[transactions job] failed", error);
    }
  });
}
