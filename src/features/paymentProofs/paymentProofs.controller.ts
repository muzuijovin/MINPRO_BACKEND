import { Request, Response } from "express";
import { validate } from "../../validators/validate";
import { paymentProofsGetByTransactionSchema } from "../../validatiors/paymentProofs.validator";
import { PaymentProofsServices } from "./paymentProofs.services";

export class PaymentProofsController {
  static async getPaymentProofsByTransaction(req: Request, res: Response) {
    const { params } = validate(paymentProofsGetByTransactionSchema, { params: req?.params });

    // id user yang login, diisi authenticate middleware dari token
    const { payload } = res.locals;

    const paymentProofs = await PaymentProofsServices.getPaymentProofsByTransaction({ params }, payload?.id);

    res.status(200).json({
      success: true,
      message: "get payment proofs successfully",
      data: paymentProofs,
    });
  }
}
