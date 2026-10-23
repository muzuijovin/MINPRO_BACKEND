import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { AppError } from "../errors/app.error";

export const uploadMiddleware = (allowedFileExtensions: string[], storageType: string) => {
  const storage = storageType === 'DISK' ? multer.diskStorage({
    destination: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) {
      const dirPath = path.join(process.cwd());
      cb(null, `${dirPath}/src/uploads`);
    },
    filename: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) {
      const fileExtension = file?.originalname?.split(".").pop();
      const filename = `${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}.${fileExtension}`;
      cb(null, filename);
    },
  }): multer?.memoryStorage()

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    const fileExtension = file?.originalname?.split(".").pop();

    // jika extention yang diberikan di route ternyata tidak sama dengan orang yang ngepost. itu throw ke error
    if (!allowedFileExtensions.includes(fileExtension!)) {
      cb(new AppError(415, "File extension not allowed"));
    }
    cb(null, true);
  }

  return multer({ storage: storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5} //5mb
   });
};
