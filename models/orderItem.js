export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      orderId: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      productId: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      estimatedDeliveryTimeMs: {
        type: DataTypes.BIGINT,
        allowNull: false
      }
    },
    {
      tableName: 'order_items',
      underscored: true
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return OrderItem;
};
