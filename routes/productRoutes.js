import express from 'express';

export const createProductRouter = (db) => {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const products = await db.Product.findAll({ order: [['name', 'ASC']] });
      res.json(products);
    } catch (_error) {
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const product = await db.Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.json(product);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch product' });
    }
  });

  router.post('/', async (req, res) => {
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

      return res.status(201).json(product);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to create product' });
    }
  });

  return router;
};
