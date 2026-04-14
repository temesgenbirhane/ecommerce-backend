import express from 'express';
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

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  createSystemRouter(db, {
    seedDefaultCart,
    seedDefaultDeliveryOptions,
    seedDefaultOrders,
    seedDefaultProducts
  })
);
app.use('/products', createProductRouter(db)); // adds /products routes at the start of the url,
//  so in productRoutes.js becomes only '/' and '/:id' instead of '/products/' and '/products/:id'
app.use('/delivery-options', createDeliveryOptionRouter(db));
app.use('/orders', createOrderRouter(db));
app.use('/cart-items', createCartItemRouter(db));
app.use(createPaymentSummaryRouter(db));

const startServer = async () => {
  try {
    await db.sequelize.sync();

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
