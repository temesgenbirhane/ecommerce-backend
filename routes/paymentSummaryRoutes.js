import express from 'express';

export const createPaymentSummaryRouter = (db) => {
  const router = express.Router();

  router.get('/payment-summary', async (_req, res) => {
    try {
      const cartItems = await db.CartItem.findAll({
        include: [
          {
            model: db.Product,
            as: 'product'
          },
          {
            model: db.DeliveryOption,
            as: 'deliveryOption'
          }
        ],
        order: [['id', 'ASC']]
      });

      const summary = cartItems.reduce(
        (totals, cartItem) => {
          const quantity = Number(cartItem.quantity);
          const productPriceCents = Number(cartItem.product.priceCents);
          const shippingCostCents = Number(cartItem.deliveryOption.priceCents);
          const lineProductCostCents = productPriceCents * quantity;

          totals.totalItemsInCart += quantity;
          totals.productsCostCents += lineProductCostCents;
          totals.shippingCostCents += shippingCostCents;
          return totals;
        },
        {
          totalItemsInCart: 0,
          productsCostCents: 0,
          shippingCostCents: 0
        }
      );

      const totalCostBeforeTaxCents = summary.productsCostCents + summary.shippingCostCents;
      const taxCents = Math.round(totalCostBeforeTaxCents * 0.1);
      const totalCostCents = totalCostBeforeTaxCents + taxCents;

      return res.json({
        totalItemsInCart: summary.totalItemsInCart,
        productsOnlyCostCents: summary.productsCostCents,
        shippingOnlyCostCents: summary.shippingCostCents,
        totalCostBeforeTaxCents,
        taxCents,
        totalCostCents
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Failed to fetch payment summary' });
    }
  });

  return router;
};
