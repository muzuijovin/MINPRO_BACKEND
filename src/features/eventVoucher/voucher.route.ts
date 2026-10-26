import { Router } from "express";
import { VoucherController } from "./voucher.controller";
import { authenticate, authorize } from "../../middleware/auths.middleware";

export const VoucherRoute = Router();

// hanya user dengan role EO (organizer) yang boleh create voucher
// urutannya wajib authenticate dulu (cek token & simpan payload), baru authorize (cek role)
VoucherRoute.post('/', authenticate, authorize(["EO"]), VoucherController.createVoucher)
VoucherRoute.get('/', VoucherController.getVoucher)
VoucherRoute.get('/:id', VoucherController.getVoucherDetail)
VoucherRoute.delete('/:id', VoucherController.deleteVoucher)
VoucherRoute.put('/:id', VoucherController.updateVoucher)
