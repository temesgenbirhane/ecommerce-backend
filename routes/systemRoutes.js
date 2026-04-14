import express from 'express';

export const createSystemRouter = (db, seeders) => {
  const router = express.Router();
  const {
    seedDefaultCart,
    seedDefaultDeliveryOptions,
    seedDefaultOrders,
    seedDefaultProducts
  } = seeders;

  router.get('/', (_req, res) => {
    res.send('Hello World! 🚀 My Express Server is Running');
  });

  router.get('/hello', (_req, res) => {
    res.json({
      message: 'Welcome to the API',
      status: 'success',
      time: new Date().toISOString()
    });
  });

  router.post('/hello', (req, res) => {
    const { name } = req.body;

    res.json({
      message: `Hello ${name || 'there'}!`,
      received: req.body
    });
  });

  router.post('/reset', async (_req, res) => {
    try {
      await db.sequelize.truncate({
        cascade: true,
        restartIdentity: true
      });

      const productCount = await db.Product.count();
      let seeded = null;

      if (productCount === 0) {
        const seedResult = await seedDefaultProducts(db.Product);
        const deliverySeedResult = await seedDefaultDeliveryOptions(db.DeliveryOption);
        const orderSeedResult = await seedDefaultOrders(db.Order, db.OrderItem);
        const cartSeedResult = await seedDefaultCart(db.CartItem);

        seeded = {
          products: seedResult,
          deliveryOptions: deliverySeedResult,
          orders: orderSeedResult,
          cartItems: cartSeedResult
        };
      }

      res.status(200).json({
        message: seeded ? 'Database reset and reseed successful' : 'Database reset successful',
        seeded
      });
    } catch (_error) {
      res.status(500).json({ message: 'Failed to reset database' });
    }
  });

  return router;
};
