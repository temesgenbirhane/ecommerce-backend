import express from 'express';

export const createDeliveryOptionRouter = (db) => {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const deliveryOptions = await db.DeliveryOption.findAll({ order: [['id', 'ASC']] });
      res.json(deliveryOptions);
    } catch (_error) {
      res.status(500).json({ message: 'Failed to fetch delivery options' });
    }
  });

  return router;
};
