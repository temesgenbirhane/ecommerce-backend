import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './models/index.js';
import { seedDefaultCart, seedDefaultDeliveryOptions, seedDefaultOrders, seedDefaultProducts } from './defaultData/defaultData.js';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello World! 🚀 My Express Server is Running');
});

// Another simple route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    status: 'success',
    time: new Date().toISOString()
  });
});

// POST example
app.post('/api/hello', (req, res) => {
  const { name } = req.body;
  
  res.json({
    message: `Hello ${name || 'there'}!`,
    received: req.body
  });
});

// Product routes
app.get('/products', async (req, res) => {
  try {
    const products = await db.Product.findAll({ order: [['name', 'ASC']] });
    res.json(products);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { id, image, name, rating, priceCents, keywords } = req.body;

    if (!id || !image || !name || priceCents === undefined) {
      return res.status(400).json({
        message: 'id, image, name, and priceCents are required'
      });
    }

    const product = await db.Product.create({
      id,
      image,
      name,
      rating: rating ?? { stars: 0, count: 0 },
      priceCents,
      keywords: Array.isArray(keywords) ? keywords : []
    });

    res.status(201).json(product);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Delivery option routes
app.get('/delivery-options', async (_req, res) => {
  try {
    const deliveryOptions = await db.DeliveryOption.findAll({ order: [['id', 'ASC']] });
    res.json(deliveryOptions);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch delivery options' });
  }
});

// Order routes
app.get('/orders', async (_req, res) => {
  try {
    const { expand } = _req.query;
    const shouldExpandProducts = expand === 'products';

    const orders = await db.Order.findAll({
      order: [['orderTimeMs', 'DESC']],
      include: [
        {
          model: db.OrderItem,
          as: 'products',
          attributes: ['productId', 'quantity', 'estimatedDeliveryTimeMs'],
          ...(shouldExpandProducts
            ? {
                include: [
                  {
                    model: db.Product,
                    as: 'product'
                  }
                ]
              }
            : {})
        }
      ]
    });

    res.json(orders);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Cart routes
app.get('/cart-items', async (_req, res) => {
  try {
    const { expand } = _req.query;
    const shouldExpandProduct = expand === 'product';

    const cartItems = await db.CartItem.findAll({
      order: [['id', 'ASC']],
      ...(shouldExpandProduct
        ? {
            include: [
              {
                model: db.Product,
                as: 'product'
              }
            ]
          }
        : {})
    });

    if (!shouldExpandProduct) {
      return res.json(cartItems);
    }

    const expandedCartItems = cartItems.map((cartItem) => {
      const plainCartItem = cartItem.get({ plain: true });
      const { product, ...rest } = plainCartItem;

      return {
        ...rest,
        product
      };
    });

    res.json(expandedCartItems);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

app.post('/cart-items', async (req, res) => { // Mind you this is a post api, so we cant use the browser to test it.
  // in order to test it, you can use a tool like Postman or curl 
  try {
    const { productId, quantity } = req.body;
    const parsedQuantity = Number(quantity);
    const defaultDeliveryOptionId = '1';

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      return res.status(400).json({
        message: 'quantity must be a number between 1 and 10'
      });
    }

    const product = await db.Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingCartItem = await db.CartItem.findOne({
      where: {
        productId
      }
    });

    if (existingCartItem) {
      existingCartItem.quantity += parsedQuantity;
      await existingCartItem.save();

      return res.status(200).json(existingCartItem);
    }

    const cartItem = await db.CartItem.create({
      productId,
      quantity: parsedQuantity,
      deliveryOptionId: defaultDeliveryOptionId
    });

    res.status(201).json(cartItem);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

app.put('/cart-items/:productId', async (req, res) => { // PUT means update. :/productId is a parameter that will be replaced with 
// the actual productId when the API is called. for example, if you want to update 
// the cart item with productId '123', you would make a PUT request to /cart-items/123
  try {
    const { productId } = req.params;
    const { quantity, deliveryOptionId } = req.body;

    if (quantity === undefined && deliveryOptionId === undefined) {
      return res.status(400).json({
        message: 'Provide quantity or deliveryOptionId to update'
      });
    }

    const cartItem = await db.CartItem.findOne({
      where: {
        productId
      }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);

      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
        return res.status(400).json({
          message: 'quantity must be a number between 1 and 10'
        });
      }

      cartItem.quantity = parsedQuantity;
    }

    if (deliveryOptionId !== undefined) {
      const deliveryOption = await db.DeliveryOption.findByPk(deliveryOptionId);

      if (!deliveryOption) {
        return res.status(400).json({
          message: 'deliveryOptionId is invalid'
        });
      }

      cartItem.deliveryOptionId = deliveryOptionId;
    }

    await cartItem.save();
    res.json(cartItem);
  } catch (_error) {
    res.status(500).json({ message: 'Failed to update cart item' });
  }
});

app.delete('/cart-items/:productId', async (req, res) => {
  try {
    const { productId } = req.params; // get the productId from the URL parameter

    const cartItem = await db.CartItem.findOne({
      where: {
        productId
      }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();
    return res.status(204).send();
  } catch (_error) {
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
});

// Start server only after the database schema is ready.
const startServer = async () => {
  try {
    await db.sequelize.sync();

    const seedResult = await seedDefaultProducts(db.Product);

    if (!seedResult.skipped) {
      console.log(`Seeded ${seedResult.inserted} default products.`);
    }

    const orderSeedResult = await seedDefaultOrders(db.Order, db.OrderItem);

    if (!orderSeedResult.skipped) {
      console.log(`Seeded ${orderSeedResult.insertedOrders} default orders.`);
      console.log(`Seeded ${orderSeedResult.insertedOrderItems} default order items.`);
    }

    const deliverySeedResult = await seedDefaultDeliveryOptions(db.DeliveryOption);

    if (!deliverySeedResult.skipped) {
      console.log(`Seeded ${deliverySeedResult.inserted} default delivery options.`);
    }

    const cartSeedResult = await seedDefaultCart(db.CartItem);

    if (!cartSeedResult.skipped) {
      console.log(`Seeded ${cartSeedResult.inserted} default cart items.`);
    }

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