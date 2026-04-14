import express from 'express';
import { randomUUID } from 'crypto';

const orderInclude = (db, shouldExpandProducts) => [
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
];

export const createOrderRouter = (db) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { expand } = req.query;
      const shouldExpandProducts = expand === 'products';

      const orders = await db.Order.findAll({
        order: [['orderTimeMs', 'DESC']],
        include: orderInclude(db, shouldExpandProducts)
      });

      return res.json(orders);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  router.get('/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { expand } = req.query;
      const shouldExpandProducts = expand === 'products';

      const order = await db.Order.findByPk(orderId, {
        include: orderInclude(db, shouldExpandProducts)
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.json(order);
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const cart = await db.CartItem.findAll({
        order: [['id', 'ASC']]
      });

      if (cart.length === 0) {
        return res.status(400).json({
          message: 'cart is required and must be a non-empty array'
        });
      }

      const normalizedCart = cart.map((item, index) => {
        const quantity = Number(item?.quantity);

        if (!item?.productId) {
          throw new Error(`cart[${index}].productId is required`);
        }

        if (!item?.deliveryOptionId) {
          throw new Error(`cart[${index}].deliveryOptionId is required`);
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error(`cart[${index}].quantity must be a positive integer`);
        }

        return {
          productId: item.productId,
          deliveryOptionId: item.deliveryOptionId,
          quantity
        };
      });

      const productIds = normalizedCart.map((item) => item.productId);
      const duplicateProductIds = productIds.filter((productId, index) => productIds.indexOf(productId) !== index);

      if (duplicateProductIds.length > 0) {
        return res.status(400).json({
          message: 'cart contains duplicate productId values'
        });
      }

      const uniqueProductIds = [...new Set(productIds)];
      const uniqueDeliveryOptionIds = [...new Set(normalizedCart.map((item) => item.deliveryOptionId))];

      const [products, deliveryOptions] = await Promise.all([
        db.Product.findAll({
          where: {
            id: uniqueProductIds
          }
        }),
        db.DeliveryOption.findAll({
          where: {
            id: uniqueDeliveryOptionIds
          }
        })
      ]);

      if (products.length !== uniqueProductIds.length) {
        return res.status(400).json({ message: 'cart contains invalid productId values' });
      }

      if (deliveryOptions.length !== uniqueDeliveryOptionIds.length) {
        return res.status(400).json({ message: 'cart contains invalid deliveryOptionId values' });
      }

      const productsById = new Map(products.map((product) => [product.id, product]));
      const deliveryOptionsById = new Map(deliveryOptions.map((option) => [option.id, option]));
      const orderTimeMs = Date.now();
      const millisecondsPerDay = 24 * 60 * 60 * 1000;

      const calculatedItems = normalizedCart.map((item) => {
        const product = productsById.get(item.productId);
        const deliveryOption = deliveryOptionsById.get(item.deliveryOptionId);
        const productCostCents = Number(product.priceCents) * item.quantity;
        const shippingCostCents = Number(deliveryOption.priceCents);

        return {
          productId: item.productId,
          quantity: item.quantity,
          estimatedDeliveryTimeMs: orderTimeMs + Number(deliveryOption.deliveryDays) * millisecondsPerDay,
          lineTotalBeforeTaxCents: productCostCents + shippingCostCents
        };
      });

      const subtotalBeforeTaxCents = calculatedItems.reduce(
        (sum, item) => sum + item.lineTotalBeforeTaxCents,
        0
      );
      const totalCostCents = Math.round(subtotalBeforeTaxCents * 1.1);
      const orderId = randomUUID();

      await db.sequelize.transaction(async (transaction) => {
        await db.Order.create(
          {
            id: orderId,
            orderTimeMs,
            totalCostCents
          },
          { transaction }
        );

        await db.OrderItem.bulkCreate(
          calculatedItems.map((item) => ({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            estimatedDeliveryTimeMs: item.estimatedDeliveryTimeMs
          })),
          { transaction }
        );

        await db.CartItem.destroy({
          where: {},
          transaction
        });
      });

      const createdOrder = await db.Order.findByPk(orderId, {
        include: [
          {
            model: db.OrderItem,
            as: 'products',
            attributes: ['productId', 'quantity', 'estimatedDeliveryTimeMs']
          }
        ]
      });

      return res.status(201).json(createdOrder);
    } catch (error) {
      if (error.message?.startsWith('cart[')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Failed to create order' });
    }
  });

  return router;
};
