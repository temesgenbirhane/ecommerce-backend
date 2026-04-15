import express from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './models/index.js';
import {
  seedDefaultCart,
  seedDefaultDeliveryOptions,
  seedDefaultOrders,
  seedDefaultProducts
} from './defaultData/defaultData.js';
import { createSystemRouter } from './routes/systemRoutes.js';
import { createProductRouter } from './routes/productRoutes.js';
import { createDeliveryOptionRouter } from './routes/deliveryOptionRoutes.js';
import { createOrderRouter } from './routes/orderRoutes.js';
import { createCartItemRouter } from './routes/cartItemRoutes.js';
import { createPaymentSummaryRouter } from './routes/paymentSummaryRoutes.js';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/dist', express.static(distPath));
app.use(express.static(distPath));

app.use(
  '/api',
  createSystemRouter(db, {
    seedDefaultCart,
    seedDefaultDeliveryOptions,
    seedDefaultOrders,
    seedDefaultProducts
  })
);
app.use('/api/products', createProductRouter(db));
app.use('/api/delivery-options', createDeliveryOptionRouter(db));
app.use('/api/orders', createOrderRouter(db));
app.use('/api/cart-items', createCartItemRouter(db));
app.use('/api', createPaymentSummaryRouter(db));

app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  return res.sendFile(indexHtmlPath);
});

const runAutoSeed = async () => {
  const seedResult = await seedDefaultProducts(db.Product);
  const deliverySeedResult = await seedDefaultDeliveryOptions(db.DeliveryOption);
  const orderSeedResult = await seedDefaultOrders(db.Order, db.OrderItem);
  const cartSeedResult = await seedDefaultCart(db.CartItem);

  return {
    products: seedResult,
    deliveryOptions: deliverySeedResult,
    orders: orderSeedResult,
    cartItems: cartSeedResult
  };
};

const startServer = async () => {
  try {
    if (!existsSync(indexHtmlPath)) {
      throw new Error(`Missing frontend build file: ${indexHtmlPath}`);
    }

    await db.sequelize.sync();
    const autoSeedResult = await runAutoSeed();
    console.log('Auto-seed result:', autoSeedResult);

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on('error', (listenError) => {
      if (listenError?.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Run: npm run stop:3000`);
      } else {
        console.error('Server listen error:', listenError);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
