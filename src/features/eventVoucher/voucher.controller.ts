import { Request, Response } from "express";
import {
  voucherCreateSchema,
  voucherDeletedSchema,
  voucherGetDetailSchema,
  voucherGetSchema,
  voucherUpdatedSchema,
} from "../../validatiors/voucher.validator";
import { validate } from "../../validators/validate";
import { VoucherServices } from "./voucher.services";

export class VoucherController {
  static async createVoucher(req: Request, res: Response) {
    const { body } = validate(voucherCreateSchema, { body: req?.body });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const create = await VoucherServices.createVoucher({ body }, payload?.id);

    res.status(201).json({
      success: true,
      message: "create voucher successfully",
      data: create,
    });
  }

  static async getVoucher(req: Request, res: Response) {
    const { query } = validate(voucherGetSchema, { query: req?.query });

    const { page, totalPage, limit, vouchers, totalVouchers } =
      await VoucherServices.getVoucher({ query });

    res.status(200).json({
      success: true,
      message: "get voucher successfully",
      data: vouchers,
      meta: {
        page,
        totalPage,
        limit,
        totalVouchers,
      },
    });
  }

  static async getVoucherDetail(req: Request, res: Response) {
    const { params } = validate(voucherGetDetailSchema, { params: req?.params });

    const voucher = await VoucherServices.getVoucherDetail({ params });

    res.status(200).json({
      success: true,
      message: "get voucher detail successfully",
      data: voucher,
    });
  }

  static async deleteVoucher(req: Request, res: Response) {
    const { params } = validate(voucherDeletedSchema, { params: req?.params });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const deleteData = await VoucherServices.deleteVoucher(
      { params },
      payload?.id,
    );

    res.status(200).json({
      success: true,
      message: "delete voucher successfully",
      data: deleteData,
    });
  }

  static async updateVoucher(req: Request, res: Response) {
    // params & body divalidasi sekaligus karena schema nya mewajibkan keduanya
    // (kalau divalidasi terpisah, validasi pertama gagal karena body nya undefined)
    const { params, body } = validate(voucherUpdatedSchema, {
      params: req?.params,
      body: req?.body,
    });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const updateData = await VoucherServices.updateVoucher(
      { params, body },
      payload?.id,
    );

    res.status(200).json({
      success: true,
      message: "update voucher successfully",
      data: updateData,
    });
  }
}
