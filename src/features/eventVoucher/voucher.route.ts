import { Router } from "express";
import { VoucherController } from "./voucher.controller";

export const VoucherRoute = Router();

VoucherRoute.post('/', VoucherController.createVoucher)
VoucherRoute.get('/', VoucherController.getVoucher)
VoucherRoute.get('/:id', VoucherController.getVoucherDetail)
VoucherRoute.delete('/:id', VoucherController.deleteVoucher)
VoucherRoute.put('/:id', VoucherController.updateVoucher)
