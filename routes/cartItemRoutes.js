import express from 'express';

export const createCartItemRouter = (db) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { expand } = req.query;
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

      return res.json(expandedCartItems);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch cart items' });
    }
  });

  router.post('/', async (req, res) => {
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

      return res.status(201).json(cartItem);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to add item to cart' });
    }
  });

  router.put('/:productId', async (req, res) => {
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
      return res.json(cartItem);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  router.delete('/:productId', async (req, res) => {
    try {
      const { productId } = req.params;

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
      return res.status(500).json({ message: 'Failed to delete cart item' });
    }
  });

  return router;
};
