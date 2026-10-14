// import { Request, Response } from "express";
// import { BooksServices } from "./books.services";

// export class BooksController {
//   static async create(req: Request, res: Response) {
//     try {
//       const { tittle, isbn, description, category, authorId } = req?.body;

//       const createBook = await BooksServices.create({
//         tittle,
//         isbn,
//         description,
//         category,
//         authorId,
//       });

//       res.status(201).json({
//         success: true,
//         message: "Book created successfully",
//         data: createBook,
//       });
//     } catch (error) {
//       if (error instanceof Error) {
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//           data: [],
//         });
//       }
//     }
//   }

//   static async get(req: Request, res: Response) {
//     try {
//       const { page = 1, limit = 10 } = req.query;

//       const { totalPage, Books } = await BooksServices.get(
//         parseInt(page as string),
//         parseInt(limit as string)
//       );

//       res.status(201).json({
//         status: true,
//         message: "Book created successfully",
//         data: Books,
//         meta: {
//           page: Number(page),
//           limit: Number(limit),
//           totalPage,
//           Books
//         },
//       });
//     } catch (error) {
//       if (error instanceof Error) {
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//           data: [],
//         });
//       }
//     }
//   }

//   static async delete(req: Request, res: Response) {
//     try {
//       const { isbn } = req.params;
//       const deleteBook = await BooksServices.delete({ isbn: isbn as string });

//       res.status(200).json({
//         success: true,
//         message: "Book delete successfully",
//         data: deleteBook,
//       });
//     } catch (error) {
//       if (error instanceof Error) {
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//           data: [],
//         });
//       }
//     }
//   }

//   static async update(req: Request, res: Response) {
//     const { isbn } = req.params;
//     req.body;

//     await BooksServices;
//   }
// }
