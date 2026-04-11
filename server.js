import express from 'express';
import db from './models/index.js';
import { seedDefaultProducts } from './defaultData/defaultData.js';

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

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

// Start server only after the database schema is ready.
const startServer = async () => {
  try {
    await db.sequelize.sync();

    const seedResult = await seedDefaultProducts(db.Product);

    if (!seedResult.skipped) {
      console.log(`Seeded ${seedResult.inserted} default products.`);
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