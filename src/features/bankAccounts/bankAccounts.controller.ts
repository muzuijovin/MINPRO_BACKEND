import { Request, Response } from "express";
import { validate } from "../../validators/validate";
import {
  bankAccountsCreateSchema,
  bankAccountsGetByEventSchema,
  bankAccountsUpdatedSchema,
} from "../../validatiors/bankAccounts.validator";
import { BankAccountsServices } from "./bankAccounts.services";

export class BankAccountsController {
  static async createBankAccount(req: Request, res: Response) {
    const { body } = validate(bankAccountsCreateSchema, { body: req?.body });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const create = await BankAccountsServices.createBankAccount({ body }, payload?.id);

    res.status(201).json({
      success: true,
      message: "create bank account successfully",
      data: create,
    });
  }

  static async getMyBankAccounts(req: Request, res: Response) {
    const { payload } = res.locals;

    const bankAccounts = await BankAccountsServices.getMyBankAccounts(payload?.id);

    res.status(200).json({
      success: true,
      message: "get bank accounts successfully",
      data: bankAccounts,
    });
  }

  static async getBankAccountsByEvent(req: Request, res: Response) {
    const { params } = validate(bankAccountsGetByEventSchema, { params: req?.params });

    const bankAccounts = await BankAccountsServices.getBankAccountsByEvent({ params });

    res.status(200).json({
      success: true,
      message: "get bank accounts successfully",
      data: bankAccounts,
    });
  }

  static async updateBankAccount(req: Request, res: Response) {
    const { params, body } = validate(bankAccountsUpdatedSchema, {
      params: req?.params,
      body: req?.body,
    });

    const { payload } = res.locals;

    const updateData = await BankAccountsServices.updateBankAccount({ params, body }, payload?.id);

    res.status(200).json({
      success: true,
      message: "update bank account successfully",
      data: updateData,
    });
  }
}
