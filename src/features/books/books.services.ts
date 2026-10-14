// import { prisma } from "../../config/prisma-cllient.config";
// import { BookUncheckedCreateInput } from "../../generated/prisma/models";

// interface BookUncheckedDeletedInput {
//   isbn: string;
// }

// export class BooksServices {
//   static async create({
//     tittle,
//     isbn,
//     description,
//     category,
//     authorId,
//   }: BookUncheckedCreateInput) {
//     // validasi kalau isbn udh ada di db ke throw catch
//     const findBookByISBN = await prisma.book.findFirst({
//       where: { isbn },
//     });

//     // buat message menggunakan if
//     if (findBookByISBN) throw new Error(`ISBN = ${isbn} is already exists`);

//     return await prisma.book.create({
//       data: {
//         tittle,
//         isbn,
//         description,
//         category,
//         authorId,
//       },
//     });
//   }

//   static async get(page: number, limit: number) {
//     const offset = (page - 1) * limit;

//     const Books = await prisma.book.findMany({
//       where: {
//         deletedAt: null,
//       },
//       take: limit,
//       skip: offset,
//       include: {
//         authors: {
//           select: {
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     const totalBooks = await prisma.author.count();

//     const totalPage = Math.ceil(totalBooks / limit);

//     return {
//     totalPage,
//     limit,
//     Books,
//   };
//   }

//   static async delete({ isbn }: BookUncheckedDeletedInput) {
//     // temuin isbn yang di send dari postman apakah ada
//     const findBookByISBN = await prisma.book.findFirst({
//       where: {
//         isbn,
//       },
//     });
//     // validasi jika isbn yang diparams ditunjuk salah. maka throw new error
//     if (!findBookByISBN) throw new Error(`ISBN = ${isbn} isn't exists`);

//     return await prisma.book.delete({
//       where: {
//         isbn,
//       },
//     });
//   }
// }
