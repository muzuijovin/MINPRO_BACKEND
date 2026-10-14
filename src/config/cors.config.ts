import { CorsOptions } from "cors";


// cors untuk menyelaraskan port yang berbeda antara fe dan be
export const corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(','); // [URL1, URL2]

    /*
      IF ORIGIN NOT INSIDE ALLOWED_ORIGIN
    */
    if (!ALLOWED_ORIGINS?.includes(origin!))
      return callback(new Error('Origin not allowed by CORS'), false);

    return callback(null, true);
  },
};