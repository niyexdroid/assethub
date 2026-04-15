import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { SubaccountService } from './subaccount.service';

const router = Router();
const svc    = new SubaccountService();

const createSchema = z.object({
  business_name:  z.string().min(2),
  bank_code:      z.string().min(3),
  account_number: z.string().length(10),
  account_name:   z.string().min(2),
});

router.use(authenticate);

router.post('/', authorize('landlord'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input  = createSchema.parse(req.body);
    const result = await svc.create(req.user!.id, input);
    res.status(201).json(result);
  } catch (err) { return next(err); }
});

router.get('/', authorize('landlord'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.get(req.user!.id);
    res.json(result);
  } catch (err) { return next(err); }
});

router.get('/banks', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banks = await svc.listBanks();
    res.json(banks);
  } catch (err) { return next(err); }
});

router.get('/resolve-account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account_number, bank_code } = req.query as Record<string, string>;
    if (!account_number || !bank_code) {
      return res.status(400).json({ error: 'account_number and bank_code required' });
    }
    const result = await svc.resolveAccount(account_number, bank_code);
    return res.json(result);
  } catch (err) { return next(err); }
});

export default router;
