import express from 'express';

export const createDeliveryOptionRouter = (db) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { expand } = req.query;
      const shouldExpandEstimatedDeliveryTime = expand === 'estimatedDeliveryTime';

      const deliveryOptions = await db.DeliveryOption.findAll({ order: [['id', 'ASC']] });

      if (!shouldExpandEstimatedDeliveryTime) {
        return res.json(deliveryOptions);
      }

      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const currentTimeMs = Date.now();

      const expandedDeliveryOptions = deliveryOptions.map((deliveryOption) => {
        const plainDeliveryOption = deliveryOption.get({ plain: true });

        return {
          ...plainDeliveryOption,
          deliveryTimeMs: currentTimeMs + plainDeliveryOption.deliveryDays * millisecondsPerDay
        };
      });

      return res.json(expandedDeliveryOptions);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch delivery options' });
    }
  });

  return router;
};
