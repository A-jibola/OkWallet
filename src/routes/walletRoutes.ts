import { Router } from "express";
import userController from "../controllers/userController";
import walletController from "../controllers/walletController";

const router = Router();

router.route('/')
    .get(userController.authenticate, walletController.getWallet);

router.route('/credit')
    .post(userController.authenticate, walletController.creditWalletFromExternal);

router.route('/creditAnother')
    .post(userController.authenticate, walletController.creditWalletToWallet);

router.route('/debit')
    .post(userController.authenticate, walletController.debitWallet);

export default router;