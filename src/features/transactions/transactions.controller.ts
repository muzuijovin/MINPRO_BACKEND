import { Request, Response } from "express";
import { AppError } from "../../errors/app.error";
import { validate } from "../../validators/validate";
import {
  transactionsConfirmSchema,
  transactionsCreateSchema,
  transactionsGetDetailSchema,
  transactionsGetSchema,
  transactionsUploadProofSchema,
} from "../../validatiors/transactions.validator";
import { TransactionsServices } from "./transactions.services";

export class TransactionsController {
  static async checkout(req: Request, res: Response) {
    const { body } = validate(transactionsCreateSchema, { body: req?.body });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const checkout = await TransactionsServices.checkout({ body }, payload?.id);

    res.status(201).json({
      success: true,
      message: "checkout successfully",
      data: checkout,
    });
  }

  static async getMyTransactions(req: Request, res: Response) {
    const { query } = validate(transactionsGetSchema, { query: req?.query });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const { page, totalPage, limit, transactions, totalTransactions } =
      await TransactionsServices.getMyTransactions({ query }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get transactions successfully",
      data: transactions,
      meta: {
        page,
        totalPage,
        limit,
        totalTransactions,
      },
    });
  }

  static async getOrganizerTransactions(req: Request, res: Response) {
    const { query } = validate(transactionsGetSchema, { query: req?.query });

    const { payload } = res.locals;

    const { page, totalPage, limit, transactions, totalTransactions } =
      await TransactionsServices.getOrganizerTransactions({ query }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get organizer transactions successfully",
      data: transactions,
      meta: {
        page,
        totalPage,
        limit,
        totalTransactions,
      },
    });
  }

  static async getTransactionDetail(req: Request, res: Response) {
    const { params } = validate(transactionsGetDetailSchema, { params: req?.params });

    const { payload } = res.locals;

    const transaction = await TransactionsServices.getTransactionDetail({ params }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get transaction detail successfully",
      data: transaction,
    });
  }

  static async uploadPaymentProof(req: Request, res: Response) {
    const { params } = validate(transactionsUploadProofSchema, { params: req?.params });

    const file = (
      req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
    )?.["paymentProof"]?.[0];

    const { payload } = res.locals;

    const uploadPaymentProof = await TransactionsServices.uploadPaymentProof({ params }, file, payload?.id);

    res.status(200).json({
      success: true,
      message: "upload payment proof successfully",
      data: uploadPaymentProof,
    });
  }

  // dipanggil cron-job.org tiap menit di production, dilindungi secret di header biar tidak bisa dipanggil sembarang orang
  static async expireOverdueTransactions(req: Request, res: Response) {
    if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET)
      throw new AppError(401, "Invalid cron secret");

    const result = await TransactionsServices.expireOverdueTransactions();

    res.status(200).json({
      success: true,
      message: "expire overdue transactions successfully",
      data: result,
    });
  }

  static async confirmPayment(req: Request, res: Response) {
    const { params, body } = validate(transactionsConfirmSchema, {
      params: req?.params,
      body: req?.body,
    });

    const { payload } = res.locals;

    const confirmPayment = await TransactionsServices.confirmPayment({ params, body }, payload?.id);

    res.status(200).json({
      success: true,
      message: `payment ${body.decision.toLowerCase()} successfully`,
      data: confirmPayment,
    });
  }
}
